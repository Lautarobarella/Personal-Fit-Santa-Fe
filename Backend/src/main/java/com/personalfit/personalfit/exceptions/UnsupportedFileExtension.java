package com.personalfit.personalfit.exceptions;

public class UnsupportedFileExtension extends RuntimeException{
    public UnsupportedFileExtension() {
        super("Unsupported file extension. Supported extensions are: .jpg, .jpeg, .png, .pdf");
    }
}
