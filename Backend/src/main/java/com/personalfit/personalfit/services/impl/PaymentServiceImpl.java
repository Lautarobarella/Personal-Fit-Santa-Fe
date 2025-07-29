package com.personalfit.personalfit.services.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.personalfit.personalfit.dto.InCreatePaymentDTO;
import com.personalfit.personalfit.dto.InUpdatePaymentStatusDTO;
import com.personalfit.personalfit.dto.PaymentTypeDTO;
import com.personalfit.personalfit.exceptions.NoPaymentWithIdException;
import com.personalfit.personalfit.models.Payment;
import com.personalfit.personalfit.models.PaymentFile;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.repository.IPaymentRepository;
import com.personalfit.personalfit.services.IPaymentFileService;
import com.personalfit.personalfit.services.IPaymentService;
import com.personalfit.personalfit.services.IUserService;
import com.personalfit.personalfit.utils.PaymentStatus;
import com.personalfit.personalfit.utils.UserStatus;

@Service
public class PaymentServiceImpl implements IPaymentService {

    @Autowired
    private IPaymentRepository paymentRepository;

    @Autowired
    @Lazy
    private IUserService userService;

    @Autowired
    private IPaymentFileService paymentFileService;

    public void registerPayment(InCreatePaymentDTO newPayment) {

        User user = userService.getUserById(newPayment.getClientId());

        Payment payment = Payment.builder()
                .user(user)
                .confNumber(newPayment.getConfNumber())
                .amount(newPayment.getAmount())
                // .paymentFile(pFile.get())
                .methodType(newPayment.getMethodType())
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMonths(1))
                .status(PaymentStatus.debtor)
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

    @Override
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

    @Override
    public void updatePaymentStatus(Long id, InUpdatePaymentStatusDTO dto) {
        Optional<Payment> optional = paymentRepository.findById(id);
        if (optional.isEmpty()) {
            throw new NoPaymentWithIdException();
        }

        Payment payment = optional.get();

        if (dto.getStatus() == null) {
            throw new IllegalArgumentException("El estado no puede ser null");
        }

        switch (dto.getStatus().toLowerCase()) {
            case "paid":
                payment.setStatus(PaymentStatus.paid);
                break;
            case "rejected":
                payment.setStatus(PaymentStatus.rejected);
                payment.setRejectionReason(dto.getRejectionReason()); // puede ser null o ""
                break;
            default:
                throw new IllegalArgumentException("Estado inválido: " + dto.getStatus());
        }

        payment.setUpdatedAt(LocalDateTime.now());
        paymentRepository.save(payment);
    }

    @Override
    public Payment getPaymentWithFileById(Long id) {
        Optional<Payment> payment = paymentRepository.findById(id);
        if (payment.isEmpty())
            throw new NoPaymentWithIdException();
        return payment.get();
    }

    @Override
    public PaymentTypeDTO getPaymentById(Long id) {
        Optional<Payment> payment = paymentRepository.findById(id);
        if (payment.isEmpty())
            throw new NoPaymentWithIdException();

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

    @Transactional
    @Override
    public void registerPaymentWithFile(InCreatePaymentDTO newPayment, MultipartFile file) {

        User user = userService.getUserByDni(newPayment.getClientDni());

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

        userService.updateUserStatus(user, UserStatus.active); // Si el usuario pagó, se pone en activo

        try {
            paymentRepository.save(payment);

        } catch (Exception e) {
            e.printStackTrace();
        }

    }

    // batch function to save multiple users
    @Override
    public Boolean saveAll(List<InCreatePaymentDTO> newPayments) {

        for (InCreatePaymentDTO newPayment : newPayments) {
            User user = userService.getUserById(newPayment.getClientId());

            Payment payment = Payment.builder()
                    .user(user)
                    .confNumber(newPayment.getConfNumber())
                    .amount(newPayment.getAmount())
                    .methodType(newPayment.getMethodType())
                    .createdAt(newPayment.getCreatedAt())
                    .expiresAt(newPayment.getExpiresAt())
                    .status(PaymentStatus.pending)
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

}
