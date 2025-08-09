package com.personalfit.personalfit.services;

import com.personalfit.personalfit.dto.AuthRequestDTO;
import com.personalfit.personalfit.dto.AuthResponseDTO;

public interface AuthService {
    AuthResponseDTO authenticate(AuthRequestDTO request);
    AuthResponseDTO refreshToken(String refreshToken);
} 