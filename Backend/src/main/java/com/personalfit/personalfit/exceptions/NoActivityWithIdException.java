package com.personalfit.personalfit.exceptions;

public class NoActivityWithIdException extends RuntimeException{
    public NoActivityWithIdException(){
        super("No activity found with the provided ID.");
    }
}
