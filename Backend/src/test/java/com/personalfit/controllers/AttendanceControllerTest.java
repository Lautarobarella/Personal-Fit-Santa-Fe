package com.personalfit.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.personalfit.dto.Attendance.AttendanceDTO;
import com.personalfit.enums.AttendanceStatus;
import com.personalfit.services.AttendanceService;
import com.personalfit.services.UserService;
import com.personalfit.services.WorkShiftService;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for AttendanceController.
 * Covers enrollment, attendance tracking, NFC-based attendance, and status updates.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AttendanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @MockitoBean
    private AttendanceService attendanceService;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private WorkShiftService workShiftService;

    private AttendanceDTO sampleAttendance;

    @BeforeEach
    void setUp() {
        sampleAttendance = AttendanceDTO.builder()
                .id(1L)
                .activityId(100L)
                .userId(10L)
                .firstName("Juan")
                .lastName("Perez")
                .status(AttendanceStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("POST /api/attendance/enroll/{userId}/{activityId}")
    class EnrollTests {

        @Test
        @DisplayName("should enroll user in activity")
        void enrollUser_ValidIds_ReturnsAttendance() throws Exception {
            when(attendanceService.enrollUser(10L, 100L)).thenReturn(sampleAttendance);

            mockMvc.perform(post("/api/attendance/enroll/10/100")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.userId").value(10))
                    .andExpect(jsonPath("$.activityId").value(100))
                    .andExpect(jsonPath("$.status").value("PENDING"));
        }
    }

    @Nested
    @DisplayName("DELETE /api/attendance/unenroll/{userId}/{activityId}")
    class UnenrollTests {

        @Test
        @DisplayName("should unenroll user from activity")
        void unenrollUser_ValidIds_ReturnsOk() throws Exception {
            doNothing().when(attendanceService).unenrollUser(10L, 100L);

            mockMvc.perform(delete("/api/attendance/unenroll/10/100")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.userId").value(10))
                    .andExpect(jsonPath("$.activityId").value(100));
        }
    }

    @Nested
    @DisplayName("GET /api/attendance/activity/{activityId}")
    class GetActivityAttendancesTests {

        @Test
        @DisplayName("should return attendance list for activity")
        void getActivityAttendances_ReturnsList() throws Exception {
            AttendanceDTO att2 = AttendanceDTO.builder()
                    .id(2L).activityId(100L).userId(11L)
                    .firstName("Ana").lastName("Gomez")
                    .status(AttendanceStatus.PRESENT).build();

            when(attendanceService.getActivityAttendances(100L))
                    .thenReturn(Arrays.asList(sampleAttendance, att2));

            mockMvc.perform(get("/api/attendance/activity/100")
                            .with(user("trainer").roles("TRAINER")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2));
        }
    }

    @Nested
    @DisplayName("GET /api/attendance/activity/{activityId}/with-user-info")
    class GetAttendancesWithUserInfoTests {

        @Test
        @DisplayName("should return enriched attendance with user names")
        void getWithUserInfo_ReturnsList() throws Exception {
            when(attendanceService.getActivityAttendancesWithUserInfo(100L))
                    .thenReturn(List.of(sampleAttendance));

            mockMvc.perform(get("/api/attendance/activity/100/with-user-info")
                            .with(user("trainer").roles("TRAINER")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].firstName").value("Juan"))
                    .andExpect(jsonPath("$[0].lastName").value("Perez"));
        }
    }

    @Nested
    @DisplayName("GET /api/attendance/user/{userId}")
    class GetUserAttendancesTests {

        @Test
        @DisplayName("should return user's attendance history")
        void getUserAttendances_ReturnsList() throws Exception {
            when(attendanceService.getUserAttendances(10L))
                    .thenReturn(List.of(sampleAttendance));

            mockMvc.perform(get("/api/attendance/user/10")
                            .with(user("client").roles("CLIENT")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].status").value("PENDING"));
        }
    }

    @Nested
    @DisplayName("PUT /api/attendance/{attendanceId}/status")
    class UpdateStatusTests {

        @Test
        @DisplayName("should update attendance status to PRESENT")
        void updateStatus_ValidStatus_ReturnsOk() throws Exception {
            doNothing().when(attendanceService).updateAttendanceStatus(1L, AttendanceStatus.PRESENT);

            Map<String, String> body = new HashMap<>();
            body.put("status", "PRESENT");

            mockMvc.perform(put("/api/attendance/1/status")
                            .with(user("trainer").roles("TRAINER"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.status").value("PRESENT"));
        }

        @Test
        @DisplayName("should return 400 for invalid status")
        void updateStatus_InvalidStatus_Returns400() throws Exception {
            Map<String, String> body = new HashMap<>();
            body.put("status", "INVALID_STATUS");

            mockMvc.perform(put("/api/attendance/1/status")
                            .with(user("trainer").roles("TRAINER"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    @Nested
    @DisplayName("GET /api/attendance/{activityId}/enrolled/{userId}")
    class CheckEnrollmentTests {

        @Test
        @DisplayName("should check enrollment status")
        void isUserEnrolled_ReturnsBoolean() throws Exception {
            when(attendanceService.isUserEnrolled(10L, 100L)).thenReturn(true);

            mockMvc.perform(get("/api/attendance/100/enrolled/10")
                            .with(user("client").roles("CLIENT")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").value(true));
        }

        @Test
        @DisplayName("should return false when not enrolled")
        void isUserNotEnrolled_ReturnsFalse() throws Exception {
            when(attendanceService.isUserEnrolled(10L, 100L)).thenReturn(false);

            mockMvc.perform(get("/api/attendance/100/enrolled/10")
                            .with(user("client").roles("CLIENT")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").value(false));
        }
    }

    @Nested
    @DisplayName("POST /api/attendance/nfc/... (NFC Attendance)")
    class NfcAttendanceTests {

        private static final String NFC_ENDPOINT =
                "/api/attendance/nfc/9551674a19bae81d4d27f5436470c9ee6ecd0b371088686f6afc58d6bf68df30";

        @Test
        @DisplayName("NFC endpoint should be publicly accessible")
        void nfcEndpoint_NoAuth_NotUnauthorized() throws Exception {
            Map<String, Integer> body = new HashMap<>();
            body.put("dni", 123456);

            // Test mode backdoor should return success
            mockMvc.perform(post(NFC_ENDPOINT)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.status").value("PRESENT"))
                    .andExpect(jsonPath("$.userName").value("Test User"));
        }

        @Test
        @DisplayName("NFC endpoint should return 400 when DNI is missing")
        void nfcEndpoint_NoDni_Returns400() throws Exception {
            Map<String, Integer> body = new HashMap<>();
            // No DNI provided

            mockMvc.perform(post(NFC_ENDPOINT)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(body)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false));
        }
    }

    @Nested
    @DisplayName("Security Tests")
    class SecurityTests {

        @Test
        @DisplayName("should require authentication for attendance listing")
        void protectedEndpoint_NoAuth_Returns401() throws Exception {
            mockMvc.perform(get("/api/attendance/user/10"))
                    .andExpect(status().isUnauthorized());
        }
    }
}
