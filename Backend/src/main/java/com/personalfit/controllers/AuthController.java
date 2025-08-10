package com.personalfit.controllers;

import com.personalfit.dto.Auth.AuthRequestDTO;
import com.personalfit.dto.Auth.AuthResponseDTO;
import com.personalfit.dto.User.UserTypeDTO;
import com.personalfit.models.User;
import com.personalfit.repository.UserRepository;
import com.personalfit.services.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> authenticate(@Valid @RequestBody AuthRequestDTO request) {
        AuthResponseDTO response = authService.authenticate(request);
        log.info("User authenticated successfully: {}", request.getEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponseDTO> refreshToken(@RequestParam String refreshToken) {
        AuthResponseDTO response = authService.refreshToken(refreshToken);
        log.info("Token refreshed successfully");
        return ResponseEntity.ok(response);
    }

} 