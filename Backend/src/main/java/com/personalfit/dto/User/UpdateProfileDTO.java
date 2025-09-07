package com.personalfit.dto.User;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class UpdateProfileDTO {
    
    @NotNull(message = "User ID is required")
    private Long userId;
    
    private String address;
    
    @Pattern(regexp = "^[0-9\\s\\-\\+\\(\\)]+$", message = "Invalid phone format")
    private String phone;
    
    @Pattern(regexp = "^[0-9\\s\\-\\+\\(\\)]*$", message = "Invalid emergency phone format")
    private String emergencyPhone;
}
