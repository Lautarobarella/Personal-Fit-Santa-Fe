package com.personalfit.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
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
 * Servicio unificado para manejo de pagos y archivos
 * Combina la funcionalidad de PaymentService y PaymentFileService
 */
@Slf4j
@Service
public class PaymentService {

    // Aumentamos a 3MB ya que los archivos vienen pre-comprimidos desde el frontend
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
    @Lazy
    private UserService userService;

    /**
     * Crea un nuevo pago con archivo opcional
     * Unifica la lógica de creación manual y automática
     */
    @Transactional
    public Payment createPayment(PaymentRequestDTO paymentRequest, MultipartFile file) {
        // Validar usuario
        User user = getUserForPayment(paymentRequest);

        // Validar reglas de negocio
        validatePaymentCreation(user);

        // Crear el pago
        Payment payment = buildPayment(paymentRequest, user);

        // Procesar archivo si existe
        if (file != null && !file.isEmpty()) {
            PaymentFile paymentFile = processPaymentFile(file);
            payment.setPaymentFile(paymentFile);
        }

        // Guardar y actualizar estado del usuario si es necesario
        Payment savedPayment = paymentRepository.save(payment);
        updateUserStatusIfPaid(user, savedPayment);

        log.info("Pago creado exitosamente: ID={}, Cliente={}, Monto={}",
                savedPayment.getId(), user.getFullName(), savedPayment.getAmount());

        return savedPayment;
    }

    /**
     * Crea un pago desde webhook (MercadoPago)
     */
    @Transactional
    public Payment createWebhookPayment(PaymentRequestDTO paymentRequest) {
        return createPayment(paymentRequest, null);
    }

    /**
     * Crea múltiples pagos en lote
     * 
     * @param paymentRequests Lista de pagos a crear
     * @return Cantidad de pagos creados exitosamente
     */
    @Transactional
    public Integer createBatchPayments(List<PaymentRequestDTO> paymentRequests) {
        List<Payment> paymentsToSave = new ArrayList<>();

        for (PaymentRequestDTO paymentRequest : paymentRequests) {
            try {
                // Validar usuario
                User user = getUserForPayment(paymentRequest);

                // Validar que el usuario sea CLIENT
                if (!user.getRole().equals(UserRole.CLIENT)) {
                    log.warn("Saltando pago para usuario no cliente: DNI={}, Role={}",
                            user.getDni(), user.getRole());
                    continue;
                }

                // Crear el pago con estado PENDING (sin validaciones de duplicados)
                PaymentRequestDTO batchRequest = PaymentRequestDTO.builder()
                        .clientId(paymentRequest.getClientId())
                        .clientDni(paymentRequest.getClientDni())
                        .amount(paymentRequest.getAmount())
                        .methodType(paymentRequest.getMethodType())
                        .paymentStatus(PaymentStatus.PENDING) // Forzar estado PENDING
                        .createdAt(paymentRequest.getCreatedAt() != null ? paymentRequest.getCreatedAt()
                                : LocalDateTime.now())
                        .expiresAt(paymentRequest.getExpiresAt())
                        .confNumber(paymentRequest.getConfNumber())
                        .build();

                Payment payment = buildPayment(batchRequest, user);
                paymentsToSave.add(payment);

            } catch (Exception e) {
                log.error("Error procesando pago en lote para cliente: {}, Error: {}",
                        paymentRequest.getClientDni() != null ? paymentRequest.getClientDni()
                                : paymentRequest.getClientId(),
                        e.getMessage());
            }
        }

        // Guardar todos los pagos en lote para mejor rendimiento
        List<Payment> savedPayments = paymentRepository.saveAll(paymentsToSave);

        log.info("Pagos creados en lote exitosamente: {} de {} solicitados",
                savedPayments.size(), paymentRequests.size());

        return savedPayments.size();
    }

