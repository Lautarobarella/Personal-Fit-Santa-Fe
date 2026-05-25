package com.personalfit.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ActiveProfiles;

import io.jsonwebtoken.Claims;

import java.time.Duration;
import java.util.Date;

import static org.assertj.core.api.Assertions.*;

/**
 * Tests for JwtService.
 * Verifies token generation, validation, extraction, and expiration handling.
 */
@SpringBootTest
@ActiveProfiles("test")
class JwtServiceTest {

    @Autowired
    private JwtService jwtService;

    private UserDetails testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .username("test@example.com")
                .password("password")
                .authorities("ROLE_CLIENT")
                .build();
    }

    @Nested
    @DisplayName("Token Generation")
    class TokenGeneration {

        @Test
        @DisplayName("should generate a non-null access token")
        void generateToken_ReturnsNonNull() {
            String token = jwtService.generateToken(testUser);
            assertThat(token).isNotNull().isNotBlank();
        }

        @Test
        @DisplayName("should generate a non-null refresh token")
        void generateRefreshToken_ReturnsNonNull() {
            String token = jwtService.generateRefreshToken(testUser);
            assertThat(token).isNotNull().isNotBlank();
        }

        @Test
        @DisplayName("refresh token should expire in seven days")
        void generateRefreshToken_ExpiresInSevenDays() {
            String refreshToken = jwtService.generateRefreshToken(testUser);

            Date issuedAt = jwtService.extractClaim(refreshToken, Claims::getIssuedAt);
            Date expiresAt = jwtService.extractClaim(refreshToken, Claims::getExpiration);

            Duration refreshDuration = Duration.between(issuedAt.toInstant(), expiresAt.toInstant());
            assertThat(refreshDuration).isBetween(Duration.ofDays(7).minusSeconds(1), Duration.ofDays(7).plusSeconds(1));
        }

        @Test
        @DisplayName("access and refresh tokens should be different")
        void accessAndRefresh_AreDifferent() {
            String accessToken = jwtService.generateToken(testUser);
            String refreshToken = jwtService.generateRefreshToken(testUser);
            assertThat(accessToken).isNotEqualTo(refreshToken);
        }
    }

    @Nested
    @DisplayName("Username Extraction")
    class UsernameExtraction {

        @Test
        @DisplayName("should extract correct username from token")
        void extractUsername_ReturnsCorrectEmail() {
            String token = jwtService.generateToken(testUser);
            String extractedUsername = jwtService.extractUsername(token);
            assertThat(extractedUsername).isEqualTo("test@example.com");
        }
    }

    @Nested
    @DisplayName("Token Validation")
    class TokenValidation {

        @Test
        @DisplayName("should validate a valid token")
        void isTokenValid_ValidToken_ReturnsTrue() {
            String token = jwtService.generateToken(testUser);
            boolean isValid = jwtService.isTokenValid(token, testUser);
            assertThat(isValid).isTrue();
        }

        @Test
        @DisplayName("should reject token for different user")
        void isTokenValid_DifferentUser_ReturnsFalse() {
            String token = jwtService.generateToken(testUser);

            UserDetails otherUser = User.builder()
                    .username("other@example.com")
                    .password("password")
                    .authorities("ROLE_CLIENT")
                    .build();

            boolean isValid = jwtService.isTokenValid(token, otherUser);
            assertThat(isValid).isFalse();
        }

        @Test
        @DisplayName("should throw exception for invalid token")
        void isTokenValid_InvalidToken_ThrowsException() {
            assertThatThrownBy(() -> jwtService.extractUsername("invalid.token.string"))
                    .isInstanceOf(Exception.class);
        }
    }
}
