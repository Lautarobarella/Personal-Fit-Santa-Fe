package com.personalfit.exceptions;

public class FileException extends RuntimeException {

    public String path;

    public FileException(String message, String path) {
        super(message);
        this.path = path;
    }
}