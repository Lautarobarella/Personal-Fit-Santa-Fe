package com.personalfit.personalfit.exceptions;

public class NoUserWithIdException extends RuntimeException{
    public NoUserWithIdException(){
        super("No user found with that id");
    }
}
