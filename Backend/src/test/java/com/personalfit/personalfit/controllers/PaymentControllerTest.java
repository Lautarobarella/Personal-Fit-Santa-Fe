package com.personalfit.personalfit.controllers;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.LocalDateTime;
import java.util.ArrayList;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.personalfit.personalfit.models.Activity;
import com.personalfit.personalfit.services.IActivityService;

@WebMvcTest(ActivityController.class)
@ActiveProfiles("test")
class ActivityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private IActivityService activityService;

    private Activity testActivity;

    @BeforeEach
    void setUp() {
        testActivity = Activity.builder()
                .id(1L)
                .name("Test Activity")
                .description("Test Description")
                .date(LocalDateTime.now())
                .duration(60)
                .slots(10)
                .build();
    }

    @Test
    void testGetAllActivities() throws Exception {
        when(activityService.getAllActivitiesTypeDto()).thenReturn(new ArrayList<>());
        
        mockMvc.perform(get("/api/activities"))
                .andExpect(status().isOk());
    }

    @Test
    void testGetActivityById() throws Exception {
        when(activityService.getActivityDetailInfo(1L)).thenReturn(null);

        mockMvc.perform(get("/api/activities/1"))
                .andExpect(status().isOk());
    }
} 