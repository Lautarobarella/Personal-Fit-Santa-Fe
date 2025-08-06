package com.personalfit.personalfit.exceptions;

public class NoPaymentWithIdException extends RuntimeException{
    public NoPaymentWithIdException() {
        super("No payment found with that id");
    }
}
