package com.personalfit.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.personalfit.dto.User.ClientStatsDTO;
import com.personalfit.dto.User.CreateUserDTO;
import com.personalfit.dto.User.UserDetailInfoDTO;
import com.personalfit.dto.User.UserTypeDTO;
import com.personalfit.enums.UserRole;
import com.personalfit.enums.UserStatus;
import com.personalfit.models.User;
import com.personalfit.services.UserService;

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

import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for UserController.
 * Covers user CRUD, profile updates, password changes, and stats endpoints.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @MockitoBean
    private UserService userService;

    private CreateUserDTO validCreateUserDTO;
    private UserDetailInfoDTO sampleUserDetailDTO;
    private User sampleUser;

    @BeforeEach
    void setUp() {
        validCreateUserDTO = new CreateUserDTO();
        validCreateUserDTO.setDni("12345678");
        validCreateUserDTO.setFirstName("Juan");
        validCreateUserDTO.setLastName("Perez");
        validCreateUserDTO.setEmail("juan@test.com");
        validCreateUserDTO.setPhone("1234567890");
        validCreateUserDTO.setPassword("password123");
        validCreateUserDTO.setRole(UserRole.CLIENT);
        validCreateUserDTO.setStatus(UserStatus.ACTIVE);
        validCreateUserDTO.setAddress("Calle Falsa 123");
        validCreateUserDTO.setBirthDate(java.time.LocalDate.of(1990, 1, 15));

        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setDni(12345678);
        sampleUser.setFirstName("Juan");
        sampleUser.setLastName("Perez");
        sampleUser.setEmail("juan@test.com");
        sampleUser.setRole(UserRole.CLIENT);
        sampleUser.setStatus(UserStatus.ACTIVE);

        sampleUserDetailDTO = new UserDetailInfoDTO(sampleUser);
    }

    @Nested
    @DisplayName("POST /api/users/new")
    class CreateUserTests {

        @Test
        @DisplayName("should create user successfully with valid data")
        void createUser_ValidData_Returns201() throws Exception {
            when(userService.createNewUser(any(CreateUserDTO.class))).thenReturn(true);

            mockMvc.perform(post("/api/users/new")
                            .with(user("admin").roles("ADMIN"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validCreateUserDTO)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("User created successfully"));
        }
    }

    @Nested
    @DisplayName("POST /api/users/public/first-admin")
    class FirstAdminTests {

        @Test
        @DisplayName("should create first admin without authentication")
        void createFirstAdmin_NoAuth_Returns201() throws Exception {
            when(userService.createNewUser(any(CreateUserDTO.class))).thenReturn(true);

            mockMvc.perform(post("/api/users/public/first-admin")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(validCreateUserDTO)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.role").value("ADMIN"));
        }
    }

    @Nested
    @DisplayName("DELETE /api/users/delete/{id}")
    class DeleteUserTests {

        @Test
        @DisplayName("should delete user by ID")
        void deleteUser_ValidId_ReturnsOk() throws Exception {
            when(userService.deleteUser(1L)).thenReturn(true);

            mockMvc.perform(delete("/api/users/delete/1")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.userId").value(1));
        }
    }

    @Nested
    @DisplayName("GET /api/users/getAll")
    class GetAllUsersTests {

        @Test
        @DisplayName("should return all users")
        void getAllUsers_ReturnsUserList() throws Exception {
            UserTypeDTO user1 = new UserTypeDTO();
            user1.setId(1L);
            user1.setFirstName("Juan");

            UserTypeDTO user2 = new UserTypeDTO();
            user2.setId(2L);
            user2.setFirstName("Ana");

            when(userService.getAllUsers()).thenReturn(Arrays.asList(user1, user2));

            mockMvc.perform(get("/api/users/getAll")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(2))
                    .andExpect(jsonPath("$[0].firstName").value("Juan"))
                    .andExpect(jsonPath("$[1].firstName").value("Ana"));
        }
    }

    @Nested
    @DisplayName("GET /api/users/info/{id}")
    class GetUserInfoTests {

        @Test
        @DisplayName("should return user info by ID")
        void getUserInfo_ValidId_ReturnsUser() throws Exception {
            when(userService.getUserById(1L)).thenReturn(sampleUser);
            when(userService.createUserDetailInfoDTO(sampleUser)).thenReturn(sampleUserDetailDTO);

            mockMvc.perform(get("/api/users/info/1")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.firstName").value("Juan"))
                    .andExpect(jsonPath("$.lastName").value("Perez"));
        }
    }

    @Nested
    @DisplayName("GET /api/users/by-dni/{dni}")
    class GetUserByDniTests {

        @Test
        @DisplayName("should return user by DNI")
        void getUserByDni_Valid_ReturnsUser() throws Exception {
            when(userService.getUserByDni(12345678)).thenReturn(sampleUser);
            when(userService.createUserDetailInfoDTO(sampleUser)).thenReturn(sampleUserDetailDTO);

            mockMvc.perform(get("/api/users/by-dni/12345678")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.dni").value(12345678));
        }
    }

    @Nested
    @DisplayName("GET /api/users/trainers")
    class GetTrainersTests {

        @Test
        @DisplayName("should return list of trainers")
        void getTrainers_ReturnsList() throws Exception {
            UserTypeDTO trainer = new UserTypeDTO();
            trainer.setId(5L);
            trainer.setFirstName("Laura");

            when(userService.getAllTrainers()).thenReturn(List.of(trainer));

            mockMvc.perform(get("/api/users/trainers")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.length()").value(1))
                    .andExpect(jsonPath("$[0].firstName").value("Laura"));
        }
    }

    @Nested
    @DisplayName("Client Stats Endpoints")
    class ClientStatsTests {

        @Test
        @DisplayName("GET /api/users/stats/{id} - should return client stats")
        void getClientStats_ReturnsStats() throws Exception {
            ClientStatsDTO stats = ClientStatsDTO.builder()
                    .weeklyActivityCount(3)
                    .completedClassesCount(15)
                    .membershipStatus(UserStatus.ACTIVE)
                    .remainingDays(20)
                    .build();

            when(userService.getClientStats(1L)).thenReturn(stats);

            mockMvc.perform(get("/api/users/stats/1")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.weeklyActivityCount").value(3))
                    .andExpect(jsonPath("$.completedClassesCount").value(15))
                    .andExpect(jsonPath("$.membershipStatus").value("ACTIVE"));
        }

        @Test
        @DisplayName("GET /api/users/{id}/weekly-activities - should return weekly count")
        void getWeeklyActivities_ReturnsCount() throws Exception {
            when(userService.getUserById(1L)).thenReturn(sampleUser);
            when(userService.getWeeklyActivityCount(sampleUser)).thenReturn(5);

            mockMvc.perform(get("/api/users/1/weekly-activities")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").value(5));
        }

        @Test
        @DisplayName("GET /api/users/{id}/completed-classes - should return completed count")
        void getCompletedClasses_ReturnsCount() throws Exception {
            when(userService.getUserById(1L)).thenReturn(sampleUser);
            when(userService.getCompletedClassesCount(sampleUser)).thenReturn(25);

            mockMvc.perform(get("/api/users/1/completed-classes")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$").value(25));
        }

        @Test
        @DisplayName("GET /api/users/{id}/membership-status - should return status")
        void getMembershipStatus_ReturnsStatus() throws Exception {
            when(userService.getUserById(1L)).thenReturn(sampleUser);
            when(userService.getMembershipStatus(sampleUser)).thenReturn(UserStatus.ACTIVE);

            mockMvc.perform(get("/api/users/1/membership-status")
                            .with(user("admin").roles("ADMIN")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status").value("ACTIVE"))
                    .andExpect(jsonPath("$.clientId").value(1));
        }
    }

    @Nested
    @DisplayName("Batch Operations")
    class BatchTests {

        @Test
        @DisplayName("POST /api/users/batch/clients - should create batch of clients")
        void createBatchClients_ReturnsCreatedCount() throws Exception {
            List<CreateUserDTO> users = Arrays.asList(validCreateUserDTO, validCreateUserDTO);
            when(userService.createBatchClients(anyList())).thenReturn(2);

            mockMvc.perform(post("/api/users/batch/clients")
                            .with(user("admin").roles("ADMIN"))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(users)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.createdCount").value(2));
        }
    }

    @Nested
    @DisplayName("Security Tests")
    class SecurityTests {

        @Test
        @DisplayName("should require authentication for protected endpoints")
        void protectedEndpoint_NoAuth_Returns401() throws Exception {
            mockMvc.perform(get("/api/users/getAll"))
                    .andExpect(status().isUnauthorized());
        }
    }
}
