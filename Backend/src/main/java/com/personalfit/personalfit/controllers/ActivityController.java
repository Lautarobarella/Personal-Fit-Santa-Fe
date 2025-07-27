package com.personalfit.personalfit.controllers;

import com.personalfit.personalfit.dto.ActivityDetailInfoDTO;
import com.personalfit.personalfit.dto.ActivityFormTypeDTO;
import com.personalfit.personalfit.dto.ActivityTypeDTO;
import com.personalfit.personalfit.dto.LocalDateTimeDTO;
import com.personalfit.personalfit.services.IActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    @Autowired
    private IActivityService activityService;

    @PostMapping("/new")
    public ResponseEntity<Void> newActivity(@RequestBody ActivityFormTypeDTO activity) {
        activityService.createActivity(activity);
        return ResponseEntity.created(null).build();
    }

    @GetMapping("/getAll")
    public ResponseEntity<List<ActivityTypeDTO>> getAllActivities() {
        List<ActivityTypeDTO> activities = activityService.getAllActivitiesTypeDto();
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/getAllByWeek/{date}")
    public ResponseEntity<List<ActivityTypeDTO>> getAllActivitiesAtWeek(@PathVariable("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<ActivityTypeDTO> activities = activityService.getAllActivitiesTypeDtoAtWeek(date);
        return ResponseEntity.ok(activities);
    }

    @GetMapping("/info/{id}")
    public ResponseEntity<ActivityDetailInfoDTO> getActivityInfo(@PathVariable Long id) {
        ActivityDetailInfoDTO activityInfo = activityService.getActivityDetailInfo(id);
        return ResponseEntity.ok(activityInfo);
    }

}
