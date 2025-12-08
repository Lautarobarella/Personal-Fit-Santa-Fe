package com.personalfit.controllers;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.personalfit.config.CookieProperties;
import com.personalfit.dto.Auth.AuthRequestDTO;
import com.personalfit.dto.Auth.AuthResponseDTO;
import com.personalfit.services.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final CookieProperties cookieProperties;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> authenticate(@Valid @RequestBody AuthRequestDTO request) {
        // Normalizar email a lowercase para hacer case insensitive
        AuthRequestDTO normalizedRequest = AuthRequestDTO.builder()
                .email(request.getEmail().toLowerCase().trim())
                .password(request.getPassword())
                .build();
                
        AuthResponseDTO response = authService.authenticate(normalizedRequest);
        log.info("User authenticated successfully: {}", normalizedRequest.getEmail());
        
        // Crear cookies httpOnly y secure para los tokens
        ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", response.getAccessToken())
                .httpOnly(true)
                .secure(cookieProperties.isSecure())
                .sameSite(cookieProperties.getSameSite())
                .maxAge(cookieProperties.getAccessTokenMaxAge())
                .path("/")
                .domain(cookieProperties.getDomain())
                .build();
                
        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", response.getRefreshToken())
                .httpOnly(true)
                .secure(cookieProperties.isSecure())
                .sameSite(cookieProperties.getSameSite())
                .maxAge(cookieProperties.getRefreshTokenMaxAge())
                .path("/")
                .domain(cookieProperties.getDomain())
                .build();
        
        // Crear una respuesta sin los tokens (solo datos del usuario)
        AuthResponseDTO responseWithoutTokens = AuthResponseDTO.builder()
                .tokenType(response.getTokenType())
                .user(response.getUser())
                .build();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .body(responseWithoutTokens);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDTO> refreshToken(@CookieValue(name = "refreshToken", required = false) String refreshTokenCookie,
                                                       @RequestParam(required = false) String refreshToken) {
        // Priorizar cookie sobre parámetro para compatibilidad hacia atrás
        String tokenToUse = refreshTokenCookie != null ? refreshTokenCookie : refreshToken;
        
        if (tokenToUse == null) {
            return ResponseEntity.badRequest().build();
        }
        
        AuthResponseDTO response = authService.refreshToken(tokenToUse);
        log.info("Token refreshed successfully");
        
        // Crear cookies httpOnly y secure para los nuevos tokens
        ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", response.getAccessToken())
                .httpOnly(true)
                .secure(cookieProperties.isSecure())
                .sameSite(cookieProperties.getSameSite())
                .maxAge(cookieProperties.getAccessTokenMaxAge())
                .path("/")
                .domain(cookieProperties.getDomain())
                .build();
                
        ResponseCookie newRefreshTokenCookie = ResponseCookie.from("refreshToken", response.getRefreshToken())
                .httpOnly(true)
                .secure(cookieProperties.isSecure())
                .sameSite(cookieProperties.getSameSite())
                .maxAge(cookieProperties.getRefreshTokenMaxAge())
                .path("/")
                .domain(cookieProperties.getDomain())
                .build();
        
        // Crear respuesta sin tokens
        AuthResponseDTO responseWithoutTokens = AuthResponseDTO.builder()
                .tokenType(response.getTokenType())
                .user(response.getUser())
                .build();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, newRefreshTokenCookie.toString())
                .body(responseWithoutTokens);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(Authentication authentication, 
                                     @RequestHeader(value = "Device-Token", required = false) String deviceToken) {

        // Eliminar las cookies estableciendo su valor vacío y maxAge 0
        ResponseCookie accessTokenCookie = ResponseCookie.from("accessToken", "")
                .httpOnly(true)
                .secure(cookieProperties.isSecure())
                .sameSite(cookieProperties.getSameSite())
                .maxAge(0)
                .path("/")
                .domain(cookieProperties.getDomain())
                .build();
                
        ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(cookieProperties.isSecure())
                .sameSite(cookieProperties.getSameSite())
                .maxAge(0)
                .path("/")
                .domain(cookieProperties.getDomain())
                .build();
        
        log.info("User logged out successfully");
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessTokenCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                .build();
    }

} 