    /**
     * Obtiene todos los pagos (para admin)
     * Solo muestra pagos del mes actual
     */
    public List<PaymentTypeDTO> getAllPayments() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1).minusNanos(1);

        return paymentRepository.findAll().stream()
                .filter(payment -> payment.getCreatedAt().isAfter(startOfMonth) && 
                                 payment.getCreatedAt().isBefore(endOfMonth))
                .map(payment -> {
                    PaymentTypeDTO dto = convertToPaymentTypeDTO(payment);
                    // Actualizar estado a EXPIRED si está vencido y era PAID
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
     * Obtiene pagos de un usuario específico
     * Para clientes, muestra todos los pagos históricos con estados actualizados
     */
    public List<PaymentTypeDTO> getUserPayments(Long userId) {
        User user = userService.getUserById(userId);
        LocalDateTime now = LocalDateTime.now();

        return user.getPayments().stream()
                .map(payment -> {
                    PaymentTypeDTO dto = convertToPaymentTypeDTO(payment);
                    // Actualizar estado a EXPIRED si está vencido y era PAID
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
     * Obtiene detalles de un pago específico
     */
    public PaymentTypeDTO getPaymentDetails(Long paymentId) {
        Payment payment = getPaymentById(paymentId);
        return convertToPaymentTypeDTO(payment);
    }

    /**
     * Obtiene un pago con su archivo asociado
     */
    public Payment getPaymentWithFile(Long paymentId) {
        return getPaymentById(paymentId);
    }

    /**
     * Actualiza el estado de un pago
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
            // Activar usuario si el pago es aprobado
            updateUserStatusIfPaid(payment.getUser(), payment);
            // Actualizar ingresos mensuales
            updateMonthlyRevenue(payment.getAmount());
        }

        paymentRepository.save(payment);
        log.info("Estado de pago actualizado: ID={}, Nuevo Estado={}", paymentId, newStatus);
    }

    /**
     * Obtiene el contenido de un archivo de pago
     */
    public byte[] getFileContent(Long fileId) {
        PaymentFile paymentFile = getPaymentFileById(fileId);

        try {
            Path filePath = Paths.get(paymentFile.getFilePath());
            if (!Files.exists(filePath)) {
                throw new FileException("Archivo no encontrado en el sistema de archivos",
                        "/api/files/" + fileId);
            }
            return Files.readAllBytes(filePath);
        } catch (IOException e) {
            log.error("Error al leer archivo: {}", e.getMessage());
            throw new FileException("Error al leer el archivo", "/api/files/" + fileId);
        }
    }

    /**
     * Obtiene información de un archivo de pago
     */
    public PaymentFile getPaymentFileInfo(Long fileId) {
        return getPaymentFileById(fileId);
    }

    // ===== MÉTODOS PRIVADOS =====

    private User getUserForPayment(PaymentRequestDTO paymentRequest) {
        if (paymentRequest.getClientId() != null) {
            return userService.getUserById(paymentRequest.getClientId());
        } else if (paymentRequest.getClientDni() != null) {
            return userService.getUserByDni(paymentRequest.getClientDni());
        } else {
            throw new BusinessRuleException("Se debe proporcionar clientId o clientDni",
                    "/api/payments/new");
        }
    }

    private void validatePaymentCreation(User user) {
        validatePaymentCreation(user, false);
    }

    private void validatePaymentCreation(User user, boolean skipBusinessRules) {
        // Si se especifica saltar reglas de negocio, no validar duplicados
        if (skipBusinessRules) {
            return;
        }

        // Solo validar para clientes (no para pagos desde webhook)
        if (user.getRole().name().equals("CLIENT")) {
            Optional<Payment> lastPayment = paymentRepository.findTopByUserOrderByCreatedAtDesc(user);

            if (lastPayment.isPresent()) {
                Payment payment = lastPayment.get();
                if (payment.getStatus() == PaymentStatus.PENDING) {
                    throw new BusinessRuleException(
                            "El usuario ya tiene un pago pendiente de verificación",
                            "/api/payments/new");
                }

                if (payment.getStatus() == PaymentStatus.PAID) {
                    LocalDateTime expirationDate = payment.getExpiresAt();
                    if (expirationDate != null && expirationDate.isAfter(LocalDateTime.now())) {
                        throw new BusinessRuleException(
                                "El usuario ya tiene un pago activo válido",
                                "/api/payments/new");
                    }
                }
            }
        }
    }

    private Payment buildPayment(PaymentRequestDTO request, User user) {
        return Payment.builder()
                .user(user)
                .amount(request.getAmount())
                .methodType(request.getMethodType())
                .status(request.getPaymentStatus())
                .createdAt(request.getCreatedAt() != null ? request.getCreatedAt() : LocalDateTime.now())
                .expiresAt(request.getExpiresAt())
                .confNumber(request.getConfNumber())
                .build();
    }

    private PaymentFile processPaymentFile(MultipartFile file) {
        validateFile(file);

        try {
            // Crear directorio si no existe
            Path uploadDir = Paths.get(UPLOAD_FOLDER);
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            // Generar nombre único para el archivo
            String originalFilename = file.getOriginalFilename();
            String fileExtension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : "";
            String uniqueFilename = "payment_" + System.currentTimeMillis() + fileExtension;

            // Guardar archivo
            Path filePath = uploadDir.resolve(uniqueFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Crear registro en base de datos con metadatos
            PaymentFile paymentFile = PaymentFile.builder()
                    .fileName(originalFilename)
                    .filePath(filePath.toString())
                    .contentType(file.getContentType())
                    .compressedSize(file.getSize())
                    .isCompressed(true) // Asumimos que viene comprimido desde frontend
                    .build();

            return paymentFileRepository.save(paymentFile);

        } catch (IOException e) {
            log.error("Error al guardar archivo: {}", e.getMessage());
            throw new FileException("Error al guardar el archivo", "/api/payments/new");
        }
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new FileException("El archivo está vacío", "/api/payments/new");
        }

        log.info("Validando archivo: {} ({} bytes, tipo: {})", 
                file.getOriginalFilename(), file.getSize(), file.getContentType());

        if (file.getSize() > MAX_FILE_SIZE_MB * 1024 * 1024) {
            throw new FileException("El archivo excede el tamaño máximo de " + MAX_FILE_SIZE_MB + "MB. " +
                    "El archivo tiene " + String.format("%.2f", file.getSize() / 1024.0 / 1024.0) + "MB",
                    "/api/payments/new");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            throw new FileException("Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, WebP) y PDFs. " +
                    "Tipo recibido: " + contentType,
                    "/api/payments/new");
        }

        log.info("Archivo validado correctamente: {} ({}MB)", 
                file.getOriginalFilename(), String.format("%.2f", file.getSize() / 1024.0 / 1024.0));
    }

    private void updateUserStatusIfPaid(User user, Payment payment) {
        if (payment.getStatus() == PaymentStatus.PAID && user.getStatus() == UserStatus.INACTIVE) {
            user.setStatus(UserStatus.ACTIVE);
            // El UserService se encargará de guardar el usuario
        }
    }

    private Payment getPaymentById(Long paymentId) {
        return paymentRepository.findById(paymentId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Pago no encontrado con ID: " + paymentId,
                        "/api/payments/info/" + paymentId));
    }

    private PaymentFile getPaymentFileById(Long fileId) {
        return paymentFileRepository.findById(fileId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Archivo no encontrado con ID: " + fileId,
                        "/api/files/" + fileId));
    }

    private PaymentTypeDTO convertToPaymentTypeDTO(Payment payment) {
        return PaymentTypeDTO.builder()
                .id(payment.getId())
                .clientId(payment.getUser().getId())
                .clientName(payment.getUser().getFullName())
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
                .build();
    }

    /**
     * Tarea diaria a la 01:00 AM
     * Expira pagos PAID cuya fecha de vencimiento sea hoy y desactiva al usuario.
     */
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public void checkPaidPayments() {
        log.info("Starting daily payment expiration process at 01:00 AM...");

        try {
            List<Payment> paidPayments = paymentRepository.findByStatus(PaymentStatus.PAID);

            if (paidPayments.isEmpty()) {
                log.info("No PAID payments found");
                return;
            }

            final var today = java.time.LocalDate.now();
            int expiredCount = 0;

            for (Payment payment : paidPayments) {
                if (payment.getExpiresAt() == null) {
                    continue;
                }

                if (payment.getExpiresAt().toLocalDate().isEqual(today)) {
                    payment.setStatus(PaymentStatus.EXPIRED);
                    payment.setUpdatedAt(LocalDateTime.now());
                    userService.updateUserStatus(payment.getUser(), UserStatus.INACTIVE);
                    expiredCount++;
                }
            }

            if (expiredCount > 0) {
                paymentRepository.saveAll(paidPayments);
            }

            log.info("Daily expiration completed. Payments expired today: {}", expiredCount);

        } catch (Exception e) {
            log.error("Error during daily payment expiration process: {}", e.getMessage(), e);
        }
    }

    // ===== MÉTODOS PARA MANEJO DE INGRESOS MENSUALES =====

    /**
     * Actualiza los ingresos del mes actual cuando se confirma un pago
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
     * Obtiene los ingresos del mes actual
     */
    public MonthlyRevenueDTO getCurrentMonthRevenue() {
        LocalDateTime now = LocalDateTime.now();
        Optional<MonthlyRevenue> currentRevenue = monthlyRevenueRepository
                .findByYearAndMonth(now.getYear(), now.getMonthValue());

        if (currentRevenue.isPresent()) {
            return convertToMonthlyRevenueDTO(currentRevenue.get(), true);
        } else {
            // Crear DTO vacío para el mes actual
            return MonthlyRevenueDTO.builder()
                    .year(now.getYear())
                    .month(now.getMonthValue())
                    .monthName(now.getMonth().getDisplayName(TextStyle.FULL, Locale.forLanguageTag("es-ES")))
                    .totalRevenue(0.0)
                    .totalPayments(0)
                    .isCurrentMonth(true)
                    .build();
        }
    }

    /**
     * Obtiene el historial de ingresos mensuales archivados
     */
    public List<MonthlyRevenueDTO> getArchivedMonthlyRevenues() {
        return monthlyRevenueRepository.findArchivedRevenues().stream()
                .map(revenue -> convertToMonthlyRevenueDTO(revenue, false))
                .collect(Collectors.toList());
    }

    /**
     * Convierte MonthlyRevenue a DTO
     */
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
     * Tarea programada que se ejecuta el primer día de cada mes a las 00:00
     * Archiva los ingresos del mes anterior y reinicia el conteo
     */
    @Scheduled(cron = "0 0 0 1 * ?")
    @Transactional
    public void archiveMonthlyRevenue() {
        try {
            log.info("Starting monthly revenue archival process...");

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime lastMonth = now.minusMonths(1);
            Integer lastYear = lastMonth.getYear();
            Integer lastMonthNumber = lastMonth.getMonthValue();

            // Buscar ingresos del mes anterior
            Optional<MonthlyRevenue> lastMonthRevenue = monthlyRevenueRepository
                    .findByYearAndMonth(lastYear, lastMonthNumber);

            if (lastMonthRevenue.isPresent()) {
                MonthlyRevenue revenue = lastMonthRevenue.get();
                revenue.setArchivedAt(now);
                monthlyRevenueRepository.save(revenue);

                log.info("Monthly revenue archived: Year={}, Month={}, Total Revenue={}, Total Payments={}", 
                        lastYear, lastMonthNumber, revenue.getTotalRevenue(), revenue.getTotalPayments());
            } else {
                log.info("No revenue found for previous month: Year={}, Month={}", lastYear, lastMonthNumber);
            }

            log.info("Monthly revenue archival process completed successfully");

        } catch (Exception e) {
            log.error("Error during monthly revenue archival process: {}", e.getMessage(), e);
        }
    }

}
