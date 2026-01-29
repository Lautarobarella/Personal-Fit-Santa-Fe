package com.personalfit.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.personalfit.dto.Payment.MonthlyRevenueDTO;
import com.personalfit.dto.Payment.PaymentRequestDTO;
import com.personalfit.dto.Payment.PaymentStatusUpdateDTO;
import com.personalfit.dto.Payment.PaymentTypeDTO;
import com.personalfit.enums.PaymentStatus;
import com.personalfit.enums.UserRole;
import com.personalfit.enums.UserStatus;
import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.exceptions.EntityNotFoundException;
import com.personalfit.exceptions.FileException;
import com.personalfit.models.MonthlyRevenue;
import com.personalfit.models.Payment;
import com.personalfit.models.PaymentFile;
import com.personalfit.models.User;
import com.personalfit.repository.MonthlyRevenueRepository;
import com.personalfit.repository.PaymentFileRepository;
import com.personalfit.repository.PaymentRepository;

import lombok.extern.slf4j.Slf4j;

/**
 * Service Layer: Payment Management
 * 
 * Central hub for all financial transactions within the system.
 * 
 * Architectural Responsibilities:
 * 1. Transaction Management: Handles creation, validation, and status updates
 * of payments.
 * 2. File Handling: Manages storage and retrieval of payment receipts
 * (images/PDFs).
 * 3. Revenue Analytics: Calculates real-time and historical revenue data.
 * 4. Automated Jobs: Scheduled tasks for expiration checks and payment
 * reminders.
 * 
 * Integrations:
 * - UserService: To link payments to specific users and update their membership
 * status.
 * - NotificationService: To trigger alerts for due payments, expirations, or
 * confirmations.
 * - PaymentRepository: Direct database access for transactions.
 */
@Slf4j
@Service
public class PaymentService {

    // Maximum allowed size for receipt files (3MB).
    // Files are pre-compressed on the client-side before upload.
    private static final Integer MAX_FILE_SIZE_MB = 3;

    @Value("${spring.datasource.files.path}")
    private String UPLOAD_FOLDER;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentFileRepository paymentFileRepository;

    @Autowired
    private MonthlyRevenueRepository monthlyRevenueRepository;

    @Autowired
    @Lazy // Circular dependency breaker: UserService also depends on PaymentService
    private UserService userService;

    @Autowired
    @Lazy
    private NotificationService notificationService;

    @Autowired
    private SettingsService settingsService;

    /**
     * Creates a new payment transaction.
     * Supports both Single-User and Multi-User (Group) payments.
     * 
     * Process:
     * 1. Validates business rules (e.g., preventing duplicate active payments).
     * 2. Persists the payment record with PENDING status.
     * 3. Stores the optional receipt file if provided.
     * 4. Updates User status to ACTIVE if the payment is immediately marked as
     * PAID.
     * 
     * @param paymentRequest DTO containing amount, method, and target users.
     * @param file           Optional receipt file (image/pdf).
     * @return The persisted Payment entity.
     */
    @Transactional
    public Payment createPayment(PaymentRequestDTO paymentRequest, MultipartFile file) {
        // 1. Resolve Target Users
        List<User> users = getUsersForPayment(paymentRequest);

        // 2. Business Validation
        for (User user : users) {
            validatePaymentCreation(user);
        }

        // 3. Resolve Creator (Admin or Self)
        User createdByUser = null;
        if (paymentRequest.getCreatedByDni() != null) {
            createdByUser = userService.getUserByDni(paymentRequest.getCreatedByDni());
        }

        // 4. Build Entity
        Payment payment = buildPayment(paymentRequest);

        if (createdByUser != null) {
            payment.setCreatedBy(createdByUser);
        }

        // 5. File Processing
        if (file != null && !file.isEmpty()) {
            PaymentFile paymentFile = processPaymentFile(file);
            payment.setPaymentFile(paymentFile);
        }

        // 6. Link Users & Payment
        Set<User> paymentUsers = new HashSet<>();
        for (User user : users) {
            paymentUsers.add(user);

            // Side Effect: Activate user if payment is inherently trusted/paid
            updateUserStatusIfPaid(user, payment);
        }

        payment.setUsers(paymentUsers);

        // 7. Persist (Cascade will save relationships)
        Payment savedPayment = paymentRepository.save(payment);

        log.info("Payment created successfully: ID={}, Users={}, Amount={}, CreatedBy={}",
                savedPayment.getId(), users.size(), savedPayment.getAmount(),
                createdByUser != null ? createdByUser.getFullName() : "N/A");

        return savedPayment;
    }

