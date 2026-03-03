package com.personalfit.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.personalfit.dto.Activity.ActivityDetailInfoDTO;
import com.personalfit.dto.Activity.ActivityFormTypeDTO;
import com.personalfit.dto.Activity.ActivityTypeDTO;
import com.personalfit.dto.Attendance.EnrollmentRequestDTO;
import com.personalfit.dto.Attendance.EnrollmentResponseDTO;
import com.personalfit.enums.ActivityStatus;
import com.personalfit.services.ActivityService;
import com.personalfit.services.ActivitySummaryService;

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

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for ActivityController.
 * Covers CRUD operations, enrollment, and batch creation of activities.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ActivityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @MockitoBean
    private ActivityService activityService;

    @MockitoBean
    private ActivitySummaryService activitySummaryService;

    private ActivityFormTypeDTO validActivityForm;

    @BeforeEach
    void setUp() {
        validActivityForm = ActivityFormTypeDTO.builder()
                .name("Yoga Matutino")
                .description("Clase de yoga para principiantes")
                .location("Sala A")
                .trainerId("1")
                .date(LocalDate.now().plusDays(1))
                .time(LocalTime.of(9, 0))
                .duration("60")
                .maxParticipants("15")
                .isRecurring(false)
                .build();
    }

    @Nested
    @DisplayName("POST /api/activities/new")
    class CreateActivityTests {

        @Test
        @DisplayName("should create activity successfully")
        void createActivity_ValidData_ReturnsOk() throws Exception {
            doNothing().when(activityService).createActivity(any(ActivityFormTypeDTO.class));

            mockMvc.perform(post("/api/activities/new")
                            .with(user("admin").roles("ADMIN"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validActivityForm)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Activity created successfully"));
        }
    }

    @Nested
    @DisplayName("PUT /api/activities/{id}")
    class UpdateActivityTests {

        @Test
        @DisplayName("should update activity successfully")
        void updateActivity_ValidData_ReturnsOk() throws Exception {
            doNothing().when(activityService).updateActivity(eq(1L), any(ActivityFormTypeDTO.class));

            mockMvc.perform(put("/api/activities/1")
                            .with(user("admin").roles("ADMIN"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validActivityForm)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.activityId").value(1));
        }
    }

    @Nested
    @DisplayName("DELETE /api/activities/{id}")
    class DeleteActivityTests {

        @Test
        @DisplayName("should delete activity by ID")
        void deleteActivity_ValidId_ReturnsOk() throws Exception {
            doNothing().when(activityService).deleteActivity(1L);

            mockMvc.perform(delete("/api/activities/1")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.activityId").value(1));
        }
    }

    @Nested
    @DisplayName("GET /api/activities/getAll")
    class GetAllActivitiesTests {

        @Test
        @DisplayName("should return all activities")
        void getAllActivities_ReturnsList() throws Exception {
            ActivityTypeDTO act1 = ActivityTypeDTO.builder()
                    .id(1L)
                    .name("Yoga")
                    .status(ActivityStatus.ACTIVE)
                    .currentParticipants(5)
                    .maxParticipants(15)
                    .build();

            ActivityTypeDTO act2 = ActivityTypeDTO.builder()
                    .id(2L)
                    .name("Pilates")
                    .status(ActivityStatus.ACTIVE)
                    .currentParticipants(8)
                    .maxParticipants(12)
                    .build();

            when(activityService.getAllActivitiesTypeDto()).thenReturn(Arrays.asList(act1, act2));

            mockMvc.perform(get("/api/activities/getAll")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].name").value("Yoga"))
                    .andExpect(jsonPath("$[1].name").value("Pilates"));
        }
    }

    @Nested
    @DisplayName("GET /api/activities/getAllByWeek/{date}")
    class GetActivitiesByWeekTests {

        @Test
        @DisplayName("should return activities for a specific week")
        void getActivitiesByWeek_ValidDate_ReturnsList() throws Exception {
            ActivityTypeDTO act = ActivityTypeDTO.builder()
                    .id(1L)
                    .name("Spinning")
                    .status(ActivityStatus.ACTIVE)
                    .build();

            when(activityService.getAllActivitiesTypeDtoAtWeek(any(LocalDate.class)))
                    .thenReturn(List.of(act));

            mockMvc.perform(get("/api/activities/getAllByWeek/2026-03-03")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].name").value("Spinning"));
        }
    }

    @Nested
    @DisplayName("GET /api/activities/{id}")
    class GetActivityDetailTests {

        @Test
        @DisplayName("should return activity detail info")
        void getActivityDetail_ValidId_ReturnsDetail() throws Exception {
            ActivityDetailInfoDTO detail = ActivityDetailInfoDTO.builder()
                    .id(1L)
                    .name("Yoga Matutino")
                    .description("Clase de yoga")
                    .location("Sala A")
                    .trainerName("Laura")
                    .duration(60)
                    .maxParticipants(15)
                    .currentParticipants(5)
                    .status(ActivityStatus.ACTIVE)
                    .build();

            when(activityService.getActivityDetailInfo(1L)).thenReturn(detail);

            mockMvc.perform(get("/api/activities/1")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.name").value("Yoga Matutino"))
                    .andExpect(jsonPath("$.trainerName").value("Laura"))
                    .andExpect(jsonPath("$.maxParticipants").value(15));
        }
    }

    @Nested
    @DisplayName("Enrollment Endpoints")
    class EnrollmentTests {

        @Test
        @DisplayName("POST /api/activities/enroll - should enroll user")
        void enrollUser_ValidRequest_ReturnsOk() throws Exception {
            EnrollmentRequestDTO request = EnrollmentRequestDTO.builder()
                    .activityId(1L)
                    .userId(10L)
                    .build();

            EnrollmentResponseDTO response = EnrollmentResponseDTO.builder()
                    .success(true)
                    .message("Enrolled successfully")
                    .build();

            when(activityService.enrollUser(any(EnrollmentRequestDTO.class))).thenReturn(response);

            mockMvc.perform(post("/api/activities/enroll")
                            .with(user("client").roles("CLIENT"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("POST /api/activities/unenroll - should unenroll user")
        void unenrollUser_ValidRequest_ReturnsOk() throws Exception {
            EnrollmentRequestDTO request = EnrollmentRequestDTO.builder()
                    .activityId(1L)
                    .userId(10L)
                    .build();

            EnrollmentResponseDTO response = EnrollmentResponseDTO.builder()
                    .success(true)
                    .message("Unenrolled successfully")
                    .build();

            when(activityService.unenrollUser(any(EnrollmentRequestDTO.class))).thenReturn(response);

            mockMvc.perform(post("/api/activities/unenroll")
                            .with(user("client").roles("CLIENT"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("GET /api/activities/{activityId}/enrolled/{userId} - should check enrollment")
        void isUserEnrolled_ReturnsBoolean() throws Exception {
            when(activityService.isUserEnrolled(10L, 1L)).thenReturn(true);

            mockMvc.perform(get("/api/activities/1/enrolled/10")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").value(true));
        }
    }

    @Nested
    @DisplayName("Batch Operations")
    class BatchTests {

        @Test
        @DisplayName("POST /api/activities/batch - should create batch activities")
        void createBatchActivities_ReturnsCreatedCount() throws Exception {
            List<ActivityFormTypeDTO> forms = Arrays.asList(validActivityForm, validActivityForm);
            when(activityService.createBatchActivities(anyList())).thenReturn(2);

            mockMvc.perform(post("/api/activities/batch")
                            .with(user("admin").roles("ADMIN"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(forms)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.createdCount").value(2));
        }
    }

    @Nested
    @DisplayName("Security Tests")
    class SecurityTests {

        @Test
        @DisplayName("should require authentication for activity endpoints")
        void protectedEndpoint_NoAuth_Returns401() throws Exception {
            mockMvc.perform(get("/api/activities/getAll"))
                    .andExpect(status().isUnauthorized());
        }
    }
}
