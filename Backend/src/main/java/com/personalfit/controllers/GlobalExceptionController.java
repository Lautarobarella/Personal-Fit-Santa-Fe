package com.personalfit.controllers;

import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.personalfit.dto.ErrorDTO;
import com.personalfit.exceptions.AuthException;
import com.personalfit.exceptions.BusinessRuleException;
import com.personalfit.exceptions.EntityAlreadyExistsException;
import com.personalfit.exceptions.EntityNotFoundException;
import com.personalfit.exceptions.FileException;

import lombok.extern.slf4j.Slf4j;

/**
 * Global Exception Handler.
 * Intercepts exceptions thrown by controllers and returns structured JSON
 * responses.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionController {

    /**
     * Handle Authentication Failures (401).
     */
    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ErrorDTO> handleAuthenticationException(AuthException ex) {
        log.error("Authentication error: {}", ex.getMessage());
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.UNAUTHORIZED.value())
                .error(ex.getClass().getSimpleName())
                .message(ex.getMessage())
                .path(ex.path)
                .build();
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    /**
     * Handle File Processing Errors (400).
     */
    @ExceptionHandler(FileException.class)
    public ResponseEntity<ErrorDTO> handleFileException(FileException ex) {
        log.error("File error: {}", ex.getMessage());
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(ex.getClass().getSimpleName())
                .message(ex.getMessage())
                .path(ex.path)
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Handle Not Found Errors (404).
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorDTO> handleEntityNotFoundException(EntityNotFoundException ex) {
        log.error("Entity not found: {}", ex.getMessage());
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error(ex.getClass().getSimpleName())
                .message(ex.getMessage())
                .path(ex.path)
                .build();
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /**
     * Handle Conflict Errors (409).
     * e.g., duplicate entries.
     */
    @ExceptionHandler(EntityAlreadyExistsException.class)
    public ResponseEntity<ErrorDTO> handleEntityAlreadyExistsException(EntityAlreadyExistsException ex) {
        log.error("Entity already exists: {}", ex.getMessage());
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.CONFLICT.value())
                .error(ex.getClass().getSimpleName())
                .message(ex.getMessage())
                .path(ex.path)
                .build();
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    /**
     * Handle Business Rule Violations (400).
     */
    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorDTO> handleBusinessRuleException(BusinessRuleException ex) {
        log.error("Business rule violation: {}", ex.getMessage());
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(ex.getClass().getSimpleName())
                .message(ex.getMessage())
                .path(ex.path)
                .build();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /**
     * Handle Unexpected Exceptions (500).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDTO> handleGenericException(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        ErrorDTO error = ErrorDTO.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("Internal Server Error")
                .message("Internal server error")
                .build();
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}