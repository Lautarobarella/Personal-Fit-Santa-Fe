package com.personalfit.personalfit.controllers;

import com.personalfit.personalfit.dto.ErrorDTO;
import com.personalfit.personalfit.exceptions.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.io.IOException;

@RestControllerAdvice
public class AdviceController {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorDTO> handleValidationException(MethodArgumentNotValidException ex) {
        ErrorDTO err = ErrorDTO.builder().code("E-0000").message(ex.getBindingResult().getFieldError().getDefaultMessage()).build();
        return new ResponseEntity<>(err, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(value = UserDniAlreadyExistsException.class)
    public ResponseEntity<ErrorDTO> userDniAlreadyExists(UserDniAlreadyExistsException e) {
        ErrorDTO err = ErrorDTO.builder().code("E-0001").message(e.getMessage()).build();
        return new ResponseEntity<>(err, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(value = NoUserWithDniException.class)
    public ResponseEntity<ErrorDTO> noUserWithDni(NoUserWithDniException e) {
        ErrorDTO err = ErrorDTO.builder().code("E-0002").message(e.getMessage()).build();
        return new ResponseEntity<>(err, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(value = NoPaymentWithIdException.class)
    public ResponseEntity<ErrorDTO> noPaymentWithId(NoPaymentWithIdException e) {
        ErrorDTO err = ErrorDTO.builder().code("E-0003").message(e.getMessage()).build();
        return new ResponseEntity<>(err, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(value = NoUserWithIdException.class)
    public ResponseEntity<ErrorDTO> noUserWithId(NoUserWithIdException e) {
        ErrorDTO err = ErrorDTO.builder().code("E-0004").message(e.getMessage()).build();
        return new ResponseEntity<>(err, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(value = NoActivityWithIdException.class)
    public ResponseEntity<ErrorDTO> noActivityWithId(NoActivityWithIdException e) {
        ErrorDTO err = ErrorDTO.builder().code("E-0005").message(e.getMessage()).build();
        return new ResponseEntity<>(err, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(value = IOException.class)
    public ResponseEntity<ErrorDTO> handleIOException(IOException e) {
        ErrorDTO err = ErrorDTO.builder().code("E-0006").message("File processing error: " + e.getMessage()).build();
        return new ResponseEntity<>(err, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(value = FileSizeException.class)
    public ResponseEntity<ErrorDTO> handleFileSizeException(FileSizeException e) {
        ErrorDTO err = ErrorDTO.builder().code("E-0007").message(e.getMessage()).build();
        return new ResponseEntity<>(err, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(value = UnsupportedFileExtension.class)
    public ResponseEntity<ErrorDTO> handleUnsupportedFileExtension(UnsupportedFileExtension e) {
        ErrorDTO err = ErrorDTO.builder().code("E-0008").message(e.getMessage()).build();
        return new ResponseEntity<>(err, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(value = PaymentAlreadyExistsException.class)
    public ResponseEntity<ErrorDTO> handlePaymentAlreadyExists(PaymentAlreadyExistsException e) {
        ErrorDTO err = ErrorDTO.builder().code("E-0009").message(e.getMessage()).build();
        return new ResponseEntity<>(err, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(value = NoPaymentFileWithIdException.class)
    public ResponseEntity<ErrorDTO> noPaymentFileWithId(NoPaymentFileWithIdException e) {
        ErrorDTO err = ErrorDTO.builder().code("E-0010").message(e.getMessage()).build();
        return new ResponseEntity<>(err, HttpStatus.NOT_FOUND);
    }

}
