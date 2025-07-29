package com.personalfit.personalfit.exceptions;

public class NoPaymentFileWithIdException extends RuntimeException{
    public NoPaymentFileWithIdException(){
        super("No payment file found with the provided ID.");
    }
}
