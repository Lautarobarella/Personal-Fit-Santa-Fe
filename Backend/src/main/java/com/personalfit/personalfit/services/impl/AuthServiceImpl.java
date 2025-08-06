package com.personalfit.personalfit.services.impl;

import com.personalfit.personalfit.dto.AuthRequestDTO;
import com.personalfit.personalfit.dto.AuthResponseDTO;
import com.personalfit.personalfit.dto.UserTypeDTO;
import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.repository.IUserRepository;
import com.personalfit.personalfit.security.JwtService;
import com.personalfit.personalfit.services.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final IUserRepository userRepository;

    @Override
    public AuthResponseDTO authenticate(AuthRequestDTO request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );

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
            throw new RuntimeException("Invalid email or password");
        }
    }

    @Override
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
                throw new RuntimeException("Invalid refresh token");
            }
        } catch (Exception e) {
            log.error("Token refresh failed", e);
            throw new RuntimeException("Token refresh failed");
        }
    }
} 