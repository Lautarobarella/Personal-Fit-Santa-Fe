package com.personalfit.personalfit.exceptions;

public class NoUserWithIdException extends RuntimeException{
    public NoUserWithIdException(){
        super("No user found with that id");
    }

    public NoUserWithIdException(String string) {
        //TODO Auto-generated constructor stub
    }
}
