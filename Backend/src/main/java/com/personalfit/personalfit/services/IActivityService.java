package com.personalfit.personalfit.services;

import com.personalfit.personalfit.dto.ActivityDetailInfoDTO;
import com.personalfit.personalfit.dto.ActivityFormTypeDTO;
import com.personalfit.personalfit.dto.ActivityTypeDTO;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface IActivityService {

    public void createActivity(ActivityFormTypeDTO activity);

    List<ActivityTypeDTO> getAllActivitiesTypeDto();

    ActivityDetailInfoDTO getActivityDetailInfo(Long id);

    List<ActivityTypeDTO> getAllActivitiesTypeDtoAtWeek(LocalDate date);
}
