package com.personalfit.personalfit.controllers;

import com.personalfit.personalfit.dto.ErrorDTO;
import com.personalfit.personalfit.exceptions.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorDTO> handleAuthenticationException(AuthenticationException ex) {
        log.error("Authentication error: {}", ex.getMessage());
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.UNAUTHORIZED.value())
                .error("Authentication Failed")
                .message("Credenciales incorrectas")
                .path("/api/auth/login")
                .build();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorDTO> handleBadCredentialsException(BadCredentialsException ex) {
        log.error("Bad credentials: {}", ex.getMessage());
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.UNAUTHORIZED.value())
                .error("Bad Credentials")
                .message("Email o contraseña incorrectos")
                .path("/api/auth/login")
                .build();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(NoUserWithIdException.class)
    public ResponseEntity<ErrorDTO> handleNoUserWithIdException(NoUserWithIdException ex) {
        log.error("User not found with ID: {}", ex.getMessage());
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("User Not Found")
                .message("Usuario no encontrado")
                .path("/api/users/" + ex.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(NoUserWithDniException.class)
    public ResponseEntity<ErrorDTO> handleNoUserWithDniException(NoUserWithDniException ex) {
        log.error("User not found with DNI: {}", ex.getMessage());
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("User Not Found")
                .message("Usuario no encontrado con el DNI proporcionado")
                .path("/api/users/dni/" + ex.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(UserDniAlreadyExistsException.class)
    public ResponseEntity<ErrorDTO> handleUserDniAlreadyExistsException(UserDniAlreadyExistsException ex) {
        log.error("User DNI already exists: {}", ex.getMessage());
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error("User Already Exists")
                .message("Ya existe un usuario con el DNI proporcionado")
                .path("/api/users/create")
                .build();
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(NoActivityWithIdException.class)
    public ResponseEntity<ErrorDTO> handleNoActivityWithIdException(NoActivityWithIdException ex) {
        log.error("Activity not found with ID: {}", ex.getMessage());
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("Activity Not Found")
                .message("Actividad no encontrada")
                .path("/api/activities/" + ex.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(NoPaymentWithIdException.class)
    public ResponseEntity<ErrorDTO> handleNoPaymentWithIdException(NoPaymentWithIdException ex) {
        log.error("Payment not found with ID: {}", ex.getMessage());
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("Payment Not Found")
                .message("Pago no encontrado")
                .path("/api/payments/" + ex.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(PaymentAlreadyExistsException.class)
    public ResponseEntity<ErrorDTO> handlePaymentAlreadyExistsException(PaymentAlreadyExistsException ex) {
        log.error("Payment already exists: {}", ex.getMessage());
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error("Payment Already Exists")
                .message("El pago ya existe para este usuario y actividad")
                .path("/api/payments/create")
                .build();
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(NoPaymentFileWithIdException.class)
    public ResponseEntity<ErrorDTO> handleNoPaymentFileWithIdException(NoPaymentFileWithIdException ex) {
        log.error("Payment file not found with ID: {}", ex.getMessage());
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error("Payment File Not Found")
                .message("Archivo de pago no encontrado")
                .path("/api/payments/files/" + ex.getMessage())
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(FileSizeException.class)
    public ResponseEntity<ErrorDTO> handleFileSizeException(FileSizeException ex) {
        log.error("File size error: {}", ex.getMessage());
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("File Too Large")
                .message("El archivo es demasiado grande. Tamaño máximo: 10MB")
                .path("/api/payments/upload")
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(UnsupportedFileExtension.class)
    public ResponseEntity<ErrorDTO> handleUnsupportedFileExtension(UnsupportedFileExtension ex) {
        log.error("Unsupported file extension: {}", ex.getMessage());
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Unsupported File Type")
                .message("Tipo de archivo no soportado. Solo se permiten: PDF, JPG, PNG")
                .path("/api/payments/upload")
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorDTO> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        log.error("Validation error: {}", errors);
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error("Validation Error")
                .message("Datos de entrada inválidos")
                .details(errors)
                .path("/api/validation")
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDTO> handleGenericException(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Internal Server Error")
                .message("Error interno del servidor")
                .path("/api/error")
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
} 