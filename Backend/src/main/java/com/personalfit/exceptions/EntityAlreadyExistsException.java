package com.personalfit.exceptions;

public class EntityAlreadyExistsException extends RuntimeException {
    
        
    public String path;

    public EntityAlreadyExistsException(String message, String path) {
        super(message);
        this.path = path;
    }

}