    /**
     * Webhook Entry Point.
     * Facade for creating payments triggered by external providers (MercadoPago).
     * Does not require a file attachment.
     */
    @Transactional
    public Payment createWebhookPayment(PaymentRequestDTO paymentRequest) {
        return createPayment(paymentRequest, null);
    }

    /**
     * Batch Creation via Admin Panel.
     * Optimized for processing multiple distinct payments in a single request.
     * 
     * Implementation Notes:
     * - Skips invalid requests instead of aborting the entire batch.
     * - Uses `saveAll` for JDBC batching performance.
     * 
     * @param paymentRequests List of individual payment DTOs.
     * @return Count of successfully created payments.
     */
    @Transactional
    public Integer createBatchPayments(List<PaymentRequestDTO> paymentRequests) {
        List<Payment> paymentsToSave = new ArrayList<>();

        for (PaymentRequestDTO paymentRequest : paymentRequests) {
            try {
                // Resolve Users
                List<User> users = getUsersForPayment(paymentRequest);

                // Logic Constraint: Batch payments currently support 1 user per transaction row
                if (users.size() != 1) {
                    log.warn("Skipping multi-user batch row: DNIs={}", paymentRequest.getAllDnis());
                    continue;
                }

                User user = users.get(0);

                // Validation: Must be a CLIENT
                if (!user.getRole().equals(UserRole.CLIENT)) {
                    log.warn("Skipping payment for non-client: DNI={}, Role={}", user.getDni(), user.getRole());
                    continue;
                }

                // Force PENDING status for manual entry safety
                PaymentRequestDTO batchRequest = PaymentRequestDTO.builder()
                        .clientId(paymentRequest.getClientId())
                        .clientDni(paymentRequest.getClientDni())
                        .amount(paymentRequest.getAmount())
                        .methodType(paymentRequest.getMethodType())
                        .paymentStatus(PaymentStatus.PENDING)
                        .createdAt(paymentRequest.getCreatedAt() != null ? paymentRequest.getCreatedAt()
                                : LocalDateTime.now())
                        .expiresAt(paymentRequest.getExpiresAt())
                        .confNumber(paymentRequest.getConfNumber())
                        .build();

                Payment payment = buildPayment(batchRequest);
                payment.setUsers(Set.of(user));
                paymentsToSave.add(payment);

            } catch (Exception e) {
                log.error("Error processing batch payment item: {}", e.getMessage());
            }
        }

        // Batch insert
        List<Payment> savedPayments = paymentRepository.saveAll(paymentsToSave);

        log.info("Batch payments executed: {} success / {} requested",
                savedPayments.size(), paymentRequests.size());

        return savedPayments.size();
    }

