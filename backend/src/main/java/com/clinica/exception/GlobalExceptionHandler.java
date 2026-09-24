package com.clinica.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InvalidRecordDataException.class)
    public ResponseEntity<ApiError> handleInvalidData(InvalidRecordDataException ex) {
        return ResponseEntity.badRequest().body(new ApiError(400, ex.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(new ApiError(400, ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + " " + err.getDefaultMessage())
                .findFirst()
                .orElse("Validation failed");
        return ResponseEntity.badRequest().body(new ApiError(400, message));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ApiError(404, ex.getMessage()));
    }

    @ExceptionHandler(SlotUnavailableException.class)
    public ResponseEntity<ApiError> handleSlotUnavailable(SlotUnavailableException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(409, ex.getMessage()));
    }

    @ExceptionHandler(ResourceInUseException.class)
    public ResponseEntity<ApiError> handleResourceInUse(ResourceInUseException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(409, ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleGeneralException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError(500, ex.getMessage() != null ? ex.getMessage() : "An unexpected error occurred"));
    }
}
