package com.clinica.exception;

public record ApiError(int status, String message) {
}
