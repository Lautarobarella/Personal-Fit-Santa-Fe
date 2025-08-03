package com.personalfit.personalfit.services.impl;

import com.personalfit.personalfit.dto.NotificationDTO;
import com.personalfit.personalfit.models.Notification;
import com.personalfit.personalfit.repository.INotificationRepository;
import com.personalfit.personalfit.services.INotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements INotificationService {

    @Autowired
    private INotificationRepository notificationRepository;

    @Override
    public List<NotificationDTO> getAllByUserId(Long id) {
        List<Notification> notifications = notificationRepository.findByUserId(id);

        return notifications.stream().map(n -> {
            return NotificationDTO.builder()
                    .id(n.getId())
                    .title(n.getTitle())
                    .message(n.getMessage())
                    .build();
        }).collect(Collectors.toList());
    }

}
