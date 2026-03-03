package com.personalfit.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.personalfit.dto.Auth.AuthRequestDTO;
import com.personalfit.dto.Auth.AuthResponseDTO;
import com.personalfit.dto.User.UserTypeDTO;
import com.personalfit.services.AuthService;

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

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Tests for AuthController.
 * Covers login, refresh, and logout flows with cookie-based JWT auth.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @MockitoBean
    private AuthService authService;

    @Nested
    @DisplayName("POST /api/auth/login")
    class LoginTests {

        @Test
        @DisplayName("should return 200 with user info and set cookies on valid credentials")
        void login_ValidCredentials_ReturnsOkWithCookies() throws Exception {
            UserTypeDTO userDto = new UserTypeDTO();
            userDto.setId(1L);
            userDto.setFirstName("Admin");
            userDto.setLastName("User");
            userDto.setEmail("admin@test.com");

            AuthResponseDTO authResponse = AuthResponseDTO.builder()
                    .accessToken("test-access-token")
                    .refreshToken("test-refresh-token")
                    .tokenType("Bearer")
                    .user(userDto)
                    .build();

            when(authService.authenticate(any(AuthRequestDTO.class))).thenReturn(authResponse);

            AuthRequestDTO loginRequest = AuthRequestDTO.builder()
                    .email("Admin@Test.com")
                    .password("password123")
                    .build();

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.user.firstName").value("Admin"))
                    .andExpect(jsonPath("$.tokenType").value("Bearer"))
                    // Tokens should NOT be in body (they're in cookies)
                    .andExpect(jsonPath("$.accessToken").doesNotExist())
                    .andExpect(jsonPath("$.refreshToken").doesNotExist())
                    // Cookies should be set
                    .andExpect(header().exists("Set-Cookie"));
        }

        @Test
        @DisplayName("should normalize email to lowercase before authenticating")
        void login_NormalizesEmail() throws Exception {
            AuthResponseDTO authResponse = AuthResponseDTO.builder()
                    .accessToken("token")
                    .refreshToken("refresh")
                    .tokenType("Bearer")
                    .user(new UserTypeDTO())
                    .build();

            when(authService.authenticate(any(AuthRequestDTO.class))).thenReturn(authResponse);

            AuthRequestDTO loginRequest = AuthRequestDTO.builder()
                    .email("Admin@Test.COM")
                    .password("password123")
                    .build();

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk());

            verify(authService).authenticate(argThat(req ->
                    req.getEmail().equals("admin@test.com")));
        }

        @Test
        @DisplayName("should return 400 when email is missing")
        void login_MissingEmail_Returns400() throws Exception {
            String body = "{\"password\": \"test123\"}";

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/refresh")
    class RefreshTests {

        @Test
        @DisplayName("should refresh tokens when valid refresh token cookie is provided")
        void refresh_ValidCookie_ReturnsNewTokens() throws Exception {
            AuthResponseDTO authResponse = AuthResponseDTO.builder()
                    .accessToken("new-access-token")
                    .refreshToken("new-refresh-token")
                    .tokenType("Bearer")
                    .user(new UserTypeDTO())
                    .build();

            when(authService.refreshToken("valid-refresh-token")).thenReturn(authResponse);

            mockMvc.perform(post("/api/auth/refresh")
                            .cookie(new jakarta.servlet.http.Cookie("refreshToken", "valid-refresh-token")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.tokenType").value("Bearer"))
                    .andExpect(header().exists("Set-Cookie"));
        }

        @Test
        @DisplayName("should return 400 when no refresh token is provided")
        void refresh_NoToken_Returns400() throws Exception {
            mockMvc.perform(post("/api/auth/refresh"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/auth/logout")
    class LogoutTests {

        @Test
        @DisplayName("should clear cookies on logout")
        void logout_ClearsCookies() throws Exception {
            mockMvc.perform(post("/api/auth/logout"))
                    .andExpect(status().isOk())
                    .andExpect(header().exists("Set-Cookie"));
        }
    }
}
