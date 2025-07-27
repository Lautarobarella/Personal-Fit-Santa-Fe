package com.personalfit.personalfit.dto;

import com.personalfit.personalfit.utils.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityUserDetailDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private LocalDateTime createdAt;
    private UserStatus status;
}
