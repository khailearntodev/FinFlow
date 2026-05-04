package com.finflow.core.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({
            FamilyException.class,
            ExpenseException.class,
            SettlementException.class,
            AuthException.class,
            StorageException.class,
            IllegalArgumentException.class,
            IllegalStateException.class
    })
    public ResponseEntity<Map<String, String>> handleCustomExceptions(RuntimeException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("message", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGlobalException(Exception ex) {
        Map<String, String> response = new HashMap<>();
        response.put("message", "Lỗi hệ thống: " + ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
