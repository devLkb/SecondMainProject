package com.blockchain.backend.petchainAPI.error;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

@RestControllerAdvice(basePackages = "com.blockchain.backend.petchainAPI")
public class ApiExceptionHandler {
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException exception, HttpServletRequest request) {
        ApiErrorResponse response = new ApiErrorResponse(
                exception.errorCode(),
                exception.getMessage(),
                TraceIds.from(request),
                exception.details()
        );
        return ResponseEntity.status(exception.errorCode().httpStatus()).body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidArgument(MethodArgumentNotValidException exception,
                                                                  HttpServletRequest request) {
        Map<String, Object> details = new LinkedHashMap<>();
        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            details.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        exception.getBindingResult().getGlobalErrors().forEach(error ->
                details.put(error.getObjectName(), error.getDefaultMessage())
        );
        return validationResponse("Request validation failed", details, request);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(ConstraintViolationException exception,
                                                                      HttpServletRequest request) {
        Map<String, Object> details = new LinkedHashMap<>();
        exception.getConstraintViolations().forEach(violation ->
                details.put(violation.getPropertyPath().toString(), violation.getMessage())
        );
        return validationResponse("Request validation failed", details, request);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ApiErrorResponse> handleHandlerMethodValidation(HandlerMethodValidationException exception,
                                                                          HttpServletRequest request) {
        return validationResponse("Request validation failed", Map.of("reason", exception.getMessage()), request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadableMessage(HttpMessageNotReadableException exception,
                                                                    HttpServletRequest request) {
        return validationResponse("Malformed or unsupported request body", Map.of("reason", exception.getMostSpecificCause().getMessage()), request);
    }

    private ResponseEntity<ApiErrorResponse> validationResponse(String message,
                                                               Map<String, Object> details,
                                                               HttpServletRequest request) {
        ApiErrorResponse response = new ApiErrorResponse(
                ApiErrorCode.VALIDATION_FAILED,
                message,
                TraceIds.from(request),
                details
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}
