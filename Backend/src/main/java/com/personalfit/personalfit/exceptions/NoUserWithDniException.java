package com.personalfit.personalfit.exceptions;

public class NoUserWithDniException extends RuntimeException {

    public NoUserWithDniException() {
        super("No such user with that DNI");
    }
}
