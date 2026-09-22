package com.clinica.exception;

public class InvalidRecordDataException extends RuntimeException {
    public InvalidRecordDataException(String message) {
        super(message);
    }
}
