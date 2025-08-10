package com.personalfit.dto.User;

import com.personalfit.dto.Payment.PaymentTypeDTO;
import com.personalfit.models.User;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class UserDetailInfoDTO extends UserTypeDTO {

    private List<UserActivityDetailsDTO> listActivity = new ArrayList<>(); // Assuming you have an Activity class
    private List<PaymentTypeDTO> listPayments = new ArrayList<>(); // Assuming you have a Payment class

    public UserDetailInfoDTO(User user) {
        super(user);
    }

    public UserDetailInfoDTO(User user, List<UserActivityDetailsDTO> listActivity, List<PaymentTypeDTO> listPayments) {
        super(user);
        this.listActivity = listActivity;
        this.listPayments = listPayments;
    }

}