    /**
     * Admin Dashboard: List All Payments.
     * Scoped to the current month to prevent loading massive historical datasets.
     */
    public List<PaymentTypeDTO> getAllPayments() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1);

        return paymentRepository.findAllPaymentsInMonth(startOfMonth, endOfMonth).stream()
                .map(payment -> {
                    PaymentTypeDTO dto = convertToPaymentTypeDTO(payment);
                    // Dynamic Status Calculation: Check expiration on read-time
                    if (payment.getStatus() == PaymentStatus.PAID &&
                            payment.getExpiresAt() != null &&
                            payment.getExpiresAt().isBefore(LocalDateTime.now())) {
                        dto.setStatus(PaymentStatus.EXPIRED);
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * Historical Data Retrieval.
     * Fetches payments for a specific Month/Year window.
     */
    public List<PaymentTypeDTO> getPaymentsByMonthAndYear(Integer year, Integer month) {
        LocalDateTime startOfMonth = LocalDateTime.of(year, month, 1, 0, 0, 0);
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1);

        return paymentRepository.findAllPaymentsInMonth(startOfMonth, endOfMonth).stream()
                .map(payment -> {
                    PaymentTypeDTO dto = convertToPaymentTypeDTO(payment);
                    if (payment.getStatus() == PaymentStatus.PAID &&
                            payment.getExpiresAt() != null &&
                            payment.getExpiresAt().isBefore(LocalDateTime.now())) {
                        dto.setStatus(PaymentStatus.EXPIRED);
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * User Profile History.
     * Returns full payment history for a specific client.
     */
    public List<PaymentTypeDTO> getUserPayments(Long userId) {
        LocalDateTime now = LocalDateTime.now();

        // Optimized query to fetch payments with minimal N+1 issues
        List<Payment> userPayments = paymentRepository.findAllByUserIdWithDetails(userId);

        return userPayments.stream()
                .map(payment -> {
                    PaymentTypeDTO dto = convertToPaymentTypeDTO(payment);
                    if (payment.getStatus() == PaymentStatus.PAID &&
                            payment.getExpiresAt() != null &&
                            payment.getExpiresAt().isBefore(now)) {
                        dto.setStatus(PaymentStatus.EXPIRED);
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * Gets details of a specific payment.
     */
    public PaymentTypeDTO getPaymentDetails(Long paymentId) {
        Payment payment = getPaymentById(paymentId);
        return convertToPaymentTypeDTO(payment);
    }

    /**
     * Gets a payment with its associated file.
     */
    public Payment getPaymentWithFile(Long paymentId) {
        return getPaymentById(paymentId);
    }

    /**
     * Status Modification Workflow.
     * Handles transitions: PENDING -> PAID, PAID -> REJECTED, etc.
     * 
     * Side Effects:
     * - Activates users upon approval (PAID).
     * - Updates Revenue Stats instantly upon approval.
     */
    @Transactional
    public void updatePaymentStatus(Long paymentId, PaymentStatusUpdateDTO statusUpdate) {
        Payment payment = getPaymentById(paymentId);
        PaymentStatus newStatus = PaymentStatus.valueOf(statusUpdate.getStatus().toUpperCase());

        payment.setStatus(newStatus);
        payment.setUpdatedAt(LocalDateTime.now());

        if (newStatus == PaymentStatus.REJECTED && statusUpdate.getRejectionReason() != null) {
            payment.setRejectionReason(statusUpdate.getRejectionReason());
        }

        if (newStatus == PaymentStatus.PAID) {
            payment.setVerifiedAt(LocalDateTime.now());
            // Activate linked accounts
            if (payment.getUsers() != null) {
                for (User user : payment.getUsers()) {
                    updateUserStatusIfPaid(user, payment);
                }
            }
            // Update financial metrics
            updateMonthlyRevenue(payment.getAmount());
        }

        paymentRepository.save(payment);
        log.info("Payment status updated: ID={}, NewStatus={}", paymentId, newStatus);
    }

    /**
     * File System Retrieval.
     * Reads bytes from the disk storage based on the file ID.
     */
    public byte[] getFileContent(Long fileId) {
        PaymentFile paymentFile = getPaymentFileById(fileId);

        try {
            Path filePath = Paths.get(paymentFile.getFilePath());
            if (!Files.exists(filePath)) {
                throw new FileException("File not found on disk", "/api/files/" + fileId);
            }
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            log.error("IO Error reading file: {}", e.getMessage());
            throw new FileException("Error reading file content", "/api/files/" + fileId);
        }
    }

    /**
     * Gets information about a payment file.
     */
    public PaymentFile getPaymentFileInfo(Long fileId) {
        return getPaymentFileById(fileId);
    }

    // ===== PRIVATE HELPER METHODS =====

    /**
     * Resolver: Input DTO -> User Entities.
     * Handles lookup by ClientID, Single DNI, or Multiple DNIs.
     */
    private List<User> getUsersForPayment(PaymentRequestDTO paymentRequest) {
        List<User> users = new ArrayList<>();

        if (paymentRequest.isMultipleUsersPayment()) {
            for (Integer dni : paymentRequest.getClientDnis()) {
                User user = userService.getUserByDni(dni);
                users.add(user);
            }
        } else {
            if (paymentRequest.getClientId() != null) {
                User user = userService.getUserById(paymentRequest.getClientId());
                users.add(user);
            } else if (paymentRequest.getClientDni() != null) {
                User user = userService.getUserByDni(paymentRequest.getClientDni());
                users.add(user);
            } else {
                throw new BusinessRuleException("Target client identifier missing", "/api/payments/new");
            }
        }

        return users;
    }

    private void validatePaymentCreation(User user) {
        // Validation Scope: Only applicable for manual Client payments (not Webhooks)
        if (user.getRole().name().equals("CLIENT")) {
            Optional<Payment> lastPayment = paymentRepository.findTopByUserOrderByCreatedAtDesc(user);

            if (lastPayment.isPresent()) {
                Payment payment = lastPayment.get();
                if (payment.getStatus() == PaymentStatus.PENDING) {
                    throw new BusinessRuleException(
                            "User already has a pending payment awaiting verification",
                            "/api/payments/new");
                }

                if (payment.getStatus() == PaymentStatus.PAID) {
                    LocalDateTime expirationDate = payment.getExpiresAt();
                    if (expirationDate != null && expirationDate.isAfter(LocalDateTime.now())) {
                        throw new BusinessRuleException(
                                "User already has an active membership",
                                "/api/payments/new");
                    }
                }
            }
        }
    }

    private Payment buildPayment(PaymentRequestDTO request) {
        return Payment.builder()
                .amount(request.getAmount())
                .methodType(request.getMethodType())
                .status(request.getPaymentStatus())
                .createdAt(request.getCreatedAt() != null ? request.getCreatedAt() : LocalDateTime.now())
                .expiresAt(request.getExpiresAt())
                .confNumber(request.getConfNumber())
                .notes(request.getNotes())
                .build();
    }

    /**
     * File Processor.
     * Saves uploaded MultipartFile to disk and creates metadata record.
     */
    private PaymentFile processPaymentFile(MultipartFile file) {
        validateFile(file);

        try {
            Path uploadDir = Paths.get(UPLOAD_FOLDER);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            String uniqueFilename = "payment_" + System.currentTimeMillis() + fileExtension;

            Path filePath = uploadDir.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            PaymentFile paymentFile = PaymentFile.builder()
                    .fileName(originalFilename)
                    .filePath(filePath.toString())
                    .contentType(file.getContentType())
                    .compressedSize(file.getSize())
                    .isCompressed(true)
                    .build();

            return paymentFileRepository.save(paymentFile);

        } catch (IOException e) {
            log.error("Storage error: {}", e.getMessage());
            throw new FileException("Failed to store payment file", "/api/payments/new");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileException("File is empty", "/api/payments/new");
        }

        log.debug("Validating file: {} ({} bytes, type: {})",
                file.getOriginalFilename(), file.getSize(), file.getContentType());

        if (file.getSize() > MAX_FILE_SIZE_MB * 1024 * 1024) {
            throw new FileException("File exceeds " + MAX_FILE_SIZE_MB + "MB limit", "/api/payments/new");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            throw new FileException("Invalid file type. Only Images and PDF allowed.", "/api/payments/new");
        }
    }

    private void updateUserStatusIfPaid(User user, Payment payment) {
        if (payment.getStatus() == PaymentStatus.PAID && user.getStatus() == UserStatus.INACTIVE) {
            user.setStatus(UserStatus.ACTIVE);
            // JPA transaction will merge this user state change
        }
    }

    private Payment getPaymentById(Long paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Payment not found ID: " + paymentId,
                        "/api/payments/info/" + paymentId));
    }

    private PaymentFile getPaymentFileById(Long fileId) {
        return paymentFileRepository.findById(fileId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "File record not found ID: " + fileId,
                        "/api/files/" + fileId));
    }

    private PaymentTypeDTO convertToPaymentTypeDTO(Payment payment) {
        List<PaymentTypeDTO.PaymentUserInfo> associatedUsers = new ArrayList<>();

        if (payment.getUsers() != null && !payment.getUsers().isEmpty()) {
            // Priority 1: Created By
            if (payment.getCreatedBy() != null) {
                associatedUsers.add(PaymentTypeDTO.PaymentUserInfo.builder()
                        .userId(payment.getCreatedBy().getId())
                        .userName(payment.getCreatedBy().getFullName())
                        .userDni(payment.getCreatedBy().getDni())
                        .build());
            }

            // Priority 2: Other Linked Users
            for (User user : payment.getUsers()) {
                if (payment.getCreatedBy() != null && user.getId().equals(payment.getCreatedBy().getId())) {
                    continue; // Skip dupes
                }

                associatedUsers.add(PaymentTypeDTO.PaymentUserInfo.builder()
                        .userId(user.getId())
                        .userName(user.getFullName())
                        .userDni(user.getDni())
                        .build());
            }
        }

        // Determine "Primary" Client for Display
        Long primaryClientId = null;
        String primaryClientName = null;

        if (payment.getCreatedBy() != null) {
            primaryClientId = payment.getCreatedBy().getId();
            primaryClientName = payment.getCreatedBy().getFullName();
        } else if (!associatedUsers.isEmpty()) {
            PaymentTypeDTO.PaymentUserInfo firstUser = associatedUsers.get(0);
            primaryClientId = firstUser.getUserId();
            primaryClientName = firstUser.getUserName();
        }

        return PaymentTypeDTO.builder()
                .id(payment.getId())
                .clientId(primaryClientId)
                .clientName(primaryClientName)
                .associatedUsers(associatedUsers)
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .method(payment.getMethodType())
                .createdAt(payment.getCreatedAt())
                .expiresAt(payment.getExpiresAt())
                .verifiedAt(payment.getVerifiedAt())
                .verifiedBy(payment.getVerifiedBy() != null ? payment.getVerifiedBy().getFullName() : null)
                .rejectionReason(payment.getRejectionReason())
                .updatedAt(payment.getUpdatedAt())
                .receiptId(payment.getPaymentFile() != null ? payment.getPaymentFile().getId() : null)
                .receiptUrl(payment.getPaymentFile() != null ? "/api/files/" + payment.getPaymentFile().getId() : null)
                .notes(payment.getNotes())
                .build();
    }

    /**
     * CRON JOB: Daily Expiration Check (01:00 AM).
     * 1. Finds payments expiring 'today'.
     * 2. Sets status to EXPIRED.
     * 3. Deactivates associated Users.
     * 4. Triggers "Payment Vencido" notifications.
     */
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void checkPaidPayments() {
        log.info("Starting daily payment expiration process at 01:00 AM...");

        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
            LocalDateTime endOfDay = startOfDay.plusDays(1);

            List<Payment> expiredPayments = paymentRepository.findPaidPaymentsExpiringToday(startOfDay, endOfDay);

            if (expiredPayments.isEmpty()) {
                log.info("No payments expiring today");
                return;
            }

            List<User> usersWithExpiredPayments = new ArrayList<>();

            for (Payment payment : expiredPayments) {
                payment.setStatus(PaymentStatus.EXPIRED);
                payment.setUpdatedAt(LocalDateTime.now());

                if (payment.getUsers() != null) {
                    for (User user : payment.getUsers()) {
                        userService.updateUserStatus(user, UserStatus.INACTIVE);
                        usersWithExpiredPayments.add(user);
                    }
                }
            }

            paymentRepository.saveAll(expiredPayments);

            // Notify Users
            try {
                notificationService.createPaymentExpiredNotification(usersWithExpiredPayments, new ArrayList<>());
                log.info("Payment expiration notifications sent to {} users", usersWithExpiredPayments.size());
            } catch (Exception notifEx) {
                log.error("Error sending notifications: {}", notifEx.getMessage());
            }

        } catch (Exception e) {
            log.error("Error during daily expiration job", e);
        }
    }

    /**
     * CRON JOB: Daily Reminders (01:00 AM).
     * Notify users 3 days BEFORE expected expiration.
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void sendPaymentReminders() {
        try {
            log.info("Starting payment reminder job...");
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime threeDaysFromNow = now.plusDays(3);

            // Scope: Payments expiring exactly 3 days from now
            LocalDateTime startOfTargetDay = threeDaysFromNow.toLocalDate().atStartOfDay();
            LocalDateTime endOfTargetDay = startOfTargetDay.plusDays(1);

            // TODO: Optimize with repository query instead of filtering ALL payments in
            // memory
            List<Payment> upcomingPayments = paymentRepository.findAll()
                    .stream()
                    .filter(payment -> payment.getStatus() == PaymentStatus.PAID)
                    .filter(payment -> payment.getExpiresAt() != null)
                    .filter(payment -> payment.getExpiresAt().isAfter(startOfTargetDay)
                            && payment.getExpiresAt().isBefore(endOfTargetDay))
                    .collect(Collectors.toList());

            if (upcomingPayments.isEmpty()) {
                log.info("No payments due in the next 3 days");
                return;
            }

            for (Payment payment : upcomingPayments) {
                for (User user : payment.getUsers()) {
                    notificationService.sendPaymentDueReminder(user, payment.getAmount(),
                            payment.getExpiresAt().toLocalDate());
                }
                log.info("Payment reminder sent for payment ID: {} to {} users",
                        payment.getId(), payment.getUsers().size());
            }

            log.info("Payment reminders sent for {} payments", upcomingPayments.size());
        } catch (Exception e) {
            log.error("Error in reminder job", e);
        }
    }

    // ===== REVENUE ANALYTICS =====

    /**
     * Updates the running total for the current month's revenue in the DB.
     * Called whenever a Payment changes status to PAID.
     */
    @Transactional
    private void updateMonthlyRevenue(Double amount) {
        if (amount == null || amount <= 0) {
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        Integer year = now.getYear();
        Integer month = now.getMonthValue();

        MonthlyRevenue monthlyRevenue = monthlyRevenueRepository.findByYearAndMonth(year, month)
                .orElse(MonthlyRevenue.builder()
                        .year(year)
                        .month(month)
                        .totalRevenue(0.0)
                        .totalPayments(0)
                        .createdAt(now)
                        .build());

        monthlyRevenue.addRevenue(amount);
        monthlyRevenueRepository.save(monthlyRevenue);

        log.info("Monthly revenue updated: Year={}, Month={}, Amount={}, Total={}",
                year, month, amount, monthlyRevenue.getTotalRevenue());
    }

    /**
     * Real-Time Revenue Calculation.
     * Computes the sum of all verified payments for the current month on-the-fly.
     * Used for the Dashboard stats widget.
     */
    public MonthlyRevenueDTO getCurrentMonthRevenue() {
        LocalDateTime now = LocalDateTime.now();
        Integer year = now.getYear();
        Integer month = now.getMonthValue();

        LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1);

        Double totalRevenue = paymentRepository.calculateConfirmedRevenueInPeriod(startOfMonth, endOfMonth);

        List<Payment> paymentsThisMonth = paymentRepository.findAllPaymentsInMonth(startOfMonth, endOfMonth);
        Integer totalPayments = (int) paymentsThisMonth.stream()
                .filter(p -> p.getStatus() == PaymentStatus.PAID)
                .count();

        String monthName = now.getMonth().getDisplayName(TextStyle.FULL, Locale.forLanguageTag("es-ES"));

        log.info("Calculated current month revenue in real time: Year={}, Month={}, TotalRevenue={}, TotalPayments={}",
                year, month, totalRevenue, totalPayments);

        return MonthlyRevenueDTO.builder()
                .year(year)
                .month(month)
                .monthName(monthName)
                .totalRevenue(totalRevenue)
                .totalPayments(totalPayments)
                .isCurrentMonth(true)
                .build();
    }

    public List<MonthlyRevenueDTO> getArchivedMonthlyRevenues() {
        return monthlyRevenueRepository.findArchivedRevenues().stream()
                .map(revenue -> convertToMonthlyRevenueDTO(revenue, false))
                .collect(Collectors.toList());
    }

    private MonthlyRevenueDTO convertToMonthlyRevenueDTO(MonthlyRevenue revenue, boolean isCurrentMonth) {
        String monthName = java.time.Month.of(revenue.getMonth())
                .getDisplayName(TextStyle.FULL, Locale.forLanguageTag("es-ES"));

        return MonthlyRevenueDTO.builder()
                .id(revenue.getId())
                .year(revenue.getYear())
                .month(revenue.getMonth())
                .monthName(monthName)
                .totalRevenue(revenue.getTotalRevenue())
                .totalPayments(revenue.getTotalPayments())
                .createdAt(revenue.getCreatedAt())
                .updatedAt(revenue.getUpdatedAt())
                .archivedAt(revenue.getArchivedAt())
                .isCurrentMonth(isCurrentMonth)
                .build();
    }

    /**
     * CRON JOB: Monthly Archival (1st of month, 00:00).
     * "Freezes" the revenue stats for the previous month to ensure historical
     * accuracy.
     */
    @Scheduled(cron = "0 0 0 1 * ?")
    @Transactional
    public void archiveMonthlyRevenue() {
        try {
            log.info("Archiving previous month revenue...");

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime lastMonth = now.minusMonths(1);
            Integer lastYear = lastMonth.getYear();
            Integer lastMonthNumber = lastMonth.getMonthValue();

            Optional<MonthlyRevenue> lastMonthRevenue = monthlyRevenueRepository
                    .findByYearAndMonth(lastYear, lastMonthNumber);

            if (lastMonthRevenue.isPresent()) {
                MonthlyRevenue revenue = lastMonthRevenue.get();
                revenue.setArchivedAt(now);
                monthlyRevenueRepository.save(revenue);
                log.info("Archived: {}/{}", lastMonthNumber, lastYear);
            } else {
                log.info("No revenue found for previous month: Year={}, Month={}", lastYear, lastMonthNumber);
            }

            log.info("Monthly revenue archival process completed successfully");

        } catch (Exception e) {
            log.error("Error archiving revenue", e);
        }
    }

    /**
     * Access Control Check.
     * Determines if a user is allowed to enroll in classes based on payment
     * history.
     * 
     * Logic:
     * 1. ACTIVE users -> Allowed.
     * 2. INACTIVE users -> Allowed ONLY if they have a 'grace period' pending
     * payment.
     * 
     * @param userId User to check.
     * @return true if enrollment is permitted.
     */
    public Boolean canUserEnrollBasedOnPayment(Long userId) {
        try {
            User user = userService.getUserById(userId);

            // 1. Happy Path: Active Membership
            if (user.getStatus() == UserStatus.ACTIVE) {
                return true;
            }

            // 2. Grace Period Logic
            if (user.getStatus() == UserStatus.INACTIVE) {
                // Find most recent pending payment
                List<Payment> pendingPayments = paymentRepository.findByUserAndStatus(user, PaymentStatus.PENDING);

                if (!pendingPayments.isEmpty()) {
                    Payment lastPayment = pendingPayments.stream()
                            .max((p1, p2) -> p1.getCreatedAt().compareTo(p2.getCreatedAt()))
                            .orElse(null);

                    if (lastPayment != null) {
                        long daysDifference = java.time.temporal.ChronoUnit.DAYS.between(
                                lastPayment.getCreatedAt(), LocalDateTime.now());

                        Integer gracePeriodDays = settingsService.getPaymentGracePeriodDays();

                        return daysDifference <= gracePeriodDays;
                    }
                }
            }

            return false;

        } catch (Exception e) {
            log.error("Error validating enrollment eligibility for user {}: {}", userId, e.getMessage());
            return false;
        }
    }

}
