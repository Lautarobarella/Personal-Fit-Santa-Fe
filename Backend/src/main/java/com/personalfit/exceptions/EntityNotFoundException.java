package com.personalfit.exceptions;

public class EntityNotFoundException extends RuntimeException {

    public String path;

    public EntityNotFoundException(String message, String path) {
        super(message);
        this.path = path;
    }

}
