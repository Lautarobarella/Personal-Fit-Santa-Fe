package com.personalfit.personalfit.exceptions;

public class FileSizeException extends RuntimeException {
    public FileSizeException() {
        super("File size exceeds the maximum limit.");
    }
}
