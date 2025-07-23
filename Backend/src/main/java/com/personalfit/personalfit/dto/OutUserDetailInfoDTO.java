package com.personalfit.personalfit.dto;

import com.personalfit.personalfit.models.User;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class OutUserDetailInfoDTO extends UserDTO {

    private String status;
    private LocalDate lastActivity;
    private Integer age;

    public OutUserDetailInfoDTO(User user) {
        super(user);
        this.status = "active";
        this.lastActivity = LocalDate.now();

    }


}
