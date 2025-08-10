package com.personalfit.exceptions;

import org.springframework.security.core.AuthenticationException;

public class AuthException extends AuthenticationException {

    public String path;

    public AuthException(String message, String path) {
        super(message);
        this.path = path;
    }

}
