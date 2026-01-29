package com.personalfit.services;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.personalfit.dto.Auth.AuthRequestDTO;
import com.personalfit.dto.Auth.AuthResponseDTO;
import com.personalfit.dto.User.UserTypeDTO;
import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.models.User;
import com.personalfit.repository.UserRepository;
import com.personalfit.security.JwtService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service generic for Authentication.
 * Handles the core business logic for user login and token management.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    /**
     * Authenticates a user with email and password.
     * Generates Access and Refresh tokens upon success.
     * 
     * @param request Login credentials.
     * @return AuthResponseDTO containing tokens and user info.
     */
    public AuthResponseDTO authenticate(AuthRequestDTO request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()));

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            User user = userRepository.findByEmail(userDetails.getUsername())
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String accessToken = jwtService.generateToken(userDetails);
            String refreshToken = jwtService.generateRefreshToken(userDetails);

            UserTypeDTO userInfo = new UserTypeDTO(user);

            return AuthResponseDTO.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .user(userInfo)
                    .build();

        } catch (Exception e) {
            log.error("Authentication failed for user: {}", request.getEmail(), e);
            throw new BusinessRuleException("Incorrect email or password", "Api/Auth/authenticate");
        }
    }

    /**
     * Refreshes the Access Token using a valid Refresh Token.
     * 
     * @param refreshToken The refresh token string.
     * @return New set of tokens.
     */
    public AuthResponseDTO refreshToken(String refreshToken) {
        try {
            String userEmail = jwtService.extractUsername(refreshToken);
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                    .username(user.getEmail())
                    .password(user.getPassword())
                    .authorities("ROLE_" + user.getRole().name())
                    .build();

            if (jwtService.isTokenValid(refreshToken, userDetails)) {
                String newAccessToken = jwtService.generateToken(userDetails);
                String newRefreshToken = jwtService.generateRefreshToken(userDetails);

                UserTypeDTO userInfo = new UserTypeDTO(user);

                return AuthResponseDTO.builder()
                        .accessToken(newAccessToken)
                        .refreshToken(newRefreshToken)
                        .user(userInfo)
                        .build();
            } else {
                throw new BusinessRuleException("Invalid refresh token", "Api/Auth/refreshToken");
            }
        } catch (Exception e) {
            log.error("Token refresh failed", e);
            throw new BusinessRuleException("Error refreshing token", "Api/Auth/refreshToken");
        }
    }
}