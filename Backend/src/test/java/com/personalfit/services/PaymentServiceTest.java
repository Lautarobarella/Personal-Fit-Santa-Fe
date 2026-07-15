package com.personalfit.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.personalfit.dto.Payment.InactiveClientsPaymentRequestDTO;
import com.personalfit.dto.Payment.ManualPaymentRequestDTO;
import com.personalfit.dto.Payment.PaymentStatusUpdateDTO;
import com.personalfit.enums.MethodType;
import com.personalfit.enums.PaymentStatus;
import com.personalfit.enums.UserRole;
import com.personalfit.enums.UserStatus;
import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.models.Payment;
import com.personalfit.models.PaymentFile;
import com.personalfit.models.User;
import com.personalfit.repository.PaymentFileRepository;
import com.personalfit.repository.PaymentRepository;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    private static final String ADMIN_EMAIL = "admin@personalfit.test";
    private static final String CLIENT_EMAIL = "client@personalfit.test";

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentFileRepository paymentFileRepository;

    @Mock
    private UserService userService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private SettingsService settingsService;

    @Mock
    private Clock clock;

    @InjectMocks
    private PaymentService paymentService;

    @TempDir
    Path uploadDirectory;

    @BeforeEach
    void setUp() {
        mockCurrentTime(LocalDateTime.of(2026, 4, 5, 10, 0));
        ReflectionTestUtils.setField(paymentService, "UPLOAD_FOLDER", uploadDirectory.toString());
    }

    @Test
    void createPayment_asAdminWithMultipleUsers_createsPaidGroupWithReceiptAndActivatesEveryLinkedUser() {
        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);
        User firstClient = buildClient(11L, 30111111);
        User secondClient = buildClient(12L, 30222222);
        MockMultipartFile receipt = new MockMultipartFile(
                "file", "grupo-admin.pdf", "application/pdf", "admin-receipt-content".getBytes());

        ManualPaymentRequestDTO request = ManualPaymentRequestDTO.builder()
                .clientDnis(List.of(firstClient.getDni(), secondClient.getDni()))
                .expectedMonthlyFee(30000.0)
                .methodType(MethodType.TRANSFER)
                .build();

        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);
        when(userService.getUsersByDniForUpdate(List.of(firstClient.getDni(), secondClient.getDni())))
                .thenReturn(List.of(firstClient, secondClient));
        when(paymentRepository.findTopByUserAndStatusOrderByCreatedAtDesc(firstClient, PaymentStatus.PENDING))
                .thenReturn(Optional.empty());
        when(paymentRepository.findTopByUserAndStatusOrderByCreatedAtDesc(secondClient, PaymentStatus.PENDING))
                .thenReturn(Optional.empty());
        when(settingsService.getMonthlyFeeStrict()).thenReturn(30000.0);
        when(paymentFileRepository.save(any(PaymentFile.class))).thenAnswer(invocation -> {
            PaymentFile file = invocation.getArgument(0);
            file.setId(80L);
            return file;
        });
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            payment.setId(77L);
            return payment;
        });

        Payment createdPayment = paymentService.createPayment(request, receipt, ADMIN_EMAIL);

        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(paymentCaptor.capture());
        verify(userService).updateUserStatus(firstClient, UserStatus.ACTIVE);
        verify(userService).updateUserStatus(secondClient, UserStatus.ACTIVE);

        Payment savedPayment = paymentCaptor.getValue();
        assertNotNull(createdPayment);
        assertEquals(PaymentStatus.PAID, savedPayment.getStatus());
        assertEquals(admin, savedPayment.getCreatedBy());
        assertEquals(admin, savedPayment.getVerifiedBy());
        assertNotNull(savedPayment.getVerifiedAt());
        assertEquals(60000.0, savedPayment.getAmount());
        assertNotNull(savedPayment.getPaymentFile());
        assertEquals("grupo-admin.pdf", savedPayment.getPaymentFile().getFileName());
        assertEquals(2, savedPayment.getUsers().size());
        assertEquals(Set.of(firstClient, secondClient), savedPayment.getUsers());
        assertEquals(LocalDateTime.of(2026, 5, 10, 0, 0), savedPayment.getExpiresAt());
    }

    @Test
    void createPayment_asAdminWithPaidMembershipForTargetPeriod_rejectsDuplicateCharge() {
        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);
        User client = buildClient(11L, 30111111);
        ManualPaymentRequestDTO request = ManualPaymentRequestDTO.builder()
                .clientDnis(List.of(client.getDni()))
                .expectedMonthlyFee(30000.0)
                .methodType(MethodType.CASH)
                .build();

        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);
        when(userService.getUsersByDniForUpdate(List.of(client.getDni()))).thenReturn(List.of(client));
        when(paymentRepository.findTopByUserAndStatusOrderByCreatedAtDesc(client, PaymentStatus.PENDING))
                .thenReturn(Optional.empty());
        when(paymentRepository.findUserIdsWithPaymentStatusExpiringAtOrAfter(
                List.of(client), PaymentStatus.PAID, LocalDateTime.of(2026, 5, 10, 0, 0)))
                .thenReturn(List.of(client.getId()));

        assertThrows(BusinessRuleException.class,
                () -> paymentService.createPayment(request, null, ADMIN_EMAIL));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void createPayment_asAdminWithCurrentPeriodStillActive_allowsNextPeriodRenewal() {
        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);
        User client = buildClient(11L, 30111111);
        ManualPaymentRequestDTO request = ManualPaymentRequestDTO.builder()
                .clientDnis(List.of(client.getDni()))
                .expectedMonthlyFee(30000.0)
                .methodType(MethodType.CASH)
                .build();

        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);
        when(userService.getUsersByDniForUpdate(List.of(client.getDni()))).thenReturn(List.of(client));
        when(paymentRepository.findTopByUserAndStatusOrderByCreatedAtDesc(client, PaymentStatus.PENDING))
                .thenReturn(Optional.empty());
        // El pago vigente vence el 10 de abril y, por lo tanto, no aparece en
        // esta consulta que busca cobertura para el nuevo vencimiento de mayo.
        when(paymentRepository.findUserIdsWithPaymentStatusExpiringAtOrAfter(
                List.of(client), PaymentStatus.PAID, LocalDateTime.of(2026, 5, 10, 0, 0)))
                .thenReturn(List.of());
        when(settingsService.getMonthlyFeeStrict()).thenReturn(30000.0);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment payment = paymentService.createPayment(request, null, ADMIN_EMAIL);

        assertEquals(PaymentStatus.PAID, payment.getStatus());
        assertEquals(LocalDateTime.of(2026, 5, 10, 0, 0), payment.getExpiresAt());
        verify(userService).updateUserStatus(client, UserStatus.ACTIVE);
    }

    @Test
    void updatePaymentStatus_toPaid_activatesEveryLinkedUser() {
        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);
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

        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);
        when(paymentRepository.findById(existingPayment.getId())).thenReturn(Optional.of(existingPayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        paymentService.updatePaymentStatus(existingPayment.getId(), statusUpdate, ADMIN_EMAIL);

        verify(userService).updateUserStatus(firstClient, UserStatus.ACTIVE);
        verify(userService).updateUserStatus(secondClient, UserStatus.ACTIVE);
        verify(paymentRepository).save(existingPayment);
        assertEquals(admin, existingPayment.getVerifiedBy());
        assertNotNull(existingPayment.getVerifiedAt());
    }

    @Test
    void createPayment_asClientIndividual_derivesCreatorAmountAndPendingStatus() {
        User client = buildClient(41L, 30666666);
        ManualPaymentRequestDTO request = ManualPaymentRequestDTO.builder()
                .clientDnis(List.of(client.getDni()))
                .expectedMonthlyFee(30000.0)
                .methodType(MethodType.CASH)
                .notes("Pago en recepción")
                .build();

        when(userService.getUserByEmail(CLIENT_EMAIL)).thenReturn(client);
        when(userService.getUsersByDniForUpdate(List.of(client.getDni()))).thenReturn(List.of(client));
        when(paymentRepository.findTopByUserAndStatusOrderByCreatedAtDesc(client, PaymentStatus.PENDING))
                .thenReturn(Optional.empty());
        when(settingsService.getMonthlyFeeStrict()).thenReturn(30000.0);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment payment = paymentService.createPayment(request, null, CLIENT_EMAIL);

        assertNotNull(payment);
        assertEquals(PaymentStatus.PENDING, payment.getStatus());
        assertEquals(client, payment.getCreatedBy());
        assertEquals(30000.0, payment.getAmount());
        assertNull(payment.getVerifiedAt());
        assertNull(payment.getVerifiedBy());
        verify(userService, never()).updateUserStatus(any(User.class), any(UserStatus.class));
    }

    @Test
    void createPayment_asClientGroupIncludingSelf_preservesGroupAndKeepsItPending() {
        User creator = buildClient(41L, 30666666);
        User secondClient = buildClient(42L, 30666667);
        ManualPaymentRequestDTO request = ManualPaymentRequestDTO.builder()
                .clientDnis(List.of(creator.getDni(), secondClient.getDni()))
                .expectedMonthlyFee(25000.0)
                .methodType(MethodType.CASH)
                .notes("Pago familiar en recepción")
                .build();

        when(userService.getUserByEmail(CLIENT_EMAIL)).thenReturn(creator);
        when(userService.getUsersByDniForUpdate(List.of(creator.getDni(), secondClient.getDni())))
                .thenReturn(List.of(creator, secondClient));
        when(paymentRepository.findTopByUserAndStatusOrderByCreatedAtDesc(any(User.class),
                eq(PaymentStatus.PENDING))).thenReturn(Optional.empty());
        when(settingsService.getMonthlyFeeStrict()).thenReturn(25000.0);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment payment = paymentService.createPayment(request, null, CLIENT_EMAIL);

        assertEquals(PaymentStatus.PENDING, payment.getStatus());
        assertEquals(50000.0, payment.getAmount());
        assertEquals(creator, payment.getCreatedBy());
        assertEquals(Set.of(creator, secondClient), payment.getUsers());
        verify(userService, never()).updateUserStatus(any(User.class), any(UserStatus.class));
    }

    @Test
    void createPayment_asClientGroupWithoutSelf_throwsBusinessRuleException() {
        User creator = buildClient(41L, 30666666);
        ManualPaymentRequestDTO request = ManualPaymentRequestDTO.builder()
                .clientDnis(List.of(30777777, 30888888))
                .expectedMonthlyFee(25000.0)
                .methodType(MethodType.CASH)
                .notes("Pago grupal")
                .build();

        when(userService.getUserByEmail(CLIENT_EMAIL)).thenReturn(creator);

        assertThrows(BusinessRuleException.class,
                () -> paymentService.createPayment(request, null, CLIENT_EMAIL));
        verify(userService, never()).getUsersByDniForUpdate(any());
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void createPayment_transferWithoutReceipt_throwsBusinessRuleException() {
        User client = buildClient(41L, 30666666);
        ManualPaymentRequestDTO request = ManualPaymentRequestDTO.builder()
                .clientDnis(List.of(client.getDni()))
                .expectedMonthlyFee(25000.0)
                .methodType(MethodType.TRANSFER)
                .build();

        when(userService.getUserByEmail(CLIENT_EMAIL)).thenReturn(client);
        when(userService.getUsersByDniForUpdate(List.of(client.getDni()))).thenReturn(List.of(client));
        when(paymentRepository.findTopByUserAndStatusOrderByCreatedAtDesc(client, PaymentStatus.PENDING))
                .thenReturn(Optional.empty());
        when(settingsService.getMonthlyFeeStrict()).thenReturn(25000.0);

        assertThrows(BusinessRuleException.class,
                () -> paymentService.createPayment(request, null, CLIENT_EMAIL));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void createPayment_clientCashWithoutNotes_throwsBusinessRuleException() {
        User client = buildClient(41L, 30666666);
        ManualPaymentRequestDTO request = ManualPaymentRequestDTO.builder()
                .clientDnis(List.of(client.getDni()))
                .expectedMonthlyFee(25000.0)
                .methodType(MethodType.CASH)
                .build();

        when(userService.getUserByEmail(CLIENT_EMAIL)).thenReturn(client);
        when(userService.getUsersByDniForUpdate(List.of(client.getDni()))).thenReturn(List.of(client));
        when(paymentRepository.findTopByUserAndStatusOrderByCreatedAtDesc(client, PaymentStatus.PENDING))
                .thenReturn(Optional.empty());
        when(settingsService.getMonthlyFeeStrict()).thenReturn(25000.0);

        assertThrows(BusinessRuleException.class,
                () -> paymentService.createPayment(request, null, CLIENT_EMAIL));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void createPayment_withChangedMonthlyFee_throwsBusinessRuleException() {
        User client = buildClient(41L, 30666666);
        ManualPaymentRequestDTO request = ManualPaymentRequestDTO.builder()
                .clientDnis(List.of(client.getDni()))
                .expectedMonthlyFee(20000.0)
                .methodType(MethodType.CASH)
                .notes("Pago en recepción")
                .build();

        when(userService.getUserByEmail(CLIENT_EMAIL)).thenReturn(client);
        when(userService.getUsersByDniForUpdate(List.of(client.getDni()))).thenReturn(List.of(client));
        when(paymentRepository.findTopByUserAndStatusOrderByCreatedAtDesc(client, PaymentStatus.PENDING))
                .thenReturn(Optional.empty());
        when(settingsService.getMonthlyFeeStrict()).thenReturn(25000.0);

        assertThrows(BusinessRuleException.class,
                () -> paymentService.createPayment(request, null, CLIENT_EMAIL));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void createPayment_clientGroupTransfer_storesOneSharedReceipt() {
        User creator = buildClient(41L, 30666666);
        User secondClient = buildClient(42L, 30666667);
        ManualPaymentRequestDTO request = ManualPaymentRequestDTO.builder()
                .clientDnis(List.of(creator.getDni(), secondClient.getDni()))
                .expectedMonthlyFee(25000.0)
                .methodType(MethodType.TRANSFER)
                .build();
        MockMultipartFile receipt = new MockMultipartFile(
                "file", "grupo.pdf", "application/pdf", "receipt-content".getBytes());

        when(userService.getUserByEmail(CLIENT_EMAIL)).thenReturn(creator);
        when(userService.getUsersByDniForUpdate(List.of(creator.getDni(), secondClient.getDni())))
                .thenReturn(List.of(creator, secondClient));
        when(paymentRepository.findTopByUserAndStatusOrderByCreatedAtDesc(any(User.class),
                eq(PaymentStatus.PENDING))).thenReturn(Optional.empty());
        when(settingsService.getMonthlyFeeStrict()).thenReturn(25000.0);
        when(paymentFileRepository.save(any(PaymentFile.class))).thenAnswer(invocation -> {
            PaymentFile file = invocation.getArgument(0);
            file.setId(90L);
            return file;
        });
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment payment = paymentService.createPayment(request, receipt, CLIENT_EMAIL);

        assertEquals(PaymentStatus.PENDING, payment.getStatus());
        assertEquals(Set.of(creator, secondClient), payment.getUsers());
        assertNotNull(payment.getPaymentFile());
        assertEquals("application/pdf", payment.getPaymentFile().getContentType());
        assertEquals("grupo.pdf", payment.getPaymentFile().getFileName());
        assertEquals(true, Files.exists(Path.of(payment.getPaymentFile().getFilePath())));
        verify(paymentFileRepository).save(any(PaymentFile.class));
    }

    @Test
    void createPayment_whenTransactionRollsBack_removesCopiedReceipt() throws IOException {
        User client = buildClient(41L, 30666666);
        ManualPaymentRequestDTO request = ManualPaymentRequestDTO.builder()
                .clientDnis(List.of(client.getDni()))
                .expectedMonthlyFee(25000.0)
                .methodType(MethodType.TRANSFER)
                .build();
        MockMultipartFile receipt = new MockMultipartFile(
                "file", "receipt.pdf", "application/pdf", "receipt-content".getBytes());

        when(userService.getUserByEmail(CLIENT_EMAIL)).thenReturn(client);
        when(userService.getUsersByDniForUpdate(List.of(client.getDni()))).thenReturn(List.of(client));
        when(paymentRepository.findTopByUserAndStatusOrderByCreatedAtDesc(client, PaymentStatus.PENDING))
                .thenReturn(Optional.empty());
        when(settingsService.getMonthlyFeeStrict()).thenReturn(25000.0);
        when(paymentFileRepository.save(any(PaymentFile.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(paymentRepository.save(any(Payment.class))).thenThrow(new RuntimeException("database failure"));

        TransactionSynchronizationManager.initSynchronization();
        try {
            assertThrows(RuntimeException.class,
                    () -> paymentService.createPayment(request, receipt, CLIENT_EMAIL));
            List<TransactionSynchronization> synchronizations = TransactionSynchronizationManager.getSynchronizations();
            assertEquals(1, synchronizations.size());
            synchronizations.forEach(sync -> sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }

        try (var files = Files.list(uploadDirectory)) {
            assertEquals(0, files.count());
        }
    }

    @Test
    void createPayment_withExistingPendingPayment_throwsBusinessRuleException() {
        User client = buildClient(51L, 30777777);

        Payment pendingPayment = Payment.builder()
                .id(101L)
                .status(PaymentStatus.PENDING)
                .createdAt(LocalDateTime.of(2026, 4, 2, 10, 0))
                .build();

        ManualPaymentRequestDTO request = ManualPaymentRequestDTO.builder()
                .clientDnis(List.of(client.getDni()))
                .expectedMonthlyFee(30000.0)
                .methodType(MethodType.CASH)
                .notes("Pago en recepción")
                .build();

        when(userService.getUserByEmail(CLIENT_EMAIL)).thenReturn(client);
        when(userService.getUsersByDniForUpdate(List.of(client.getDni()))).thenReturn(List.of(client));
        when(paymentRepository.findTopByUserAndStatusOrderByCreatedAtDesc(client, PaymentStatus.PENDING))
                .thenReturn(Optional.of(pendingPayment));

        assertThrows(BusinessRuleException.class, () -> paymentService.createPayment(request, null, CLIENT_EMAIL));
    }

    @Test
    void createPayment_withNonClientTarget_throwsBusinessRuleException() {
        User trainer = buildUser(61L, 30888888, UserRole.TRAINER, UserStatus.ACTIVE, "trainer@personalfit.test");

        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);
        ManualPaymentRequestDTO request = ManualPaymentRequestDTO.builder()
                .clientDnis(List.of(trainer.getDni()))
                .expectedMonthlyFee(30000.0)
                .methodType(MethodType.CASH)
                .build();

        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);
        when(userService.getUsersByDniForUpdate(List.of(trainer.getDni()))).thenReturn(List.of(trainer));

        assertThrows(BusinessRuleException.class, () -> paymentService.createPayment(request, null, ADMIN_EMAIL));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void updatePaymentStatus_toPaid_skipsAlreadyActiveUsers() {
        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);
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

        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);
        when(paymentRepository.findById(existingPayment.getId())).thenReturn(Optional.of(existingPayment));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        paymentService.updatePaymentStatus(existingPayment.getId(), statusUpdate, ADMIN_EMAIL);

        verify(userService, never()).updateUserStatus(alreadyActiveClient, UserStatus.ACTIVE);
        verify(paymentRepository, times(1)).save(existingPayment);
    }

    @Test
    void updatePaymentStatus_fromPaidToRejected_rejectsIllegalTransition() {
        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);
        Payment existingPayment = Payment.builder()
                .id(100L)
                .status(PaymentStatus.PAID)
                .users(Set.of())
                .build();
        PaymentStatusUpdateDTO statusUpdate = PaymentStatusUpdateDTO.builder()
                .status("REJECTED")
                .rejectionReason("Corrección manual")
                .build();

        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);
        when(paymentRepository.findById(existingPayment.getId())).thenReturn(Optional.of(existingPayment));

        assertThrows(BusinessRuleException.class,
                () -> paymentService.updatePaymentStatus(existingPayment.getId(), statusUpdate, ADMIN_EMAIL));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    // ===== Vencimiento automático de pagos =====

    @Test
    void checkPaidPayments_withHistoricalPendingPayment_expiresWithoutSideEffects() {
        LocalDateTime now = LocalDateTime.of(2026, 4, 5, 10, 0);
        User client = buildClient(11L, 30111111);
        Payment pendingPayment = Payment.builder()
                .id(100L)
                .status(PaymentStatus.PENDING)
                .expiresAt(now.minusDays(1))
                .users(Set.of(client))
                .build();
        mockPendingExpirationQuery(List.of(pendingPayment));

        paymentService.checkPaidPayments();

        assertEquals(PaymentStatus.EXPIRED, pendingPayment.getStatus());
        assertEquals(now, pendingPayment.getUpdatedAt());
        assertNull(pendingPayment.getVerifiedAt());
        assertNull(pendingPayment.getVerifiedBy());
        verify(paymentRepository).saveAll(List.of(pendingPayment));
        verify(userService, never()).updateUserStatus(any(User.class), any(UserStatus.class));
        verify(notificationService, never()).createPaymentExpiredNotification(any(), any());
    }

    @Test
    void checkPaidPayments_withCurrentAndFuturePendingPayments_keepsThemPending() {
        LocalDateTime now = LocalDateTime.of(2026, 4, 5, 10, 0);
        Payment currentPeriodPayment = Payment.builder()
                .id(101L)
                .status(PaymentStatus.PENDING)
                .expiresAt(LocalDateTime.of(2026, 4, 10, 0, 0))
                .build();
        Payment futurePayment = Payment.builder()
                .id(102L)
                .status(PaymentStatus.PENDING)
                .expiresAt(LocalDateTime.of(2026, 5, 10, 0, 0))
                .build();
        mockPendingExpirationQuery(List.of(currentPeriodPayment, futurePayment));

        paymentService.checkPaidPayments();

        assertEquals(PaymentStatus.PENDING, currentPeriodPayment.getStatus());
        assertEquals(PaymentStatus.PENDING, futurePayment.getStatus());
        assertNull(currentPeriodPayment.getUpdatedAt());
        assertNull(futurePayment.getUpdatedAt());
        verify(paymentRepository).findPendingPaymentsExpiringAtOrBefore(now);
        verify(paymentRepository, never()).saveAll(any());
    }

    @Test
    void checkPaidPayments_withExpiredPendingGroup_expiresOnePaymentAndPreservesLinks() {
        User firstClient = buildClient(11L, 30111111);
        User secondClient = buildClient(12L, 30222222);
        Set<User> linkedClients = Set.of(firstClient, secondClient);
        Payment groupPayment = Payment.builder()
                .id(103L)
                .status(PaymentStatus.PENDING)
                .expiresAt(LocalDateTime.of(2026, 4, 1, 0, 0))
                .users(linkedClients)
                .build();
        mockPendingExpirationQuery(List.of(groupPayment));

        paymentService.checkPaidPayments();

        assertEquals(PaymentStatus.EXPIRED, groupPayment.getStatus());
        assertEquals(linkedClients, groupPayment.getUsers());
        verify(paymentRepository, times(1)).saveAll(List.of(groupPayment));
        verify(userService, never()).updateUserStatus(any(User.class), any(UserStatus.class));
    }

    @Test
    void checkPaidPayments_whenRunTwice_doesNotModifyAlreadyExpiredPendingPayment() {
        LocalDateTime firstRun = LocalDateTime.of(2026, 4, 5, 10, 0);
        Payment pendingPayment = Payment.builder()
                .id(104L)
                .status(PaymentStatus.PENDING)
                .expiresAt(firstRun.minusDays(1))
                .build();
        mockPendingExpirationQuery(List.of(pendingPayment));

        paymentService.checkPaidPayments();
        mockCurrentTime(firstRun.plusDays(1));
        paymentService.checkPaidPayments();

        assertEquals(PaymentStatus.EXPIRED, pendingPayment.getStatus());
        assertEquals(firstRun, pendingPayment.getUpdatedAt());
        verify(paymentRepository, times(1)).saveAll(any());
    }

    @Test
    void checkPaidPayments_afterExpiringHistoricalPendingPayment_unblocksInactiveGroupLoad() {
        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);
        User client = buildClient(11L, 30111111);
        Payment historicalPayment = Payment.builder()
                .id(105L)
                .status(PaymentStatus.PENDING)
                .expiresAt(LocalDateTime.of(2026, 4, 1, 0, 0))
                .users(Set.of(client))
                .build();
        mockPendingExpirationQuery(List.of(historicalPayment));

        paymentService.checkPaidPayments();
        verify(userService, never()).updateUserStatus(any(User.class), any(UserStatus.class));

        InactiveClientsPaymentRequestDTO request = InactiveClientsPaymentRequestDTO.builder()
                .clientDnis(List.of(client.getDni()))
                .expectedMonthlyFee(25000.0)
                .build();
        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);
        when(userService.getUsersByDniForUpdate(List.of(client.getDni()))).thenReturn(List.of(client));
        when(paymentRepository.findUserIdsWithPaymentStatus(List.of(client), PaymentStatus.PENDING))
                .thenAnswer(invocation -> historicalPayment.getStatus() == PaymentStatus.PENDING
                        ? List.of(client.getId())
                        : List.of());
        when(settingsService.getMonthlyFeeStrict()).thenReturn(25000.0);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment newPayment = paymentService.createInactiveClientsPayment(request, ADMIN_EMAIL);

        assertEquals(PaymentStatus.PAID, newPayment.getStatus());
        assertEquals(Set.of(client), newPayment.getUsers());
    }

    // ===== Carga rápida de pagos para clientes inactivos =====

    @Test
    void createInactiveClientsPayment_withEligibleClients_createsConfirmedGroupPayment() {
        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);
        User firstClient = buildClient(11L, 30111111);
        User secondClient = buildClient(12L, 30222222);

        InactiveClientsPaymentRequestDTO request = InactiveClientsPaymentRequestDTO.builder()
                .clientDnis(List.of(firstClient.getDni(), secondClient.getDni()))
                .expectedMonthlyFee(25000.0)
                .build();

        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);
        when(userService.getUsersByDniForUpdate(List.of(firstClient.getDni(), secondClient.getDni())))
                .thenReturn(List.of(firstClient, secondClient));
        when(paymentRepository.findUserIdsWithPaymentStatus(List.of(firstClient, secondClient),
                PaymentStatus.PENDING))
                .thenReturn(List.of());
        when(settingsService.getMonthlyFeeStrict()).thenReturn(25000.0);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment payment = invocation.getArgument(0);
            payment.setId(123L);
            return payment;
        });

        Payment createdPayment = paymentService.createInactiveClientsPayment(request, ADMIN_EMAIL);

        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(paymentCaptor.capture());
        verify(userService).updateUserStatus(firstClient, UserStatus.ACTIVE);
        verify(userService).updateUserStatus(secondClient, UserStatus.ACTIVE);

        Payment savedPayment = paymentCaptor.getValue();
        assertNotNull(createdPayment);
        assertEquals(PaymentStatus.PAID, savedPayment.getStatus());
        assertEquals(admin, savedPayment.getCreatedBy());
        assertEquals(admin, savedPayment.getVerifiedBy());
        assertNotNull(savedPayment.getVerifiedAt());
        assertEquals(50000.0, savedPayment.getAmount());
        assertEquals(MethodType.CASH, savedPayment.getMethodType());
        assertEquals(Set.of(firstClient, secondClient), savedPayment.getUsers());
        assertEquals(LocalDateTime.of(2026, 5, 10, 0, 0), savedPayment.getExpiresAt());
    }

    @Test
    void createInactiveClientsPayment_withTransferMethod_rejectsUnsupportedReceiptlessFlow() {
        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);
        User client = buildClient(11L, 30111111);

        InactiveClientsPaymentRequestDTO request = InactiveClientsPaymentRequestDTO.builder()
                .clientDnis(List.of(client.getDni()))
                .expectedMonthlyFee(25000.0)
                .methodType(MethodType.TRANSFER)
                .build();

        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);

        assertThrows(BusinessRuleException.class,
                () -> paymentService.createInactiveClientsPayment(request, ADMIN_EMAIL));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void createInactiveClientsPayment_withDuplicatedDnis_deduplicatesBeforeLoading() {
        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);
        User client = buildClient(11L, 30111111);

        InactiveClientsPaymentRequestDTO request = InactiveClientsPaymentRequestDTO.builder()
                .clientDnis(List.of(client.getDni(), client.getDni()))
                .expectedMonthlyFee(25000.0)
                .build();

        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);
        when(userService.getUsersByDniForUpdate(List.of(client.getDni()))).thenReturn(List.of(client));
        when(paymentRepository.findUserIdsWithPaymentStatus(eq(List.of(client)),
                eq(PaymentStatus.PENDING)))
                .thenReturn(List.of());
        when(settingsService.getMonthlyFeeStrict()).thenReturn(25000.0);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Payment payment = paymentService.createInactiveClientsPayment(request, ADMIN_EMAIL);

        assertEquals(25000.0, payment.getAmount());
        assertEquals(1, payment.getUsers().size());
        verify(userService).getUsersByDniForUpdate(List.of(client.getDni()));
    }

    @Test
    void createInactiveClientsPayment_withEmptySelection_throwsBusinessRuleException() {
        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);

        InactiveClientsPaymentRequestDTO request = InactiveClientsPaymentRequestDTO.builder()
                .clientDnis(List.of())
                .build();

        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);

        assertThrows(BusinessRuleException.class,
                () -> paymentService.createInactiveClientsPayment(request, ADMIN_EMAIL));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void createInactiveClientsPayment_withNonAdminCreator_throwsBusinessRuleException() {
        User client = buildClient(11L, 30111111);

        InactiveClientsPaymentRequestDTO request = InactiveClientsPaymentRequestDTO.builder()
                .clientDnis(List.of(client.getDni()))
                .build();

        when(userService.getUserByEmail(CLIENT_EMAIL)).thenReturn(client);

        assertThrows(BusinessRuleException.class,
                () -> paymentService.createInactiveClientsPayment(request, CLIENT_EMAIL));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void createInactiveClientsPayment_withMissingDni_throwsBusinessRuleException() {
        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);

        InactiveClientsPaymentRequestDTO request = InactiveClientsPaymentRequestDTO.builder()
                .clientDnis(List.of(30111111, 30999999))
                .build();

        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);
        when(userService.getUsersByDniForUpdate(List.of(30111111, 30999999)))
                .thenReturn(List.of(buildClient(11L, 30111111)));

        BusinessRuleException exception = assertThrows(BusinessRuleException.class,
                () -> paymentService.createInactiveClientsPayment(request, ADMIN_EMAIL));
        // El mensaje debe identificar el DNI faltante para que el admin sepa
        // qué integrante del lote causó el rechazo.
        assertEquals(true, exception.getMessage().contains("30999999"));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void createInactiveClientsPayment_withNonClientTarget_throwsBusinessRuleException() {
        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);
        User trainer = buildUser(61L, 30888888, UserRole.TRAINER, UserStatus.INACTIVE, "trainer@personalfit.test");

        InactiveClientsPaymentRequestDTO request = InactiveClientsPaymentRequestDTO.builder()
                .clientDnis(List.of(trainer.getDni()))
                .build();

        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);
        when(userService.getUsersByDniForUpdate(List.of(trainer.getDni()))).thenReturn(List.of(trainer));

        assertThrows(BusinessRuleException.class,
                () -> paymentService.createInactiveClientsPayment(request, ADMIN_EMAIL));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void createInactiveClientsPayment_withActiveClient_throwsBusinessRuleException() {
        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);
        User activeClient = buildClient(11L, 30111111);
        activeClient.setStatus(UserStatus.ACTIVE);

        InactiveClientsPaymentRequestDTO request = InactiveClientsPaymentRequestDTO.builder()
                .clientDnis(List.of(activeClient.getDni()))
                .build();

        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);
        when(userService.getUsersByDniForUpdate(List.of(activeClient.getDni())))
                .thenReturn(List.of(activeClient));

        assertThrows(BusinessRuleException.class,
                () -> paymentService.createInactiveClientsPayment(request, ADMIN_EMAIL));
        verify(paymentRepository, never()).save(any(Payment.class));
        verify(userService, never()).updateUserStatus(any(User.class), any(UserStatus.class));
    }

    @Test
    void createInactiveClientsPayment_withPendingPayment_throwsBusinessRuleException() {
        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);
        User client = buildClient(11L, 30111111);

        InactiveClientsPaymentRequestDTO request = InactiveClientsPaymentRequestDTO.builder()
                .clientDnis(List.of(client.getDni()))
                .build();

        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);
        when(userService.getUsersByDniForUpdate(List.of(client.getDni()))).thenReturn(List.of(client));
        when(paymentRepository.findUserIdsWithPaymentStatus(eq(List.of(client)),
                eq(PaymentStatus.PENDING)))
                .thenReturn(List.of(client.getId()));

        assertThrows(BusinessRuleException.class,
                () -> paymentService.createInactiveClientsPayment(request, ADMIN_EMAIL));
        verify(paymentRepository, never()).save(any(Payment.class));
        verify(userService, never()).updateUserStatus(any(User.class), any(UserStatus.class));
    }

    @Test
    void createInactiveClientsPayment_withPendingPaymentFromPreviousMonth_throwsBusinessRuleException() {
        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);
        User client = buildClient(11L, 30111111);
        InactiveClientsPaymentRequestDTO request = InactiveClientsPaymentRequestDTO.builder()
                .clientDnis(List.of(client.getDni()))
                .expectedMonthlyFee(25000.0)
                .build();

        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);
        when(userService.getUsersByDniForUpdate(List.of(client.getDni()))).thenReturn(List.of(client));
        when(paymentRepository.findUserIdsWithPaymentStatus(List.of(client), PaymentStatus.PENDING))
                .thenReturn(List.of(client.getId()));

        assertThrows(BusinessRuleException.class,
                () -> paymentService.createInactiveClientsPayment(request, ADMIN_EMAIL));
        verify(paymentRepository, never()).save(any(Payment.class));
    }

    @Test
    void createInactiveClientsPayment_withChangedMonthlyFee_throwsBusinessRuleException() {
        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);
        User client = buildClient(11L, 30111111);

        // El admin confirmó viendo una cuota de 20000, pero la vigente es 25000
        InactiveClientsPaymentRequestDTO request = InactiveClientsPaymentRequestDTO.builder()
                .clientDnis(List.of(client.getDni()))
                .expectedMonthlyFee(20000.0)
                .build();

        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);
        when(userService.getUsersByDniForUpdate(List.of(client.getDni()))).thenReturn(List.of(client));
        when(paymentRepository.findUserIdsWithPaymentStatus(eq(List.of(client)),
                eq(PaymentStatus.PENDING)))
                .thenReturn(List.of());
        when(settingsService.getMonthlyFeeStrict()).thenReturn(25000.0);

        assertThrows(BusinessRuleException.class,
                () -> paymentService.createInactiveClientsPayment(request, ADMIN_EMAIL));
        verify(paymentRepository, never()).save(any(Payment.class));
        verify(userService, never()).updateUserStatus(any(User.class), any(UserStatus.class));
    }

    @Test
    void getPaymentDetails_withAdminCreatorNotPayer_exposesClientsAsPayers() {
        User admin = buildAdmin(1L, 20111111, ADMIN_EMAIL);
        User client = buildClient(11L, 30111111);
        client.setFirstName("Ana");
        client.setLastName("Gomez");

        Payment payment = Payment.builder()
                .id(200L)
                .amount(25000.0)
                .status(PaymentStatus.PAID)
                .createdAt(LocalDateTime.of(2026, 4, 5, 10, 0))
                .createdBy(admin)
                .users(Set.of(client))
                .build();

        when(paymentRepository.findById(payment.getId())).thenReturn(Optional.of(payment));
        when(userService.getUserByEmail(ADMIN_EMAIL)).thenReturn(admin);

        var dto = paymentService.getPaymentDetails(payment.getId(), ADMIN_EMAIL);

        // El admin creador NO debe figurar como cliente pagador: ni como
        // cliente principal ni dentro de associatedUsers.
        assertEquals(client.getId(), dto.getClientId());
        assertEquals("Ana Gomez", dto.getClientName());
        assertEquals(1, dto.getAssociatedUsers().size());
        assertEquals(client.getId(), dto.getAssociatedUsers().get(0).getUserId());
    }

    @Test
    void getUserPayments_rejectsAnotherClientsHistory() {
        User actor = buildClient(11L, 30111111);
        when(userService.getUserByEmail(CLIENT_EMAIL)).thenReturn(actor);

        assertThrows(AccessDeniedException.class,
                () -> paymentService.getUserPayments(99L, CLIENT_EMAIL));
        verify(paymentRepository, never()).findAllByUserIdWithDetails(99L);
    }

    @Test
    void getPaymentDetails_rejectsUnrelatedClient() {
        User participant = buildClient(11L, 30111111);
        User outsider = buildUser(13L, 30333333, UserRole.CLIENT, UserStatus.INACTIVE,
                "outsider@personalfit.test");
        Payment payment = Payment.builder()
                .id(200L)
                .createdBy(participant)
                .users(Set.of(participant))
                .build();

        when(paymentRepository.findById(payment.getId())).thenReturn(Optional.of(payment));
        when(userService.getUserByEmail(outsider.getEmail())).thenReturn(outsider);

        assertThrows(AccessDeniedException.class,
                () -> paymentService.getPaymentDetails(payment.getId(), outsider.getEmail()));
    }

    @Test
    void getAuthorizedPaymentFile_allowsGroupParticipant() {
        User creator = buildClient(11L, 30111111);
        User participant = buildUser(12L, 30222222, UserRole.CLIENT, UserStatus.INACTIVE,
                "participant@personalfit.test");
        PaymentFile paymentFile = PaymentFile.builder().id(70L).filePath("/tmp/receipt.pdf").build();
        Payment payment = Payment.builder()
                .id(200L)
                .createdBy(creator)
                .users(Set.of(creator, participant))
                .paymentFile(paymentFile)
                .build();

        when(paymentRepository.findByPaymentFileIdWithUsers(paymentFile.getId())).thenReturn(Optional.of(payment));
        when(userService.getUserByEmail(participant.getEmail())).thenReturn(participant);

        assertEquals(paymentFile,
                paymentService.getAuthorizedPaymentFile(paymentFile.getId(), participant.getEmail()));
    }

    @Test
    void getAuthorizedPaymentFile_rejectsUnrelatedClient() {
        User creator = buildClient(11L, 30111111);
        User outsider = buildUser(13L, 30333333, UserRole.CLIENT, UserStatus.INACTIVE,
                "outsider@personalfit.test");
        PaymentFile paymentFile = PaymentFile.builder().id(70L).filePath("/tmp/receipt.pdf").build();
        Payment payment = Payment.builder()
                .id(200L)
                .createdBy(creator)
                .users(Set.of(creator))
                .paymentFile(paymentFile)
                .build();

        when(paymentRepository.findByPaymentFileIdWithUsers(paymentFile.getId())).thenReturn(Optional.of(payment));
        when(userService.getUserByEmail(outsider.getEmail())).thenReturn(outsider);

        assertThrows(AccessDeniedException.class,
                () -> paymentService.getAuthorizedPaymentFile(paymentFile.getId(), outsider.getEmail()));
    }

    private void mockPendingExpirationQuery(List<Payment> candidates) {
        when(paymentRepository.findPendingPaymentsExpiringAtOrBefore(any(LocalDateTime.class)))
                .thenAnswer(invocation -> {
                    LocalDateTime cutoff = invocation.getArgument(0);
                    return candidates.stream()
                            .filter(payment -> payment.getStatus() == PaymentStatus.PENDING)
                            .filter(payment -> payment.getExpiresAt() != null)
                            .filter(payment -> !payment.getExpiresAt().isAfter(cutoff))
                            .toList();
                });
    }

    private void mockCurrentTime(LocalDateTime now) {
        ZoneId zone = ZoneId.of("UTC");
        Instant instant = now.atZone(zone).toInstant();
        lenient().when(clock.getZone()).thenReturn(zone);
        lenient().when(clock.instant()).thenReturn(instant);
    }

    private User buildClient(Long id, Integer dni) {
        return buildUser(id, dni, UserRole.CLIENT, UserStatus.INACTIVE, CLIENT_EMAIL);
    }

    private User buildAdmin(Long id, Integer dni, String email) {
        return buildUser(id, dni, UserRole.ADMIN, UserStatus.ACTIVE, email);
    }

    private User buildUser(Long id, Integer dni, UserRole role, UserStatus status, String email) {
        User user = new User();
        user.setId(id);
        user.setDni(dni);
        user.setFirstName("Cliente");
        user.setLastName(String.valueOf(dni));
        user.setEmail(email);
        user.setRole(role);
        user.setStatus(status);
        return user;
    }
}
