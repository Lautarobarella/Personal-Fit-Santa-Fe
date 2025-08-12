package com.personalfit.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.personalfit.dto.Payment.PaymentRequestDTO;
import com.personalfit.dto.Payment.PaymentStatusUpdateDTO;
import com.personalfit.dto.Payment.PaymentTypeDTO;
import com.personalfit.enums.PaymentStatus;
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
 * Servicio unificado para manejo de pagos y archivos
 * Combina la funcionalidad de PaymentService y PaymentFileService
 */
@Slf4j
@Service
public class PaymentService {

    private static final Integer MAX_FILE_SIZE_MB = 5;
    private static final String UPLOAD_FOLDER = "/app/comprobantes/";

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentFileRepository paymentFileRepository;

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
     * Obtiene todos los pagos (para admin)
     */
    public List<PaymentTypeDTO> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(this::convertToPaymentTypeDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene pagos de un usuario específico
     */
    public List<PaymentTypeDTO> getUserPayments(Long userId) {
        User user = userService.getUserById(userId);
        return user.getPayments().stream()
                .map(this::convertToPaymentTypeDTO)
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
        // Solo validar para clientes (no para pagos desde webhook)
        if (user.getRole().name().equals("CLIENT")) {
            Optional<Payment> lastPayment = paymentRepository.findTopByUserOrderByCreatedAtDesc(user);
            
            if (lastPayment.isPresent()) {
                Payment payment = lastPayment.get();
                if (payment.getStatus() == PaymentStatus.PENDING) {
                    throw new BusinessRuleException(
                        "El usuario ya tiene un pago pendiente de verificación", 
                        "/api/payments/new"
                    );
                }
                
                if (payment.getStatus() == PaymentStatus.PAID) {
                    LocalDateTime expirationDate = payment.getExpiresAt();
                    if (expirationDate != null && expirationDate.isAfter(LocalDateTime.now())) {
                        throw new BusinessRuleException(
                            "El usuario ya tiene un pago activo válido", 
                            "/api/payments/new"
                        );
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

            // Crear registro en base de datos
            PaymentFile paymentFile = PaymentFile.builder()
                    .fileName(originalFilename)
                    .filePath(filePath.toString())
                    .contentType(file.getContentType())
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

        if (file.getSize() > MAX_FILE_SIZE_MB * 1024 * 1024) {
            throw new FileException("El archivo excede el tamaño máximo de " + MAX_FILE_SIZE_MB + "MB", 
                                  "/api/payments/new");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            throw new FileException("Tipo de archivo no permitido. Solo se permiten imágenes y PDFs", 
                                  "/api/payments/new");
        }
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
     * Schedule que se ejecuta el primer día de cada mes a las 00:00
     * Marca como EXPIRED todos los pagos que estén en estado PAID
     */
    // @Scheduled(cron = "0 0 1 * *")
    @Scheduled(cron = "0 */1 * * * *")
    @Transactional
    public void checkPaidPayments() {
        log.info("Starting monthly payment expiration process...");
        
        try {
            // Buscar todos los pagos que estén en estado PAID
            List<Payment> paidPayments = paymentRepository.findByStatus(PaymentStatus.PAID);
            
            if (paidPayments.isEmpty()) {
                log.info("No paid payments found to expire");
                return;
            }
            
            log.info("Found {} paid payments to expire", paidPayments.size());
            
            // Marcar todos los pagos como EXPIRED
            for (Payment payment : paidPayments) {
                payment.setStatus(PaymentStatus.EXPIRED);
                payment.setUpdatedAt(LocalDateTime.now());
                log.info("Payment ID {} marked as expired for user {}", 
                    payment.getId(), payment.getUser().getFullName());
            }
            
            // Guardar todos los cambios en una sola transacción
            paymentRepository.saveAll(paidPayments);
            
            log.info("Successfully expired {} payments", paidPayments.size());
            
        } catch (Exception e) {
            log.error("Error during payment expiration process: {}", e.getMessage(), e);
        }
        
        log.info("Monthly payment expiration process completed");
    }

}
