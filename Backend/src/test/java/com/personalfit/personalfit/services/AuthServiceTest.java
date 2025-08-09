package com.personalfit.personalfit.services;

import com.personalfit.personalfit.dto.AuthRequestDTO;
import com.personalfit.personalfit.dto.AuthResponseDTO;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.repository.IUserRepository;
import com.personalfit.personalfit.security.JwtService;
import com.personalfit.personalfit.services.impl.AuthServiceImpl;
import com.personalfit.personalfit.utils.UserRole;
import com.personalfit.personalfit.utils.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private IUserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthServiceImpl authService;

    private User testUser;
    private AuthRequestDTO authRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setName("Test");
        testUser.setSurname("User");
        testUser.setDni("12345678");
        testUser.setEmail("test@personalfit.com");
        testUser.setPassword("encodedPassword");
        testUser.setPhone("123456789");
        testUser.setRole(UserRole.CLIENT);
        testUser.setStatus(UserStatus.ACTIVE);
        testUser.setCreatedAt(LocalDateTime.now());

        authRequest = new AuthRequestDTO();
        authRequest.setEmail("test@personalfit.com");
        authRequest.setPassword("password123");
    }

    @Test
    void shouldAuthenticateValidUser() {
        // Arrange
        Authentication mockAuth = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(mockAuth);
        when(userRepository.findByEmail("test@personalfit.com"))
                .thenReturn(Optional.of(testUser));
        when(jwtService.generateToken("test@personalfit.com"))
                .thenReturn("access-token");
        when(jwtService.generateRefreshToken("test@personalfit.com"))
                .thenReturn("refresh-token");

        // Act
        AuthResponseDTO response = authService.authenticate(authRequest);

        // Assert
        assertNotNull(response);
        assertEquals("access-token", response.getToken());
        assertEquals("refresh-token", response.getRefreshToken());
        assertNotNull(response.getUser());
        assertEquals("test@personalfit.com", response.getUser().getEmail());
        assertEquals("Test", response.getUser().getName());
        assertEquals(UserRole.CLIENT, response.getUser().getRole());

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userRepository).findByEmail("test@personalfit.com");
        verify(jwtService).generateToken("test@personalfit.com");
        verify(jwtService).generateRefreshToken("test@personalfit.com");
    }

    @Test
    void shouldThrowExceptionForInvalidCredentials() {
        // Arrange
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Invalid credentials"));

        // Act & Assert
        assertThrows(BadCredentialsException.class, () -> {
            authService.authenticate(authRequest);
        });

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userRepository, never()).findByEmail(anyString());
        verify(jwtService, never()).generateToken(anyString());
    }

    @Test
    void shouldThrowExceptionWhenUserNotFoundAfterAuthentication() {
        // Arrange
        Authentication mockAuth = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(mockAuth);
        when(userRepository.findByEmail("test@personalfit.com"))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            authService.authenticate(authRequest);
        });

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userRepository).findByEmail("test@personalfit.com");
        verify(jwtService, never()).generateToken(anyString());
    }

    @Test
    void shouldRefreshValidToken() {
        // Arrange
        String refreshToken = "valid-refresh-token";
        String userEmail = "test@personalfit.com";
        
        when(jwtService.extractUsername(refreshToken)).thenReturn(userEmail);
        when(jwtService.isTokenValid(refreshToken, userEmail)).thenReturn(true);
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.of(testUser));
        when(jwtService.generateToken(userEmail)).thenReturn("new-access-token");
        when(jwtService.generateRefreshToken(userEmail)).thenReturn("new-refresh-token");

        // Act
        AuthResponseDTO response = authService.refreshToken(refreshToken);

        // Assert
        assertNotNull(response);
        assertEquals("new-access-token", response.getToken());
        assertEquals("new-refresh-token", response.getRefreshToken());
        assertNotNull(response.getUser());
        assertEquals(userEmail, response.getUser().getEmail());

        verify(jwtService).extractUsername(refreshToken);
        verify(jwtService).isTokenValid(refreshToken, userEmail);
        verify(userRepository).findByEmail(userEmail);
        verify(jwtService).generateToken(userEmail);
        verify(jwtService).generateRefreshToken(userEmail);
    }

    @Test
    void shouldThrowExceptionForInvalidRefreshToken() {
        // Arrange
        String invalidRefreshToken = "invalid-refresh-token";
        String userEmail = "test@personalfit.com";
        
        when(jwtService.extractUsername(invalidRefreshToken)).thenReturn(userEmail);
        when(jwtService.isTokenValid(invalidRefreshToken, userEmail)).thenReturn(false);

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            authService.refreshToken(invalidRefreshToken);
        });

        verify(jwtService).extractUsername(invalidRefreshToken);
        verify(jwtService).isTokenValid(invalidRefreshToken, userEmail);
        verify(userRepository, never()).findByEmail(anyString());
        verify(jwtService, never()).generateToken(anyString());
    }

    @Test
    void shouldThrowExceptionForRefreshTokenWithNonExistentUser() {
        // Arrange
        String refreshToken = "valid-refresh-token";
        String userEmail = "nonexistent@personalfit.com";
        
        when(jwtService.extractUsername(refreshToken)).thenReturn(userEmail);
        when(jwtService.isTokenValid(refreshToken, userEmail)).thenReturn(true);
        when(userRepository.findByEmail(userEmail)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            authService.refreshToken(refreshToken);
        });

        verify(jwtService).extractUsername(refreshToken);
        verify(jwtService).isTokenValid(refreshToken, userEmail);
        verify(userRepository).findByEmail(userEmail);
        verify(jwtService, never()).generateToken(anyString());
    }

    @Test
    void shouldHandleInactiveUserAuthentication() {
        // Arrange
        testUser.setStatus(UserStatus.INACTIVE);
        Authentication mockAuth = mock(Authentication.class);
        
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(mockAuth);
        when(userRepository.findByEmail("test@personalfit.com"))
                .thenReturn(Optional.of(testUser));

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            authService.authenticate(authRequest);
        });

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userRepository).findByEmail("test@personalfit.com");
        verify(jwtService, never()).generateToken(anyString());
    }

    @Test
    void shouldHandleNullAuthRequest() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            authService.authenticate(null);
        });

        verify(authenticationManager, never()).authenticate(any());
        verify(userRepository, never()).findByEmail(anyString());
        verify(jwtService, never()).generateToken(anyString());
    }

    @Test
    void shouldHandleEmptyEmail() {
        // Arrange
        authRequest.setEmail("");

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            authService.authenticate(authRequest);
        });

        verify(authenticationManager, never()).authenticate(any());
        verify(userRepository, never()).findByEmail(anyString());
        verify(jwtService, never()).generateToken(anyString());
    }

    @Test
    void shouldHandleEmptyPassword() {
        // Arrange
        authRequest.setPassword("");

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            authService.authenticate(authRequest);
        });

        verify(authenticationManager, never()).authenticate(any());
        verify(userRepository, never()).findByEmail(anyString());
        verify(jwtService, never()).generateToken(anyString());
    }
}
