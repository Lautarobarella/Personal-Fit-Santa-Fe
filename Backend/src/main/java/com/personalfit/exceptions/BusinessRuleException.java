package com.personalfit.exceptions;

public class BusinessRuleException extends RuntimeException {
    
    public String path;

    public BusinessRuleException(String message, String path) {
        super(message);
        this.path = path;
    }
    
}
