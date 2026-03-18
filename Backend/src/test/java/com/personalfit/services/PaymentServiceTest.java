package com.personalfit.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.personalfit.dto.Payment.PaymentRequestDTO;
import com.personalfit.dto.Payment.PaymentStatusUpdateDTO;
import com.personalfit.enums.MethodType;
import com.personalfit.enums.PaymentStatus;
import com.personalfit.enums.UserRole;
import com.personalfit.enums.UserStatus;
import com.personalfit.models.Payment;
import com.personalfit.models.User;
import com.personalfit.repository.MonthlyRevenueRepository;
import com.personalfit.repository.PaymentFileRepository;
import com.personalfit.repository.PaymentRepository;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentFileRepository paymentFileRepository;

    @Mock
    private MonthlyRevenueRepository monthlyRevenueRepository;

    @Mock
    private UserService userService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private SettingsService settingsService;

    @InjectMocks
    private PaymentService paymentService;

    @Test
    void createPayment_withMultiplePaidUsers_activatesEveryLinkedUser() {
        User firstClient = buildClient(11L, 30111111);
        User secondClient = buildClient(12L, 30222222);

        PaymentRequestDTO request = PaymentRequestDTO.builder()
                .clientDnis(List.of(firstClient.getDni(), secondClient.getDni()))
                .amount(60000.0)
                .methodType(MethodType.TRANSFER)
                .paymentStatus(PaymentStatus.PAID)
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMonths(1))
                .build();

        when(userService.getUserByDni(firstClient.getDni())).thenReturn(firstClient);
        when(userService.getUserByDni(secondClient.getDni())).thenReturn(secondClient);
        when(paymentRepository.findTopByUserOrderByCreatedAtDesc(firstClient)).thenReturn(Optional.empty());
        when(paymentRepository.findTopByUserOrderByCreatedAtDesc(secondClient)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            payment.setId(77L);
            return payment;
        });

        Payment createdPayment = paymentService.createPayment(request, null);

        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(paymentCaptor.capture());
        verify(userService).updateUserStatus(firstClient, UserStatus.ACTIVE);
        verify(userService).updateUserStatus(secondClient, UserStatus.ACTIVE);

        Payment savedPayment = paymentCaptor.getValue();
        assertNotNull(createdPayment);
        assertEquals(2, savedPayment.getUsers().size());
        assertEquals(Set.of(firstClient, secondClient), savedPayment.getUsers());
    }

    @Test
    void updatePaymentStatus_toPaid_activatesEveryLinkedUser() {
        User firstClient = buildClient(21L, 30333333);
        User secondClient = buildClient(22L, 30444444);

        Payment existingPayment = Payment.builder()
                .id(88L)
                .amount(60000.0)
                .status(PaymentStatus.PENDING)
                .createdAt(LocalDateTime.now().minusDays(1))
                .expiresAt(LocalDateTime.now().plusMonths(1))
                .users(Set.of(firstClient, secondClient))
                .build();

        PaymentStatusUpdateDTO statusUpdate = new PaymentStatusUpdateDTO();
        statusUpdate.setStatus("paid");

        when(paymentRepository.findById(existingPayment.getId())).thenReturn(Optional.of(existingPayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        paymentService.updatePaymentStatus(existingPayment.getId(), statusUpdate);

        verify(userService).updateUserStatus(firstClient, UserStatus.ACTIVE);
        verify(userService).updateUserStatus(secondClient, UserStatus.ACTIVE);
        verify(paymentRepository).save(existingPayment);
    }

    @Test
    void updatePaymentStatus_toPaid_skipsAlreadyActiveUsers() {
        User alreadyActiveClient = buildClient(31L, 30555555);
        alreadyActiveClient.setStatus(UserStatus.ACTIVE);

        Payment existingPayment = Payment.builder()
                .id(99L)
                .amount(30000.0)
                .status(PaymentStatus.PENDING)
                .createdAt(LocalDateTime.now().minusDays(1))
                .expiresAt(LocalDateTime.now().plusMonths(1))
                .users(Set.of(alreadyActiveClient))
                .build();

        PaymentStatusUpdateDTO statusUpdate = new PaymentStatusUpdateDTO();
        statusUpdate.setStatus("paid");

        when(paymentRepository.findById(existingPayment.getId())).thenReturn(Optional.of(existingPayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        paymentService.updatePaymentStatus(existingPayment.getId(), statusUpdate);

        verify(userService, never()).updateUserStatus(alreadyActiveClient, UserStatus.ACTIVE);
        verify(paymentRepository, times(1)).save(existingPayment);
    }

    private User buildClient(Long id, Integer dni) {
        User user = new User();
        user.setId(id);
        user.setDni(dni);
        user.setFirstName("Cliente");
        user.setLastName(String.valueOf(dni));
        user.setRole(UserRole.CLIENT);
        user.setStatus(UserStatus.INACTIVE);
        return user;
    }
}
