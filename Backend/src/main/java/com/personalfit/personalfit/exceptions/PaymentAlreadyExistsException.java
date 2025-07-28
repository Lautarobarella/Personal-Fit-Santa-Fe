package com.personalfit.personalfit.exceptions;

public class PaymentAlreadyExistsException extends RuntimeException {
    public PaymentAlreadyExistsException() {
        super("Payment with this confirmation number already exists.");
    }
}
