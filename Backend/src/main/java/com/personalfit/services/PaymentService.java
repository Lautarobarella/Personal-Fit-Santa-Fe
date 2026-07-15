package com.personalfit.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import com.personalfit.dto.Payment.InactiveClientsPaymentRequestDTO;
import com.personalfit.dto.Payment.ManualPaymentRequestDTO;
import com.personalfit.dto.Payment.PaymentRequestDTO;
import com.personalfit.dto.Payment.PaymentStatusUpdateDTO;
import com.personalfit.dto.Payment.PaymentTypeDTO;
import com.personalfit.enums.MethodType;
import com.personalfit.enums.PaymentStatus;
import com.personalfit.enums.UserRole;
import com.personalfit.enums.UserStatus;
import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.exceptions.EntityNotFoundException;
import com.personalfit.exceptions.FileException;
import com.personalfit.models.Payment;
import com.personalfit.models.PaymentFile;
import com.personalfit.models.User;
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
 * 3. Automated Jobs: Scheduled tasks for expiration checks and payment
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
    @Lazy // Circular dependency breaker: UserService also depends on PaymentService
    private UserService userService;

    @Autowired
    @Lazy
    private NotificationService notificationService;

    @Autowired
    private SettingsService settingsService;

    @Autowired
    private Clock clock;

    /**
     * Creates a standard individual or group payment without trusting financial
     * or identity fields from the caller.
     *
     * CLIENT submissions must include the authenticated client, are always
     * PENDING and never activate users. ADMIN submissions are auto-confirmed.
     * Both flows calculate the amount from the current monthly fee.
     */
    @Transactional
    public Payment createPayment(ManualPaymentRequestDTO request, MultipartFile file, String authenticatedUserEmail) {
        final String path = "/api/payments/new";

        User actor = userService.getUserByEmail(authenticatedUserEmail);
        if (actor.getRole() != UserRole.CLIENT && actor.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("El rol autenticado no puede crear pagos.");
        }

        List<Integer> dnis = normalizeManualPaymentDnis(request.getClientDnis(), path);
        if (actor.getRole() == UserRole.CLIENT && !dnis.contains(actor.getDni())) {
            throw new BusinessRuleException(
                    "El cliente autenticado debe formar parte del pago individual o grupal.", path);
        }

        List<User> users = userService.getUsersByDniForUpdate(dnis);
        validateAllRequestedUsersWereFound(dnis, users, path);
        validatePaymentTargetUsersAreClients(users);

        for (User user : users) {
            validateSinglePendingPaymentRule(user);
        }

        LocalDateTime createdAt = LocalDateTime.now(clock);
        if (actor.getRole() == UserRole.ADMIN) {
            LocalDateTime targetExpiration = calculateNextExpirationDate(createdAt);
            Set<Long> usersWithActivePaidMembership = new HashSet<>(
                    paymentRepository.findUserIdsWithPaymentStatusExpiringAtOrAfter(
                            users, PaymentStatus.PAID, targetExpiration));
            List<String> alreadyPaid = users.stream()
                    .filter(user -> usersWithActivePaidMembership.contains(user.getId()))
                    .map(User::getFullName)
                    .toList();
            if (!alreadyPaid.isEmpty()) {
                throw new BusinessRuleException(
                        "Los siguientes clientes ya tienen una cuota paga para este período: "
                                + String.join(", ", alreadyPaid),
                        path);
            }
        }

        Double monthlyFee = settingsService.getMonthlyFeeStrict();
        if (Double.compare(monthlyFee, request.getExpectedMonthlyFee()) != 0) {
            throw new BusinessRuleException(
                    "La cuota mensual cambió desde que abriste el formulario. Verificá el nuevo monto e intentá nuevamente.",
                    path);
        }

        validateReceiptRequirements(request, file, actor, path);

        PaymentStatus status = actor.getRole() == UserRole.ADMIN ? PaymentStatus.PAID : PaymentStatus.PENDING;
        PaymentRequestDTO serverOwnedRequest = PaymentRequestDTO.builder()
                .amount(monthlyFee * users.size())
                .methodType(request.getMethodType())
                .paymentStatus(status)
                .notes(normalizeNotes(request.getNotes()))
                .build();
        Payment payment = buildPayment(serverOwnedRequest, createdAt);
        payment.setCreatedBy(actor);

        if (status == PaymentStatus.PAID) {
            payment.setVerifiedAt(createdAt);
            payment.setVerifiedBy(actor);
        }

        if (file != null && !file.isEmpty()) {
            PaymentFile paymentFile = processPaymentFile(file);
            payment.setPaymentFile(paymentFile);
        }

        Set<User> paymentUsers = new HashSet<>();
        for (User user : users) {
            paymentUsers.add(user);
            updateUserStatusIfPaid(user, payment);
        }
        payment.setUsers(paymentUsers);

        Payment savedPayment = paymentRepository.save(payment);

        log.info("Payment created: id={}, users={}, amount={}, createdByUserId={}",
                savedPayment.getId(), users.size(), savedPayment.getAmount(),
                actor.getId());

        return savedPayment;
    }

    /**
     * Quick payment load for inactive clients (Admin only).
     * Reuses the existing group-payment flow: creates ONE payment linked to all
     * selected clients, exactly like a manual group payment, so it feeds the
     * same history, reports and monthly revenue calculations.
     *
     * Server-enforced rules (client input is not trusted):
     * - Creator: resolved from the authenticated principal, never from the DTO.
     * - Status: forced to PAID (admin-created payments are auto-confirmed),
     *   which activates every linked client.
     * - Amount: monthly fee (settings) x number of clients.
     * - Eligibility re-validated per client under a pessimistic lock: must be
     *   an INACTIVE client without pending payments. This also makes retries
     *   idempotent-by-validation: once the payment is created the clients are
     *   ACTIVE, so a duplicate confirmation is rejected.
     *
     * The operation is atomic: if any client is not eligible, no payment is
     * created and the error details every offending client.
     *
     * @param request                DTOs with the target client DNIs.
     * @param authenticatedUserEmail Email of the authenticated admin (principal).
     * @return The persisted group Payment entity.
     */
    @Transactional
    public Payment createInactiveClientsPayment(InactiveClientsPaymentRequestDTO request,
            String authenticatedUserEmail) {
        final String path = "/api/payments/inactive-group";

        // 1. Resolve creator from the authenticated principal (never from the body)
        User admin = userService.getUserByEmail(authenticatedUserEmail);
        if (admin.getRole() != UserRole.ADMIN) {
            throw new BusinessRuleException("Solo un administrador puede generar pagos de clientes inactivos.", path);
        }
        if (request.getMethodType() != null && request.getMethodType() != MethodType.CASH) {
            throw new BusinessRuleException(
                    "La carga rápida de clientes inactivos solo admite pagos en efectivo.", path);
        }

        // 2. Normalize input: drop nulls and duplicates preserving order
        List<Integer> dnis = request.getClientDnis() == null ? List.of()
                : request.getClientDnis().stream()
                        .filter(dni -> dni != null)
                        .distinct()
                        .collect(Collectors.toList());

        if (dnis.isEmpty()) {
            throw new BusinessRuleException("Debe seleccionar al menos un cliente.", path);
        }

        // 3. Load clients with a pessimistic lock: concurrent admin requests over
        // the same clients serialize, so the second one re-reads the post-commit
        // status (ACTIVE) and fails validation instead of duplicating the payment.
        List<User> users = userService.getUsersByDniForUpdate(dnis);

        Set<Integer> foundDnis = users.stream().map(User::getDni).collect(Collectors.toSet());
        List<Integer> missingDnis = dnis.stream().filter(dni -> !foundDnis.contains(dni)).toList();
        if (!missingDnis.isEmpty()) {
            // BusinessRuleException (400) en lugar de 404: el handler del
            // frontend preserva el mensaje de los 400, así el admin ve qué
            // DNI del lote causó el rechazo.
            throw new BusinessRuleException(
                    "No se encontraron clientes con los siguientes DNI: " + joinInts(missingDnis), path);
        }

        List<String> notClients = users.stream()
                .filter(user -> user.getRole() != UserRole.CLIENT)
                .map(User::getFullName)
                .toList();
        if (!notClients.isEmpty()) {
            throw new BusinessRuleException(
                    "Los siguientes usuarios no son clientes: " + String.join(", ", notClients), path);
        }

        // 4. Re-validate eligibility server-side (frontend state may be stale)
        List<String> notInactive = users.stream()
                .filter(user -> user.getStatus() != UserStatus.INACTIVE)
                .map(User::getFullName)
                .toList();
        if (!notInactive.isEmpty()) {
            throw new BusinessRuleException(
                    "Los siguientes clientes ya no están inactivos: " + String.join(", ", notInactive), path);
        }

        // A PENDING payment is an unresolved financial operation and no job
        // expires it. Block any such payment regardless of creation month; this
        // matches /new and prevents a later approval from double-counting a fee
        // loaded through this quick flow.
        LocalDateTime createdAt = LocalDateTime.now(clock);
        Set<Long> userIdsWithPending = new HashSet<>(paymentRepository.findUserIdsWithPaymentStatus(
                users, PaymentStatus.PENDING));
        List<String> withPending = users.stream()
                .filter(user -> userIdsWithPending.contains(user.getId()))
                .map(User::getFullName)
                .toList();
        if (!withPending.isEmpty()) {
            throw new BusinessRuleException(
                    "Los siguientes clientes ya tienen un pago pendiente sin resolver: "
                            + String.join(", ", withPending),
                    path);
        }

        // 5. Build the group payment reusing the standard flow (same expiration
        // rule, same linkage) with server-computed values. The fee is read with
        // the strict getter: a read/parse failure aborts the operation instead
        // of silently billing the default amount.
        Double monthlyFee = settingsService.getMonthlyFeeStrict();

        // El monto SIEMPRE lo define el backend, pero la operación se rechaza
        // si la cuota vigente no coincide con la que el admin vio al
        // confirmar (otra sesión pudo haberla cambiado en el medio).
        if (Double.compare(monthlyFee, request.getExpectedMonthlyFee()) != 0) {
            throw new BusinessRuleException(
                    "La cuota mensual cambió desde que abriste la confirmación. Verificá el nuevo monto e intentá nuevamente.",
                    path);
        }

        Double amount = monthlyFee * users.size();
        PaymentRequestDTO paymentRequest = PaymentRequestDTO.builder()
                .amount(amount)
                .methodType(MethodType.CASH)
                .paymentStatus(PaymentStatus.PAID)
                .notes(request.getNotes())
                .build();

        Payment payment = buildPayment(paymentRequest, createdAt);
        payment.setCreatedBy(admin);
        payment.setVerifiedAt(createdAt);
        payment.setVerifiedBy(admin);

        Set<User> paymentUsers = new HashSet<>();
        for (User user : users) {
            paymentUsers.add(user);
            // Side effect shared with the group flow: PAID payments activate users
            updateUserStatusIfPaid(user, payment);
        }
        payment.setUsers(paymentUsers);

        Payment savedPayment = paymentRepository.save(payment);

        log.info("Inactive-clients payment created: id={}, clients={}, amount={}, createdByUserId={}",
                savedPayment.getId(), users.size(), savedPayment.getAmount(), admin.getId());

        return savedPayment;
    }

    private String joinInts(List<Integer> values) {
        return values.stream().map(String::valueOf).collect(Collectors.joining(", "));
    }

    /**
     * Admin Dashboard: List All Payments.
     * Scoped to the current month to prevent loading massive historical datasets.
     */
    public List<PaymentTypeDTO> getAllPayments() {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1);

        return paymentRepository.findAllPaymentsInMonth(startOfMonth, endOfMonth).stream()
                .map(payment -> {
                    PaymentTypeDTO dto = convertToPaymentTypeDTO(payment);
                    // Dynamic Status Calculation: Check expiration on read-time
                    if (payment.getStatus() == PaymentStatus.PAID &&
                            payment.getExpiresAt() != null &&
                            !payment.getExpiresAt().isAfter(now)) {
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
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime startOfMonth = LocalDateTime.of(year, month, 1, 0, 0, 0);
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1);

        return paymentRepository.findAllPaymentsInMonth(startOfMonth, endOfMonth).stream()
                .map(payment -> {
                    PaymentTypeDTO dto = convertToPaymentTypeDTO(payment);
                    if (payment.getStatus() == PaymentStatus.PAID &&
                            payment.getExpiresAt() != null &&
                            !payment.getExpiresAt().isAfter(now)) {
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
    @Transactional(readOnly = true)
    public List<PaymentTypeDTO> getUserPayments(Long userId, String authenticatedUserEmail) {
        User actor = userService.getUserByEmail(authenticatedUserEmail);
        if (actor.getRole() != UserRole.ADMIN
                && (actor.getRole() != UserRole.CLIENT || !actor.getId().equals(userId))) {
            throw new AccessDeniedException("No tenés permisos para consultar el historial de este cliente.");
        }

        LocalDateTime now = LocalDateTime.now(clock);

        // Optimized query to fetch payments with minimal N+1 issues
        List<Payment> userPayments = paymentRepository.findAllByUserIdWithDetails(userId);

        return userPayments.stream()
                .map(payment -> {
                    PaymentTypeDTO dto = convertToPaymentTypeDTO(payment);
                    if (payment.getStatus() == PaymentStatus.PAID &&
                            payment.getExpiresAt() != null &&
                            !payment.getExpiresAt().isAfter(now)) {
                        dto.setStatus(PaymentStatus.EXPIRED);
                    }
                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * Gets details of a specific payment.
     */
    @Transactional(readOnly = true)
    public PaymentTypeDTO getPaymentDetails(Long paymentId, String authenticatedUserEmail) {
        Payment payment = getPaymentById(paymentId);
        authorizePaymentAccess(payment, authenticatedUserEmail);
        return convertToPaymentTypeDTO(payment);
    }

    @Transactional(readOnly = true)
    public Payment getAuthorizedPaymentWithFile(Long paymentId, String authenticatedUserEmail) {
        Payment payment = getPaymentById(paymentId);
        authorizePaymentAccess(payment, authenticatedUserEmail);
        return payment;
    }

    /**
     * Status Modification Workflow.
     * Handles the only supported review transitions: PENDING -> PAID/REJECTED.
     * 
     * Side Effects:
     * - Activates users upon approval (PAID).
     */
    @Transactional
    public void updatePaymentStatus(Long paymentId, PaymentStatusUpdateDTO statusUpdate,
            String authenticatedUserEmail) {
        User reviewer = userService.getUserByEmail(authenticatedUserEmail);
        if (reviewer.getRole() != UserRole.ADMIN) {
            throw new AccessDeniedException("Solo un administrador puede verificar pagos.");
        }

        Payment payment = getPaymentById(paymentId);
        PaymentStatus newStatus;
        try {
            newStatus = PaymentStatus.valueOf(statusUpdate.getStatus().toUpperCase());
        } catch (IllegalArgumentException | NullPointerException exception) {
            throw new BusinessRuleException("El estado debe ser PAID o REJECTED.",
                    "/api/payments/pending/" + paymentId);
        }
        if (payment.getStatus() != PaymentStatus.PENDING
                || (newStatus != PaymentStatus.PAID && newStatus != PaymentStatus.REJECTED)) {
            throw new BusinessRuleException(
                    "Solo los pagos pendientes pueden aprobarse o rechazarse.",
                    "/api/payments/pending/" + paymentId);
        }
        if (newStatus == PaymentStatus.REJECTED
                && (statusUpdate.getRejectionReason() == null || statusUpdate.getRejectionReason().isBlank())) {
            throw new BusinessRuleException("El motivo de rechazo es obligatorio.",
                    "/api/payments/pending/" + paymentId);
        }

        LocalDateTime now = LocalDateTime.now(clock);

        payment.setStatus(newStatus);
        payment.setUpdatedAt(now);
        payment.setVerifiedAt(now);
        payment.setVerifiedBy(reviewer);

        if (newStatus == PaymentStatus.REJECTED) {
            payment.setRejectionReason(statusUpdate.getRejectionReason().trim());
        }

        if (newStatus == PaymentStatus.PAID) {
            // Activate linked accounts
            if (payment.getUsers() != null) {
                for (User user : payment.getUsers()) {
                    updateUserStatusIfPaid(user, payment);
                }
            }
        }

        paymentRepository.save(payment);
        if (newStatus == PaymentStatus.REJECTED) {
            log.info("Payment rejected: id={}, hasReason={}",
                    paymentId, statusUpdate.getRejectionReason() != null);
        } else if (newStatus == PaymentStatus.PAID) {
            log.info("Payment approved: id={}, amount={}, users={}",
                    paymentId, payment.getAmount(),
                    payment.getUsers() != null ? payment.getUsers().size() : 0);
        } else {
            log.info("Payment status updated: id={}, newStatus={}", paymentId, newStatus);
        }
    }

    /**
     * File System Retrieval.
     * Reads bytes from the disk storage based on the file ID.
     */
    public byte[] getFileContent(PaymentFile paymentFile) {
        try {
            Path filePath = Paths.get(paymentFile.getFilePath());
            if (!Files.exists(filePath)) {
                throw new FileException("File not found on disk", "/api/payments/files/" + paymentFile.getId());
            }
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            log.error("IO Error reading file: {}", e.getMessage());
            throw new FileException("Error reading file content", "/api/payments/files/" + paymentFile.getId());
        }
    }

    @Transactional(readOnly = true)
    public PaymentFile getAuthorizedPaymentFile(Long fileId, String authenticatedUserEmail) {
        Payment payment = paymentRepository.findByPaymentFileIdWithUsers(fileId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Payment file not found ID: " + fileId,
                        "/api/payments/files/" + fileId));
        authorizePaymentAccess(payment, authenticatedUserEmail);
        return payment.getPaymentFile();
    }

    private void authorizePaymentAccess(Payment payment, String authenticatedUserEmail) {
        User actor = userService.getUserByEmail(authenticatedUserEmail);
        if (actor.getRole() == UserRole.ADMIN) {
            return;
        }

        boolean isCreator = payment.getCreatedBy() != null
                && payment.getCreatedBy().getId().equals(actor.getId());
        boolean isParticipant = payment.getUsers() != null
                && payment.getUsers().stream().anyMatch(user -> user.getId().equals(actor.getId()));

        if (actor.getRole() != UserRole.CLIENT || (!isCreator && !isParticipant)) {
            throw new AccessDeniedException("No tenés permisos para acceder a este pago.");
        }
    }

    // ===== PRIVATE HELPER METHODS =====

    private List<Integer> normalizeManualPaymentDnis(List<Integer> requestedDnis, String path) {
        if (requestedDnis == null || requestedDnis.isEmpty()) {
            throw new BusinessRuleException("Debe seleccionar al menos un cliente.", path);
        }
        if (requestedDnis.stream().anyMatch(java.util.Objects::isNull)) {
            throw new BusinessRuleException("Todos los DNIs son obligatorios.", path);
        }

        List<Integer> distinctDnis = requestedDnis.stream().distinct().toList();
        if (distinctDnis.size() != requestedDnis.size()) {
            throw new BusinessRuleException("No se permiten DNIs duplicados en un pago.", path);
        }
        return distinctDnis;
    }

    private void validateAllRequestedUsersWereFound(List<Integer> requestedDnis, List<User> users, String path) {
        Set<Integer> foundDnis = users.stream().map(User::getDni).collect(Collectors.toSet());
        List<Integer> missingDnis = requestedDnis.stream()
                .filter(dni -> !foundDnis.contains(dni))
                .toList();
        if (!missingDnis.isEmpty()) {
            throw new BusinessRuleException(
                    "No se encontraron clientes con los siguientes DNI: " + joinInts(missingDnis), path);
        }
    }

    private void validateReceiptRequirements(ManualPaymentRequestDTO request, MultipartFile file, User actor,
            String path) {
        if (request.getMethodType() == MethodType.TRANSFER && (file == null || file.isEmpty())) {
            throw new BusinessRuleException("El comprobante es obligatorio para transferencias.", path);
        }
        if (actor.getRole() == UserRole.CLIENT && request.getMethodType() == MethodType.CASH
                && (request.getNotes() == null || request.getNotes().isBlank())) {
            throw new BusinessRuleException("Las notas son obligatorias para pagos en efectivo.", path);
        }
    }

    private String normalizeNotes(String notes) {
        return notes == null || notes.isBlank() ? null : notes.trim();
    }

    private void validatePaymentTargetUsersAreClients(List<User> users) {
        for (User user : users) {
            if (user == null || user.getRole() != UserRole.CLIENT) {
                throw new BusinessRuleException(
                        "DNI no encontrado",
                        "/api/payments/new");
            }
        }
    }

    private void validateSinglePendingPaymentRule(User user) {
        if (user == null || user.getRole() != UserRole.CLIENT) {
            return;
        }

        Optional<Payment> pendingPayment = paymentRepository.findTopByUserAndStatusOrderByCreatedAtDesc(
                user,
                PaymentStatus.PENDING);

        if (pendingPayment.isPresent()) {
            throw new BusinessRuleException(
                    "El usuario ya tiene un pago pendiente en verificación.",
                    "/api/payments/new");
        }
    }

    private Payment buildPayment(PaymentRequestDTO request, LocalDateTime createdAt) {
        LocalDateTime expirationDate = calculateNextExpirationDate(createdAt);

        return Payment.builder()
                .amount(request.getAmount())
                .methodType(request.getMethodType())
                .status(request.getPaymentStatus())
                .createdAt(createdAt)
                .expiresAt(expirationDate)
                .confNumber(request.getConfNumber())
                .notes(request.getNotes())
                .build();
    }

    private LocalDateTime calculateNextExpirationDate(LocalDateTime createdAt) {
        return createdAt.toLocalDate()
                .plusMonths(1)
                .withDayOfMonth(10)
                .atStartOfDay();
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
            String uniqueFilename = "payment_" + UUID.randomUUID() + fileExtension;

            Path filePath = uploadDir.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            registerRollbackCleanup(filePath);

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

    private void registerRollbackCleanup(Path filePath) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == TransactionSynchronization.STATUS_COMMITTED) {
                    return;
                }
                try {
                    Files.deleteIfExists(filePath);
                } catch (IOException cleanupError) {
                    log.error("Could not remove rolled-back payment file: {}", filePath, cleanupError);
                }
            }
        });
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
        if (payment.getStatus() == PaymentStatus.PAID && user.getStatus() != UserStatus.ACTIVE) {
            userService.updateUserStatus(user, UserStatus.ACTIVE);
        }
    }

    private Payment getPaymentById(Long paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Payment not found ID: " + paymentId,
                        "/api/payments/info/" + paymentId));
    }

    private PaymentTypeDTO convertToPaymentTypeDTO(Payment payment) {
        List<PaymentTypeDTO.PaymentUserInfo> associatedUsers = new ArrayList<>();

        // The creator counts as a payer only when it is actually one of the
        // payment's linked users (e.g. a client loading their own payment).
        // Payments created by an admin FOR other clients must keep the real
        // clients as the visible payers, so listings, search and reports do
        // not show the admin as if they were the paying client.
        User createdBy = payment.getCreatedBy();
        boolean creatorIsPayer = createdBy != null && payment.getUsers() != null
                && payment.getUsers().stream().anyMatch(u -> u.getId().equals(createdBy.getId()));

        if (creatorIsPayer) {
            associatedUsers.add(PaymentTypeDTO.PaymentUserInfo.builder()
                    .userId(createdBy.getId())
                    .userName(createdBy.getFullName())
                    .userDni(createdBy.getDni())
                    .build());
        }

        // Orden estable por id: `users` es un Set, y sin orden el "cliente
        // principal" de un pago grupal cambiaría entre lecturas.
        List<User> linkedUsers = payment.getUsers() == null ? List.of()
                : payment.getUsers().stream()
                        .sorted(Comparator.comparing(User::getId))
                        .toList();

        for (User user : linkedUsers) {
            if (creatorIsPayer && user.getId().equals(createdBy.getId())) {
                continue;
            }

            associatedUsers.add(PaymentTypeDTO.PaymentUserInfo.builder()
                    .userId(user.getId())
                    .userName(user.getFullName())
                    .userDni(user.getDni())
                    .build());
        }

        // Determine "Primary" Client for Display
        Long primaryClientId = null;
        String primaryClientName = null;

        if (creatorIsPayer) {
            primaryClientId = createdBy.getId();
            primaryClientName = createdBy.getFullName();
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
                .receiptUrl(payment.getPaymentFile() != null
                        ? "/api/payments/files/" + payment.getPaymentFile().getId()
                        : null)
                .notes(payment.getNotes())
                .build();
    }

    /**
     * CRON JOB: Monthly Expiration Check.
     * Schedule: day 10 of every month at 00:00.
     * 1. Expires PENDING payments whose expiration instant has arrived, without
     * changing users or verification data.
     * 2. Expires PAID payments due on or before the 10th.
     * 3. Deactivates users only for expired PAID payments and only when they no
     * longer have another active PAID payment.
     */
    @Scheduled(cron = "0 0 0 10 * *")
    @Transactional
    public void checkPaidPayments() {
        log.info("Starting monthly payment expiration process (day 10 at 00:00)...");

        try {
            LocalDateTime now = LocalDateTime.now(clock);
            LocalDateTime expirationCutoff = now.toLocalDate().plusDays(1).atStartOfDay();

            List<Payment> expiredPendingPayments = paymentRepository.findPendingPaymentsExpiringAtOrBefore(now);
            List<Payment> expiredPaidPayments = paymentRepository.findPaidPaymentsExpiringBefore(expirationCutoff);

            if (expiredPendingPayments.isEmpty() && expiredPaidPayments.isEmpty()) {
                log.info("No payments to expire on this cycle");
                return;
            }

            List<Payment> expiredPayments = new ArrayList<>(
                    expiredPendingPayments.size() + expiredPaidPayments.size());
            Set<User> impactedUsers = new HashSet<>();

            for (Payment payment : expiredPendingPayments) {
                payment.setStatus(PaymentStatus.EXPIRED);
                payment.setUpdatedAt(now);
                expiredPayments.add(payment);
            }

            for (Payment payment : expiredPaidPayments) {
                payment.setStatus(PaymentStatus.EXPIRED);
                payment.setUpdatedAt(now);
                expiredPayments.add(payment);

                if (payment.getUsers() != null && !payment.getUsers().isEmpty()) {
                    impactedUsers.addAll(payment.getUsers());
                }
            }

            paymentRepository.saveAll(expiredPayments);

            List<User> usersWithExpiredMembership = new ArrayList<>();

            for (User user : impactedUsers) {
                if (userService.isProtectedClient(user)) {
                    log.debug("Skipping protected client {} in monthly payment expiration job", user.getId());
                    continue;
                }

                if (!hasAnotherActivePaidMembership(user, now) && user.getStatus() != UserStatus.INACTIVE) {
                    userService.updateUserStatus(user, UserStatus.INACTIVE);
                    usersWithExpiredMembership.add(user);
                }
            }

            // Notify Users
            if (!usersWithExpiredMembership.isEmpty()) {
                try {
                    notificationService.createPaymentExpiredNotification(usersWithExpiredMembership, new ArrayList<>());
                    log.info("Payment expiration notifications sent to {} users", usersWithExpiredMembership.size());
                } catch (Exception notifEx) {
                    log.error("Error sending payment expiration notifications: {}", notifEx.getMessage());
                }
            }

            log.info("Monthly expiration job complete: expiredPending={}, expiredPaid={}, deactivated={}",
                    expiredPendingPayments.size(), expiredPaidPayments.size(), usersWithExpiredMembership.size());

        } catch (Exception e) {
            log.error("Error during monthly expiration job", e);
        }
    }

    private boolean hasAnotherActivePaidMembership(User user, LocalDateTime now) {
        List<Payment> paidPayments = paymentRepository.findByUserAndStatus(user, PaymentStatus.PAID);

        return paidPayments.stream()
                .map(Payment::getExpiresAt)
                .anyMatch(expiresAt -> expiresAt != null && expiresAt.isAfter(now));
    }

    /**
     * True if the user already loaded the fee covering the period after the
     * given expiring payment: another PAID payment, or a PENDING one awaiting
     * admin verification, that expires later than the current one.
     */
    private boolean hasUpcomingFeeAlreadyLoaded(User user, Payment expiringPayment) {
        List<Payment> candidates = new ArrayList<>();
        candidates.addAll(paymentRepository.findByUserAndStatus(user, PaymentStatus.PAID));
        candidates.addAll(paymentRepository.findByUserAndStatus(user, PaymentStatus.PENDING));

        return candidates.stream()
                .filter(p -> !p.getId().equals(expiringPayment.getId()))
                .map(Payment::getExpiresAt)
                .anyMatch(expiresAt -> expiresAt != null && expiresAt.isAfter(expiringPayment.getExpiresAt()));
    }

    /**
     * CRON JOB: Daily Reminders (01:00 AM).
     * Notify users 3 days BEFORE expected expiration.
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void sendPaymentReminders() {
        try {
            log.info("Starting payment reminder job...");
            LocalDateTime now = LocalDateTime.now(clock);
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
                int remindedUsers = 0;
                for (User user : payment.getUsers()) {
                    // Skip clients that already loaded the fee covering the next
                    // period: they must stop receiving the due-soon reminder.
                    if (hasUpcomingFeeAlreadyLoaded(user, payment)) {
                        log.info("Skipping payment reminder: userId={} already loaded next fee", user.getId());
                        continue;
                    }

                    notificationService.sendPaymentDueReminder(user, payment.getAmount(),
                            payment.getExpiresAt().toLocalDate());
                    remindedUsers++;
                }
                log.info("Payment reminder sent for payment ID: {} to {} users",
                        payment.getId(), remindedUsers);
            }

            log.info("Payment reminders sent for {} payments", upcomingPayments.size());
        } catch (Exception e) {
            log.error("Error in reminder job", e);
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
                                lastPayment.getCreatedAt(), LocalDateTime.now(clock));

                        Integer gracePeriodDays = settingsService.getPaymentGracePeriodDays();

                        return daysDifference <= gracePeriodDays;
                    }
                }
            }

            return false;

        } catch (Exception e) {
            log.warn("Enrollment eligibility check failed: userId={}, cause={}", userId, e.getMessage());
            return false;
        }
    }

}
