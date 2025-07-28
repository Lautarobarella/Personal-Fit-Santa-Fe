package com.personalfit.personalfit.services.impl;

import com.personalfit.personalfit.dto.InCreatePaymentDTO;
import com.personalfit.personalfit.dto.InUpdatePaymentStatusDTO;
import com.personalfit.personalfit.dto.PaymentTypeDTO;
import com.personalfit.personalfit.dto.RejectPaymentDTO;
import com.personalfit.personalfit.dto.VerifyPaymentTypeDTO;
import com.personalfit.personalfit.exceptions.NoPaymentWithIdException;
import com.personalfit.personalfit.exceptions.NoUserWithIdException;
import com.personalfit.personalfit.exceptions.PaymentAlreadyExistsException;
import com.personalfit.personalfit.models.Payment;
import com.personalfit.personalfit.models.PaymentFile;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.repository.IPaymentRepository;
import com.personalfit.personalfit.services.IPaymentFileService;
import com.personalfit.personalfit.services.IPaymentService;
import com.personalfit.personalfit.services.IUserService;
import com.personalfit.personalfit.utils.PaymentStatus;
import com.personalfit.personalfit.utils.UserStatus;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PaymentServiceImpl implements IPaymentService {

    @Autowired
    private IPaymentRepository paymentRepository;

    @Autowired
    private IUserService userService;

    @Autowired
    private IPaymentFileService paymentFileService;

    public void registerPayment(InCreatePaymentDTO newPayment) {

        Optional<User> user = userService.getUserById(newPayment.getClientId());
        if (user.isEmpty())
            throw new NoUserWithIdException();
        // Optional<PaymentFile> pFile =
        // paymentFileService.getPaymentFile(newPayment.getFileId());
        // if (pFile.isEmpty()) throw new RuntimeException("Payment file not found");

        Payment payment = Payment.builder()
                .user(user.get())
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

    public VerifyPaymentTypeDTO getVerifyPaymentTypeDto(Long id) {
        Optional<Payment> payment = paymentRepository.findById(id);

        if (payment.isEmpty())
            return null; // TODO handle this case properly

        VerifyPaymentTypeDTO paymentTypeDTO = VerifyPaymentTypeDTO.builder()
                .id(payment.get().getId())
                .clientId(payment.get().getUser().getId())
                .clientName(payment.get().getUser().getFirstName() + " " + payment.get().getUser().getLastName())
                .amount(payment.get().getAmount())
                .createdAt(payment.get().getCreatedAt())
                .status(payment.get().getStatus())
                .method(payment.get().getMethodType())
                .expiresAt(payment.get().getExpiresAt())
                .build();

        return paymentTypeDTO;
    }

    @Override
    public List<PaymentTypeDTO> getUserPaymentsTypeDto(Long id) {
        Optional<User> user = userService.getUserById(id);

        if (user.isEmpty())
            throw new NoUserWithIdException();

        return user.get().getPayments().stream()
                .map(payment -> PaymentTypeDTO.builder()
                        .id(payment.getId())
                        .clientId(payment.getUser().getId())
                        .clientName(payment.getUser().getFullName())
                        .createdAt(payment.getCreatedAt())
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

    // @Override
    // public void putPayment(Long id) {
    // Optional<Payment> p = paymentRepository.findById(id);
    // if(p.isEmpty()) throw new NoPaymentWithIdException();

    // Payment payment = p.get();
    // payment.setStatus(PaymentStatus.pending);
    // payment.setUpdatedAt(LocalDateTime.now());
    // try {
    // paymentRepository.save(payment);
    // } catch (Exception e) {
    // e.printStackTrace();
    // }
    // }

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

    // @Override
    // public void verifyPayment(Long id, Long userId) {
    // Optional<Payment> p = paymentRepository.findById(id);
    // if(p.isEmpty()) throw new NoPaymentWithIdException();

    // Optional<User> user = userService.getUserById(userId);
    // if(user.isEmpty()) throw new NoUserWithIdException();

    // Payment payment = p.get();
    // payment.setStatus(PaymentStatus.paid);
    // payment.setVerifiedBy(user.get());
    // payment.setVerifiedAt(LocalDateTime.now());
    // payment.setUpdatedAt(LocalDateTime.now());
    // try {
    // paymentRepository.save(payment);
    // } catch (Exception e) {
    // e.printStackTrace();
    // }

    // }

    // @Override
    // public void rejectPayment(Long id, RejectPaymentDTO reason) {
    // Optional<Payment> p = paymentRepository.findById(id);
    // if(p.isEmpty()) throw new NoPaymentWithIdException();

    // Optional<User> user = userService.getUserById(reason.getUserId());
    // if(user.isEmpty()) throw new NoUserWithIdException();

    // Payment payment = p.get();
    // payment.setStatus(PaymentStatus.rejected);
    // payment.setRejectionReason(reason.getReason());
    // payment.setUpdatedAt(LocalDateTime.now());
    // try {
    // paymentRepository.save(payment);
    // } catch (Exception e) {
    // e.printStackTrace();
    // }
    // }

    @Transactional
    @Override
    public void registerPaymentWithFile(InCreatePaymentDTO newPayment, MultipartFile file) {

        User user = userService.getUserByDni(newPayment.getClientDni());

        Optional<Long> idFile = Optional.empty();
        Optional<PaymentFile> pFile = Optional.empty();
        if (!(file == null || file.isEmpty())) {
            idFile = Optional.of(paymentFileService.uploadFile(file));
            pFile = paymentFileService.getPaymentFile(idFile.get());
            if (pFile.isEmpty())
                throw new RuntimeException("Payment file not found");
        }

        Payment payment = Payment.builder()
                .user(user)
                .confNumber(newPayment.getConfNumber())
                .amount(newPayment.getAmount())
                .paymentFile(pFile.orElse(null))
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
            Optional<User> user = userService.getUserById(newPayment.getClientId());

            if (user.isEmpty())
                throw new NoUserWithIdException();

            Payment payment = Payment.builder()
                    .user(user.get())
                    .confNumber(newPayment.getConfNumber())
                    .amount(newPayment.getAmount())
                    .methodType(newPayment.getMethodType())
                    .createdAt(LocalDateTime.now())
                    .expiresAt(LocalDateTime.now().plusMonths(1))
                    .status(PaymentStatus.debtor)
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
