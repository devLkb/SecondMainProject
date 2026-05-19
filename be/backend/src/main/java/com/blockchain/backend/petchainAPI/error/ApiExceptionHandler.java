package com.blockchain.backend.petchainAPI.error;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.context.MessageSourceResolvable;
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
                details.put(detailName(violation.getPropertyPath().toString()), violation.getMessage())
        );
        return validationResponse("Request validation failed", details, request);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ApiErrorResponse> handleHandlerMethodValidation(HandlerMethodValidationException exception,
                                                                          HttpServletRequest request) {
        Map<String, Object> details = new LinkedHashMap<>();
        exception.getParameterValidationResults().forEach(result -> {
            String parameterName = result.getMethodParameter().getParameterName();
            if (parameterName == null || parameterName.isBlank()) {
                parameterName = result.getMethodParameter().getParameterType().getSimpleName();
            }
            details.put(parameterName, firstMessage(result.getResolvableErrors()));
        });
        exception.getCrossParameterValidationResults().forEach(result ->
                details.put("method", safeMessage(result.getDefaultMessage(), "must be valid"))
        );
        if (details.isEmpty()) {
            details.put("reason", safeMessage(exception.getMessage(), "Request validation failed"));
        }
        return validationResponse("Request validation failed", details, request);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadableMessage(HttpMessageNotReadableException exception,
                                                                    HttpServletRequest request) {
        String reason = exception.getMostSpecificCause() == null
                ? null
                : exception.getMostSpecificCause().getMessage();
        return validationResponse("Malformed or unsupported request body",
                Map.of("reason", safeMessage(reason, "Request body is malformed or unsupported")),
                request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(IllegalArgumentException exception,
                                                                  HttpServletRequest request) {
        ApiErrorResponse response = new ApiErrorResponse(
                ApiErrorCode.VALIDATION_FAILED,
                exception.getMessage(),
                TraceIds.from(request),
                Map.of()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    // IllegalStateException은 "서버 측 비정상 상태"를 의미하므로 500으로 처리한다.
    // (권한 거부는 ApiException + 적절한 ApiErrorCode를 사용할 것)
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalState(IllegalStateException exception,
                                                               HttpServletRequest request) {
        ApiErrorResponse response = new ApiErrorResponse(
                ApiErrorCode.INTERNAL_ERROR,
                "서버 오류가 발생했습니다.",
                TraceIds.from(request),
                Map.of()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
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

    private static String detailName(String propertyPath) {
        if (propertyPath == null || propertyPath.isBlank()) {
            return "reason";
        }
        int separatorIndex = propertyPath.lastIndexOf('.');
        if (separatorIndex < 0 || separatorIndex == propertyPath.length() - 1) {
            return propertyPath;
        }
        return propertyPath.substring(separatorIndex + 1);
    }

    private static String firstMessage(Iterable<? extends MessageSourceResolvable> errors) {
        for (MessageSourceResolvable error : errors) {
            String message = safeMessage(error.getDefaultMessage(), null);
            if (message != null) {
                return message;
            }
        }
        return "must be valid";
    }

    private static String safeMessage(String message, String fallback) {
        return message == null || message.isBlank() ? fallback : message;
    }
}
