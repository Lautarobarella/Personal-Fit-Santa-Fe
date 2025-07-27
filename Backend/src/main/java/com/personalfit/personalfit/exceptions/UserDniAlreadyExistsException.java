package com.personalfit.personalfit.exceptions;

public class UserDniAlreadyExistsException extends RuntimeException {

    public UserDniAlreadyExistsException() {
        super("User's DNI already exists");
    }

}
