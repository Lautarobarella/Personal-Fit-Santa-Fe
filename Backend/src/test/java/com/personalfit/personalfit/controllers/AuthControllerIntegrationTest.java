package com.personalfit.personalfit.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.personalfit.personalfit.dto.AuthRequestDTO;
import com.personalfit.personalfit.dto.AuthResponseDTO;
import com.personalfit.personalfit.dto.InCreateUserDTO;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.repository.IUserRepository;
import com.personalfit.personalfit.security.JwtService;
import com.personalfit.personalfit.services.AuthService;
import com.personalfit.personalfit.utils.UserRole;
import com.personalfit.personalfit.utils.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@AutoConfigureWebMvc
@Transactional
class AuthControllerIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private IUserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private AuthService authService;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private User testUser;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        objectMapper = new ObjectMapper();
        
        // Clean up any existing test data
        userRepository.deleteAll();
        
        // Create test user
        testUser = new User();
        testUser.setFirstName("Test");
        testUser.setLastName("Test");
        testUser.setDni(12345678);
        testUser.setEmail("test@personalfit.com");
        testUser.setPassword(passwordEncoder.encode("password123"));
        testUser.setPhone("123456789");
        testUser.setRole(UserRole.client);
        testUser.setStatus(UserStatus.active);
        // testUser.setCreatedAt(LocalDate.now());
        testUser = userRepository.save(testUser);
    }

    @Test
    void shouldAuthenticateValidUser() throws Exception {
        AuthRequestDTO authRequest = new AuthRequestDTO();
        authRequest.setEmail("test@personalfit.com");
        authRequest.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.refreshToken", notNullValue()))
                .andExpect(jsonPath("$.user.email", is("test@personalfit.com")))
                .andExpect(jsonPath("$.user.name", is("Test")))
                .andExpect(jsonPath("$.user.role", is("CLIENT")));
    }

    @Test
    void shouldRejectInvalidCredentials() throws Exception {
        AuthRequestDTO authRequest = new AuthRequestDTO();
        authRequest.setEmail("test@personalfit.com");
        authRequest.setPassword("wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectNonExistentUser() throws Exception {
        AuthRequestDTO authRequest = new AuthRequestDTO();
        authRequest.setEmail("nonexistent@personalfit.com");
        authRequest.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldValidateEmailFormat() throws Exception {
        AuthRequestDTO authRequest = new AuthRequestDTO();
        authRequest.setEmail("invalid-email");
        authRequest.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRefreshValidToken() throws Exception {
        // First authenticate to get tokens
        AuthRequestDTO authRequest = new AuthRequestDTO();
        authRequest.setEmail("test@personalfit.com");
        authRequest.setPassword("password123");

        AuthResponseDTO authResponse = authService.authenticate(authRequest);
        String refreshToken = authResponse.getRefreshToken();

        // Test refresh token
        mockMvc.perform(post("/api/auth/refresh")
                .param("refreshToken", refreshToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.refreshToken", notNullValue()));
    }

    @Test
    void shouldRejectInvalidRefreshToken() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .param("refreshToken", "invalid-refresh-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldGetCurrentUserWithValidToken() throws Exception {
        // Generate valid JWT token
        String token = jwtService.generateToken(testUser);

        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("test@personalfit.com")))
                .andExpect(jsonPath("$.name", is("Test")))
                .andExpect(jsonPath("$.role", is("CLIENT")));
    }

    @Test
    void shouldRejectUnauthorizedAccessToMe() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectInvalidToken() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer invalid-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldHandleExpiredToken() throws Exception {
        // Create an expired token (this would require mocking or using a test configuration)
        String expiredToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QHBlcnNvbmFsZml0LmNvbSIsImV4cCI6MTYwOTQ1OTIwMH0.invalid";
        
        mockMvc.perform(get("/api/auth/me")
                .header("Authorization", "Bearer " + expiredToken))
                .andExpected(status().isUnauthorized());
    }

    @Test
    void shouldRequirePasswordInLoginRequest() throws Exception {
        AuthRequestDTO authRequest = new AuthRequestDTO();
        authRequest.setEmail("test@personalfit.com");
        // Missing password

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRequireEmailInLoginRequest() throws Exception {
        AuthRequestDTO authRequest = new AuthRequestDTO();
        authRequest.setPassword("password123");
        // Missing email

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldHandleInactiveUser() throws Exception {
        // Create inactive user
        User inactiveUser = new User();
        inactiveUser.setFirstName("Inactive");
        inactiveUser.setLastName("User");
        inactiveUser.setDni(87654321);
        inactiveUser.setEmail("inactive@personalfit.com");
        inactiveUser.setPassword(passwordEncoder.encode("password123"));
        inactiveUser.setPhone("987654321");
        inactiveUser.setRole(UserRole.client);
        inactiveUser.setStatus(UserStatus.inactive);
        // inactiveUser.setCreatedAt(LocalDateTime.now());
        userRepository.save(inactiveUser);

        AuthRequestDTO authRequest = new AuthRequestDTO();
        authRequest.setEmail("inactive@personalfit.com");
        authRequest.setPassword("password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(authRequest)))
                .andExpect(status().isUnauthorized());
    }
}
