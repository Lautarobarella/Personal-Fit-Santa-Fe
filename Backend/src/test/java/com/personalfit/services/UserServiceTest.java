package com.personalfit.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.mock.web.MockMultipartFile;

import com.personalfit.enums.AttendanceStatus;
import com.personalfit.enums.PaymentStatus;
import com.personalfit.enums.UserRole;
import com.personalfit.enums.UserStatus;
import com.personalfit.dto.User.UserTypeDTO;
import com.personalfit.models.Activity;
import com.personalfit.models.Attendance;
import com.personalfit.models.Payment;
import com.personalfit.models.User;
import com.personalfit.repository.AttendanceRepository;
import com.personalfit.repository.PaymentRepository;
import com.personalfit.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void getClientStats_countsPresentAndLateForCurrentMonthOnly() {
        User client = buildClient(1L);
        LocalDateTime now = LocalDateTime.now();

        Attendance presentThisMonth = buildAttendance(now.minusDays(2), AttendanceStatus.PRESENT);
        Attendance lateThisMonth = buildAttendance(now.minusDays(1), AttendanceStatus.LATE);
        Attendance absentThisMonth = buildAttendance(now.minusDays(3), AttendanceStatus.ABSENT);
        Attendance previousMonth = buildAttendance(now.minusMonths(1), AttendanceStatus.PRESENT);

        when(userRepository.findById(client.getId())).thenReturn(Optional.of(client));
        when(attendanceRepository.findByUser(client))
                .thenReturn(List.of(presentThisMonth, lateThisMonth, absentThisMonth, previousMonth));
        when(paymentRepository.findTopByUserAndStatusOrderByCreatedAtDesc(client, PaymentStatus.PAID))
                .thenReturn(Optional.of(Payment.builder().expiresAt(now.plusDays(10)).build()));

        assertEquals(2, userService.getClientStats(client.getId()).getWeeklyActivityCount());
    }

    @Test
    void getWeeklyActivityCount_excludesAbsentAndIncludesLate() {
        User client = buildClient(2L);
        LocalDate today = LocalDate.now();
        LocalDateTime monday = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY))
                .atTime(10, 0);

        Attendance presentThisWeek = buildAttendance(monday.plusDays(1), AttendanceStatus.PRESENT);
        Attendance lateThisWeek = buildAttendance(monday.plusDays(2), AttendanceStatus.LATE);
        Attendance absentThisWeek = buildAttendance(monday.plusDays(3), AttendanceStatus.ABSENT);
        Attendance nextWeek = buildAttendance(monday.plusDays(8), AttendanceStatus.PRESENT);

        when(attendanceRepository.findByUser(client))
                .thenReturn(List.of(presentThisWeek, lateThisWeek, absentThisWeek, nextWeek));

        assertEquals(2, userService.getWeeklyActivityCount(client));
    }

    @Test
    void uploadAndDeleteAvatar_usesExpectedFileNameAndRestoresInitials() throws IOException {
        User client = buildClient(15L);
        client.setFirstName("Juan");
        client.setLastName("Pérez");
        client.setAvatar("JP");

        Path tempDirectory = Files.createTempDirectory("avatar-test");
        ReflectionTestUtils.setField(userService, "uploadFolder", tempDirectory.toString());

        MockMultipartFile avatarFile = new MockMultipartFile(
                "file",
                "profile.png",
                "image/png",
                "avatar-content".getBytes());

        when(userRepository.findById(client.getId())).thenReturn(Optional.of(client));
        when(userRepository.save(client)).thenReturn(client);

        UserTypeDTO uploadedUser = userService.uploadAvatar(client.getId(), avatarFile);
        Path expectedFile = tempDirectory.resolve("avatars").resolve("15_Juan_Perez.png");

        assertEquals("avatars/15_Juan_Perez.png", uploadedUser.getAvatar());
        assertTrue(Files.exists(expectedFile));

        UserTypeDTO userAfterDelete = userService.deleteAvatar(client.getId());

        assertEquals("JP", userAfterDelete.getAvatar());
        assertFalse(Files.exists(expectedFile));
    }

    private User buildClient(Long id) {
        User user = new User();
        user.setId(id);
        user.setFirstName("Cliente");
        user.setLastName(String.valueOf(id));
        user.setRole(UserRole.CLIENT);
        user.setStatus(UserStatus.ACTIVE);
        return user;
    }

    private Attendance buildAttendance(LocalDateTime activityDate, AttendanceStatus status) {
        Activity activity = Activity.builder()
                .date(activityDate)
                .build();

        Attendance attendance = new Attendance();
        attendance.setActivity(activity);
        attendance.setAttendance(status);
        return attendance;
    }
}
