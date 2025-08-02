package com.personalfit.personalfit.services;

import com.personalfit.personalfit.dto.ActivityDetailInfoDTO;
import com.personalfit.personalfit.dto.ActivityFormTypeDTO;
import com.personalfit.personalfit.dto.ActivityTypeDTO;
import com.personalfit.personalfit.dto.EnrollmentRequestDTO;
import com.personalfit.personalfit.dto.EnrollmentResponseDTO;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface IActivityService {

    public void createActivity(ActivityFormTypeDTO activity);
    
    public void updateActivity(Long id, ActivityFormTypeDTO activity);
    
    public void deleteActivity(Long id);

    List<ActivityTypeDTO> getAllActivitiesTypeDto();

    ActivityDetailInfoDTO getActivityDetailInfo(Long id);

    List<ActivityTypeDTO> getAllActivitiesTypeDtoAtWeek(LocalDate date);
    
    // Enrollment methods
    EnrollmentResponseDTO enrollUser(EnrollmentRequestDTO enrollmentRequest);
    
    EnrollmentResponseDTO unenrollUser(EnrollmentRequestDTO enrollmentRequest);
    
    boolean isUserEnrolled(Long userId, Long activityId);
}
