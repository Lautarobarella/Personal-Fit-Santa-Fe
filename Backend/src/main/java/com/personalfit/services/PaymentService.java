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
import com.personalfit.models.PaymentUser;
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

    @Autowired
    @Lazy
    private NotificationService notificationService;

    /**
     * Crea un nuevo pago con archivo opcional
     * Soporta tanto pagos individuales como múltiples usuarios
     */
    @Transactional
    public Payment createPayment(PaymentRequestDTO paymentRequest, MultipartFile file) {
        // Obtener lista de usuarios para el pago
        List<User> users = getUsersForPayment(paymentRequest);

        // Validar reglas de negocio para todos los usuarios
        for (User user : users) {
            validatePaymentCreation(user);
        }

        // Obtener el usuario creador del pago
        User createdByUser = null;
        if (paymentRequest.getCreatedByDni() != null) {
            createdByUser = userService.getUserByDni(paymentRequest.getCreatedByDni());
        }

        // Crear el pago
        Payment payment = buildPayment(paymentRequest);
        
        // Establecer el creador del pago
        if (createdByUser != null) {
            payment.setCreatedBy(createdByUser);
        }

        // Procesar archivo si existe
        if (file != null && !file.isEmpty()) {
            PaymentFile paymentFile = processPaymentFile(file);
            payment.setPaymentFile(paymentFile);
        }

        // Crear relaciones con los usuarios
        Set<PaymentUser> paymentUsers = new HashSet<>();
        for (User user : users) {
            PaymentUser paymentUser = PaymentUser.builder()
                    .payment(payment)
                    .user(user)
                    .build();
            paymentUsers.add(paymentUser);
            
            // Actualizar estado del usuario si es necesario
            updateUserStatusIfPaid(user, payment);
        }
        
        // Asignar las relaciones al pago antes de guardar
        payment.setPaymentUsers(paymentUsers);

        // Guardar el pago (la cascada guardará automáticamente las relaciones PaymentUser)
        Payment savedPayment = paymentRepository.save(payment);

        log.info("Pago creado exitosamente: ID={}, Usuarios={}, Monto={}, CreatedBy={}",
                savedPayment.getId(), users.size(), savedPayment.getAmount(), 
                createdByUser != null ? createdByUser.getFullName() : "N/A");

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
                // Obtener usuarios para el pago (usando método unificado)
                List<User> users = getUsersForPayment(paymentRequest);
                
                // Los pagos en lote solo deberían ser para un usuario
                if (users.size() != 1) {
                    log.warn("Saltando pago en lote con múltiples usuarios: DNIs={}",
                            paymentRequest.getAllDnis());
                    continue;
                }
                
                User user = users.get(0);

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

                Payment payment = buildPayment(batchRequest);
                
                // Crear la relación con el usuario para pagos en lote
                PaymentUser paymentUser = PaymentUser.builder()
                        .payment(payment)
                        .user(user)
                        .build();
                
                payment.setPaymentUsers(Set.of(paymentUser));
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
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1);

        return paymentRepository.findAllPaymentsInMonth(startOfMonth, endOfMonth).stream()
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
        LocalDateTime now = LocalDateTime.now();

        // Obtener pagos del usuario usando la consulta optimizada
        List<Payment> userPayments = paymentRepository.findAllByUserIdWithDetails(userId);
        
        return userPayments.stream()
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
            // Activar usuarios si el pago es aprobado
            if (payment.getPaymentUsers() != null) {
                for (PaymentUser paymentUser : payment.getPaymentUsers()) {
                    updateUserStatusIfPaid(paymentUser.getUser(), payment);
                }
            }
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

    /**
     * Obtiene la lista de usuarios para un pago (soporte para múltiples usuarios)
     */
    private List<User> getUsersForPayment(PaymentRequestDTO paymentRequest) {
        List<User> users = new ArrayList<>();
        
        // Si es un pago múltiple, procesar lista de DNIs
        if (paymentRequest.isMultipleUsersPayment()) {
            for (Integer dni : paymentRequest.getClientDnis()) {
                User user = userService.getUserByDni(dni);
                users.add(user);
            }
        } else {
            // Pago individual (compatibilidad con MercadoPago)
            if (paymentRequest.getClientId() != null) {
                User user = userService.getUserById(paymentRequest.getClientId());
                users.add(user);
            } else if (paymentRequest.getClientDni() != null) {
                User user = userService.getUserByDni(paymentRequest.getClientDni());
                users.add(user);
            } else {
                throw new BusinessRuleException("Se debe proporcionar clientId, clientDni o clientDnis",
                        "/api/payments/new");
            }
        }
        
        return users;
    }

    private void validatePaymentCreation(User user) {
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

    private Payment buildPayment(PaymentRequestDTO request) {
        return Payment.builder()
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
            throw new FileException(
                    "Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, WebP) y PDFs. " +
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
        // Obtener usuarios asociados al pago
        List<PaymentTypeDTO.PaymentUserInfo> associatedUsers = new ArrayList<>();
        
        if (payment.getPaymentUsers() != null && !payment.getPaymentUsers().isEmpty()) {
            for (PaymentUser paymentUser : payment.getPaymentUsers()) {
                User user = paymentUser.getUser();
                PaymentTypeDTO.PaymentUserInfo userInfo = PaymentTypeDTO.PaymentUserInfo.builder()
                        .userId(user.getId())
                        .userName(user.getFullName())
                        .userDni(user.getDni())
                        .build();
                associatedUsers.add(userInfo);
            }
        }
        
        // Usar el createdBy como cliente principal si está disponible
        Long primaryClientId = null;
        String primaryClientName = null;
        
        if (payment.getCreatedBy() != null) {
            primaryClientId = payment.getCreatedBy().getId();
            primaryClientName = payment.getCreatedBy().getFullName();
        } else if (!associatedUsers.isEmpty()) {
            // Fallback: usar el primer usuario asociado si no hay createdBy
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
            // Calcular el rango de fechas para el día actual
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime startOfDay = now.toLocalDate().atStartOfDay();
            LocalDateTime endOfDay = startOfDay.plusDays(1);
            
            // Usar la consulta optimizada que ya filtra por fecha de vencimiento de hoy
            List<Payment> expiredPayments = paymentRepository.findPaidPaymentsExpiringToday(startOfDay, endOfDay);

            if (expiredPayments.isEmpty()) {
                log.info("No payments expiring today");
                return;
            }

            List<User> usersWithExpiredPayments = new ArrayList<>();

            for (Payment payment : expiredPayments) {
                payment.setStatus(PaymentStatus.EXPIRED);
                payment.setUpdatedAt(LocalDateTime.now());
                
                // Actualizar estado de todos los usuarios asociados al pago
                if (payment.getPaymentUsers() != null) {
                    for (PaymentUser paymentUser : payment.getPaymentUsers()) {
                        User user = paymentUser.getUser();
                        userService.updateUserStatus(user, UserStatus.INACTIVE);
                        usersWithExpiredPayments.add(user);
                    }
                }
            }

            // Guardar todos los cambios
            paymentRepository.saveAll(expiredPayments);

            // Enviar notificaciones de pago vencido a los usuarios afectados
            try {
                notificationService.createPaymentExpiredNotification(usersWithExpiredPayments, new ArrayList<>());
                log.info("Payment expiration notifications sent to {} users", usersWithExpiredPayments.size());
            } catch (Exception notifEx) {
                log.error("Error sending payment expiration notifications: {}", notifEx.getMessage(), notifEx);
            }

            log.info("Daily expiration completed. Payments expired today: {}", expiredPayments.size());

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
     * Obtiene los ingresos del mes actual calculados en tiempo real
     */
    public MonthlyRevenueDTO getCurrentMonthRevenue() {
        LocalDateTime now = LocalDateTime.now();
        Integer year = now.getYear();
        Integer month = now.getMonthValue();

        // Calcular ingresos en tiempo real usando la consulta optimizada
        LocalDateTime startOfMonth = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1);

        Double totalRevenue = paymentRepository.calculateConfirmedRevenueInPeriod(startOfMonth, endOfMonth);
        
        // Obtener todos los pagos del mes para contar
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
