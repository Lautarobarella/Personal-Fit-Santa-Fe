package com.personalfit.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.personalfit.repository.ActivityRepository;

@ExtendWith(MockitoExtension.class)
class ActivityServiceTest {

    @Mock
    private ActivityRepository activityRepository;

    @InjectMocks
    private ActivityService activityService;

    @Test
    void getAllActivitiesTypeDtoAtWeek_queriesSundayToSaturdayRange() {
        when(activityRepository.findByDateBetween(
                LocalDateTime.of(2026, 5, 24, 0, 0),
                LocalDateTime.of(LocalDate.of(2026, 5, 30), LocalTime.MAX)))
                .thenReturn(List.of());

        activityService.getAllActivitiesTypeDtoAtWeek(LocalDate.of(2026, 5, 24));

        ArgumentCaptor<LocalDateTime> startCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        ArgumentCaptor<LocalDateTime> endCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(activityRepository).findByDateBetween(startCaptor.capture(), endCaptor.capture());

        assertEquals(LocalDateTime.of(2026, 5, 24, 0, 0), startCaptor.getValue());
        assertEquals(LocalDateTime.of(LocalDate.of(2026, 5, 30), LocalTime.MAX), endCaptor.getValue());
    }
}
