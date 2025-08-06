package com.personalfit.personalfit.exceptions;

public class PaymentAlreadyExistsException extends RuntimeException {
    public PaymentAlreadyExistsException() {
        super("El usuario ya tiene un pago activo o pendiente. No puede crear un nuevo pago hasta que el actual sea rechazado o procesado.");
    }
    
    public PaymentAlreadyExistsException(String message) {
        super(message);
    }
}
