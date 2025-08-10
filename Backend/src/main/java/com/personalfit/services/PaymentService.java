package com.personalfit.services;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.personalfit.dto.Payment.CreatePaymentDTO;
import com.personalfit.dto.Payment.CreatePaymentWithFileDTO;
import com.personalfit.dto.Payment.PaymentTypeDTO;
import com.personalfit.dto.Payment.UpdatePaymentStatusDTO;
import com.personalfit.enums.MethodType;
import com.personalfit.enums.PaymentStatus;
import com.personalfit.enums.UserStatus;
import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.exceptions.EntityAlreadyExistsException;
import com.personalfit.exceptions.EntityNotFoundException;
import com.personalfit.models.Payment;
import com.personalfit.models.PaymentFile;
import com.personalfit.models.User;
import com.personalfit.repository.PaymentRepository;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    @Lazy
    private UserService userService;

    @Autowired
    private PaymentFileService paymentFileService;

    public void registerPayment(CreatePaymentDTO newPayment) {

        User user = userService.getUserById(newPayment.getClientId());

        // Validar que el usuario pueda crear un nuevo pago
        validateUserCanCreatePayment(user);

        Payment payment = Payment.builder()
                .user(user)
                .confNumber(newPayment.getConfNumber())
                .amount(newPayment.getAmount())
                // .paymentFile(pFile.get())
                .methodType(newPayment.getMethodType())
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMonths(1))
                .status(PaymentStatus.DEBTOR)
                .build();

        try {
            paymentRepository.save(payment);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public List<PaymentTypeDTO> getAllPaymentsTypeDto() {
        List<Payment> payments = paymentRepository.findAll();
        return payments.stream().map(payment -> PaymentTypeDTO.builder()
                .id(payment.getId())
                .clientId(payment.getUser().getId())
                .clientName(payment.getUser().getFirstName() + " " + payment.getUser().getLastName())
                .createdAt(payment.getCreatedAt())
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .verifiedAt(payment.getVerifiedAt())
                .verifiedBy(payment.getVerifiedBy() != null ? payment.getUser().getFullName() : null)
                .rejectionReason(payment.getRejectionReason())
                .updatedAt(payment.getUpdatedAt())
                .expiresAt(payment.getExpiresAt())
                .build()).toList();
    }

    public List<PaymentTypeDTO> getUserPaymentsTypeDto(Long id) {
        User user = userService.getUserById(id);

        return user.getPayments().stream()
                .map(payment -> PaymentTypeDTO.builder()
                        .id(payment.getId())
                        .clientId(payment.getUser().getId())
                        .clientName(payment.getUser().getFullName())
                        .createdAt(payment.getCreatedAt())
                        .receiptId(payment.getPaymentFile() != null ? payment.getPaymentFile().getId() : null)
                        .amount(payment.getAmount())
                        .status(payment.getStatus())
                        .verifiedAt(payment.getVerifiedAt())
                        .verifiedBy(payment.getVerifiedBy() != null ? payment.getUser().getFullName() : null)
                        .rejectionReason(payment.getRejectionReason())
                        .updatedAt(payment.getUpdatedAt())
                        .expiresAt(payment.getExpiresAt())
                        .build())
                .toList();
    }

    public void updatePaymentStatus(Long id, UpdatePaymentStatusDTO dto) {
        Optional<Payment> optional = paymentRepository.findById(id);
        if (optional.isEmpty()) {
            throw new EntityNotFoundException("Pago con ID: " + id + " no encontrado",
                    "Api/Payment/updatePaymentStatus");
        }

        Payment payment = optional.get();

        if (dto.getStatus() == null) {
            throw new BusinessRuleException("El estado no puede ser null", "Api/Payment/updatePaymentStatus");
        }

        switch (dto.getStatus().toLowerCase()) {
            case "paid":
                payment.setStatus(PaymentStatus.PAID);
                userService.updateUserStatus(optional.get().getUser(), UserStatus.ACTIVE); // Si el usuario pagó, se
                                                                                           // pone en activo
                break;
            case "rejected":
                payment.setStatus(PaymentStatus.REJECTED);
                payment.setRejectionReason(dto.getRejectionReason()); // puede ser null o ""
                userService.updateUserStatus(optional.get().getUser(), UserStatus.INACTIVE);
                break;
            default:
                throw new BusinessRuleException("Estado inválido: " + dto.getStatus(),
                        "Api/Payment/updatePaymentStatus");
        }

        payment.setUpdatedAt(LocalDateTime.now());
        paymentRepository.save(payment);
    }

    public Payment getPaymentWithFileById(Long id) {
        Optional<Payment> payment = paymentRepository.findById(id);
        if (payment.isEmpty())
            throw new EntityNotFoundException("Pago con ID: " + id + " no encontrado",
                    "Api/Payment/getPaymentWithFileById");
        return payment.get();
    }

    public PaymentTypeDTO getPaymentById(Long id) {
        Optional<Payment> payment = paymentRepository.findById(id);
        if (payment.isEmpty())
            throw new EntityNotFoundException("Pago con ID: " + id + " no encontrado", "Api/Payment/getPaymentById");

        return PaymentTypeDTO.builder()
                .id(payment.get().getId())
                .clientId(payment.get().getUser().getId())
                .clientName(payment.get().getUser().getFullName())
                .createdAt(payment.get().getCreatedAt())
                .amount(payment.get().getAmount())
                .status(payment.get().getStatus())
                .verifiedAt(payment.get().getVerifiedAt())
                .verifiedBy(payment.get().getVerifiedBy() != null ? payment.get().getUser().getFullName() : null)
                .rejectionReason(payment.get().getRejectionReason())
                .updatedAt(payment.get().getUpdatedAt())
                .expiresAt(payment.get().getExpiresAt())
                .receiptId(payment.get().getPaymentFile() != null ? payment.get().getPaymentFile().getId() : null)
                .build();
    }

    /**
     * Valida si un usuario puede crear un nuevo pago
     * 
     * @param user El usuario que intenta crear el pago
     * @throws PaymentAlreadyExistsException Si el usuario ya tiene un pago activo o
     *                                       pendiente
     */
    private void validateUserCanCreatePayment(User user) {
        List<Payment> userPayments = user.getPayments();

        // Verificar si tiene pagos activos (paid) o pendientes (pending)
        boolean hasActiveOrPendingPayment = userPayments.stream()
                .anyMatch(payment -> payment.getStatus() == PaymentStatus.PAID ||
                        payment.getStatus() == PaymentStatus.PENDING);

        if (hasActiveOrPendingPayment) {
            throw new EntityAlreadyExistsException("El usuario ya tiene un pago activo o pendiente",
                    "Api/Payment/validateUserCanCreatePayment");
        }
    }

    @Transactional

    public Payment registerPaymentWithFile(CreatePaymentDTO newPayment, MultipartFile file) {

        User user = userService.getUserByDni(newPayment.getClientDni());

        // Validar que el usuario pueda crear un nuevo pago
        validateUserCanCreatePayment(user);

        Optional<Long> idFile = Optional.empty();
        PaymentFile pFile = null;
        if (!(file == null || file.isEmpty())) {
            idFile = Optional.of(paymentFileService.uploadFile(file));
            pFile = paymentFileService.getPaymentFile(idFile.get());
        }

        Payment payment = Payment.builder()
                .user(user)
                .confNumber(newPayment.getConfNumber())
                .amount(newPayment.getAmount())
                .paymentFile(pFile)
                .methodType(newPayment.getMethodType())
                .createdAt(newPayment.getCreatedAt())
                .expiresAt(newPayment.getExpiresAt())
                .status(newPayment.getPaymentStatus())
                .build();

        try {
            Payment savedPayment = paymentRepository.save(payment);
            return savedPayment;
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }

    }

    // batch function to save multiple users

    public Boolean saveAll(List<CreatePaymentDTO> newPayments) {

        for (CreatePaymentDTO newPayment : newPayments) {
            User user = userService.getUserById(newPayment.getClientId());

            // Validar que el usuario pueda crear un nuevo pago
            validateUserCanCreatePayment(user);

            Payment payment = Payment.builder()
                    .user(user)
                    .confNumber(newPayment.getConfNumber())
                    .amount(newPayment.getAmount())
                    .methodType(newPayment.getMethodType())
                    .createdAt(newPayment.getCreatedAt())
                    .expiresAt(newPayment.getExpiresAt())
                    .status(PaymentStatus.PENDING)
                    .build();

            try {
                paymentRepository.save(payment);
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        }
        return true;

    }

    // batch function to save multiple payments with files

    public Boolean saveAllWithFiles(List<CreatePaymentWithFileDTO> newPayments) {

        for (CreatePaymentWithFileDTO newPayment : newPayments) {
            User user = userService.getUserByDni(newPayment.getClientDni());

            // Validar que el usuario pueda crear un nuevo pago
            validateUserCanCreatePayment(user);

            Optional<Long> idFile = Optional.empty();
            PaymentFile pFile = null;
            if (!(newPayment.getFile() == null || newPayment.getFile().isEmpty())) {
                idFile = Optional.of(paymentFileService.uploadFile(newPayment.getFile()));
                pFile = paymentFileService.getPaymentFile(idFile.get());
            }

            Payment payment = Payment.builder()
                    .user(user)
                    .confNumber(newPayment.getConfNumber())
                    .amount(newPayment.getAmount())
                    .paymentFile(pFile)
                    .methodType(newPayment.getMethodType())
                    .createdAt(newPayment.getCreatedAt())
                    .expiresAt(newPayment.getExpiresAt())
                    .status(newPayment.getPaymentStatus())
                    .build();

            try {
                paymentRepository.save(payment);
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        }
        return true;

    }

    // batch function to save multiple payments with files from array

    public Boolean saveAllWithFilesFromArray(List<CreatePaymentDTO> newPayments, MultipartFile[] files) {

        for (int i = 0; i < newPayments.size(); i++) {
            CreatePaymentDTO newPayment = newPayments.get(i);
            User user = userService.getUserByDni(newPayment.getClientDni());

            // Validar que el usuario pueda crear un nuevo pago
            validateUserCanCreatePayment(user);

            Optional<Long> idFile = Optional.empty();
            PaymentFile pFile = null;

            // Verificar si hay archivo correspondiente
            if (files != null && i < files.length && !(files[i] == null || files[i].isEmpty())) {
                idFile = Optional.of(paymentFileService.uploadFile(files[i]));
                pFile = paymentFileService.getPaymentFile(idFile.get());
            }

            Payment payment = Payment.builder()
                    .user(user)
                    .confNumber(newPayment.getConfNumber())
                    .amount(newPayment.getAmount())
                    .paymentFile(pFile)
                    .methodType(newPayment.getMethodType())
                    .createdAt(newPayment.getCreatedAt())
                    .expiresAt(newPayment.getExpiresAt())
                    .status(newPayment.getPaymentStatus())
                    .build();

            try {
                paymentRepository.save(payment);
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        }
        return true;

    }

    public Payment registerWebhookPayment(CreatePaymentDTO newPayment) {
        User user = userService.getUserByDni(newPayment.getClientDni());

        // Check if a payment with this confNumber (MercadoPago ID) already exists to
        // prevent duplicates
        Optional<Payment> existingPayment = paymentRepository.findByConfNumber(newPayment.getConfNumber());
        if (existingPayment.isPresent()) {
            // If it exists and is already paid, just return it. If it's pending, update it.
            Payment payment = existingPayment.get();
            if (payment.getStatus() != PaymentStatus.PAID) {
                payment.setStatus(PaymentStatus.PAID);
                payment.setUpdatedAt(LocalDateTime.now());
                userService.updateUserStatus(user, UserStatus.ACTIVE);
                return paymentRepository.save(payment);
            }
            return payment; // Already paid, no action needed
        }

        Payment payment = Payment.builder()
                .user(user)
                .confNumber(newPayment.getConfNumber())
                .amount(newPayment.getAmount())
                .methodType(newPayment.getMethodType() != null ? newPayment.getMethodType() : MethodType.CARD) // Default
                                                                                                               // to
                                                                                                               // card
                                                                                                               // if not
                                                                                                               // provided
                .createdAt(newPayment.getCreatedAt() != null ? newPayment.getCreatedAt() : LocalDateTime.now())
                .expiresAt(newPayment.getExpiresAt() != null ? newPayment.getExpiresAt()
                        : LocalDateTime.now().plusMonths(1))
                .status(PaymentStatus.PAID) // Always 'paid' for successful webhooks
                .build();

        Payment savedPayment = paymentRepository.save(payment);
        userService.updateUserStatus(user, UserStatus.ACTIVE); // Activate user upon successful payment
        return savedPayment;
    }

}
