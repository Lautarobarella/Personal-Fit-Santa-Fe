package com.personalfit.dto.User;

import java.time.LocalDateTime;

import com.personalfit.enums.UserStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientStatsDTO {
    private Integer weeklyActivityCount;
    private NextClassDTO nextClass;
    private Integer completedClassesCount;
    private UserStatus membershipStatus;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NextClassDTO {
        private Long id;
        private String name;
        private LocalDateTime date;
        private String time;
    }
}
