package com.personalfit.personalfit.dto;

import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.utils.UserRole;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class OutUserCardInfoDTO extends UserDTO{
    private String status; // Estado del usuario, active | inactive | pending
    private LocalDate lastActivity;
    private Integer activitiesCount;

    public OutUserCardInfoDTO(User user) {
        super(user);
        this.status = "active";
        this.lastActivity = LocalDate.now();
        this.activitiesCount = 2;
    }

}
