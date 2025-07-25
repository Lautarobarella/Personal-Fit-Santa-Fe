package com.personalfit.personalfit.services;

import com.personalfit.personalfit.dto.InCreatePaymentDTO;
import com.personalfit.personalfit.dto.PaymentTypeDTO;
import com.personalfit.personalfit.dto.VerifyPaymentTypeDTO;
import com.personalfit.personalfit.exceptions.NoUserWithIdException;
import com.personalfit.personalfit.models.Payment;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.repository.IPaymentRepository;
import com.personalfit.personalfit.utils.PaymentStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentService {

    @Autowired
    private IPaymentRepository paymentRepository;

    @Autowired
    private UserService userService;

    public Boolean registerPayment(InCreatePaymentDTO newPayment) {

        Optional<User> user = userService.getUserById(newPayment.getClientId());
        if (user.isEmpty()) throw new NoUserWithIdException();

        Payment payment = Payment.builder()
                .user(user.get())
                .confNumber(newPayment.getConfNumber())
                .amount(newPayment.getAmount())
                .fileUrl(newPayment.getFileUrl())
                .methodType(newPayment.getMethodType())
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMonths(1))
                .status(PaymentStatus.debtor)
                .build();

        try {
            paymentRepository.save(payment);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
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
                .receiptUrl(payment.getFileUrl())
                .verifiedAt(payment.getVerifiedAt())
                .verifiedBy(payment.getVerifiedBy() != null ? payment.getUser().getFirstName() + " " + payment.getUser().getLastName() : null)
                .rejectionReason(payment.getRejectionReason())
                .updatedAt(payment.getUpdatedAt())
                .expiresAt(payment.getExpiresAt())
                .build()).toList();
    }

    public VerifyPaymentTypeDTO getVerifyPaymentTypeDto(Long id) {
        Optional<Payment> payment = paymentRepository.findById(id);

        if(payment.isEmpty()) return null; // TODO handle this case properly

        VerifyPaymentTypeDTO paymentTypeDTO = VerifyPaymentTypeDTO.builder()
                .id(payment.get().getId())
                .clientId(payment.get().getUser().getId())
                .clientName(payment.get().getUser().getFirstName() + " " + payment.get().getUser().getLastName())
                .amount(payment.get().getAmount())
                .createdAt(payment.get().getCreatedAt())
                .status(payment.get().getStatus())
                .method(payment.get().getMethodType())
                .expiresAt(payment.get().getExpiresAt())
                .receiptUrl(payment.get().getFileUrl())
                .build();

        return paymentTypeDTO;
    }
}
