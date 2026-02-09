package com.personalfit.controllers;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.personalfit.models.WorkShift;
import com.personalfit.services.WorkShiftService;

@RestController
@RequestMapping("/api/work-shifts")
public class WorkShiftController {

    @Autowired
    private WorkShiftService workShiftService;

    @GetMapping("/current/{trainerId}")
    @PreAuthorize("hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<WorkShift> getCurrentShift(@PathVariable Long trainerId) {
        Optional<WorkShift> shift = workShiftService.getCurrentShift(trainerId);
        return shift.map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @GetMapping("/history/{trainerId}")
    @PreAuthorize("hasRole('TRAINER') or hasRole('ADMIN')")
    public ResponseEntity<List<WorkShift>> getShiftHistory(@PathVariable Long trainerId) {
        List<WorkShift> history = workShiftService.getShiftHistory(trainerId);
        return ResponseEntity.ok(history);
    }
}
