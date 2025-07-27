package com.personalfit.personalfit.controllers;

import com.personalfit.personalfit.dto.ActivityFormTypeDTO;
import com.personalfit.personalfit.services.IActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/activity")
public class ActivityController {

    @Autowired
    private IActivityService activityService;

    @PostMapping("new")
    public ResponseEntity<Void> newActivity(@RequestBody ActivityFormTypeDTO activity) {
        activityService.createActivity(activity);
        return ResponseEntity.created(null).build();
    }

}
