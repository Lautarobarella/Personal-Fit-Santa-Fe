package com.personalfit.personalfit.controllers;

import com.personalfit.personalfit.dto.ErrorDTO;
import com.personalfit.personalfit.exceptions.NoUserWithDniException;
import com.personalfit.personalfit.exceptions.UserDniAlreadyExistsException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

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

}
