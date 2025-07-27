package com.personalfit.personalfit.dto;

import com.personalfit.personalfit.models.User;
import com.personalfit.personalfit.utils.UserStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class UserDetailInfoDTO extends UserTypeDTO {

    private List<ActivityUserDetailsDTO> listActivity = new ArrayList<>(); // Assuming you have an Activity class
    private List<PaymentUserDetailsDTO> listPayments = new ArrayList<>(); // Assuming you have a Payment class

    public UserDetailInfoDTO(User user) {
        super(user);
    }


}
