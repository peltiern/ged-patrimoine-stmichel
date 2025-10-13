package fr.patrimoine.stmichel.ged.controllers.exceptions;

import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({ MethodArgumentNotValidException.class, ConstraintViolationException.class })
    public ResponseEntity<ValidationErrorResponse> handleValidationExceptions(Exception ex) {
        List<FieldValidationError> errors;

        if (ex instanceof MethodArgumentNotValidException manve) {
            // @Valid sur un @RequestBody
            errors = manve.getBindingResult().getFieldErrors().stream()
                    .map(err -> new FieldValidationError(err.getField(), err.getDefaultMessage()))
                    .collect(Collectors.toList());
        } else if (ex instanceof ConstraintViolationException cve) {
            // @Validated sur un paramètre direct (RequestParam, RequestPart, PathVariable…)
            errors = cve.getConstraintViolations().stream()
                    .map(v -> new FieldValidationError(extractField(v.getPropertyPath().toString()), v.getMessage()))
                    .collect(Collectors.toList());
        } else {
            errors = List.of(new FieldValidationError("unknown", ex.getMessage()));
        }

        ValidationErrorResponse response = new ValidationErrorResponse(
                LocalDateTime.now(),
                HttpStatus.BAD_REQUEST.value(),
                "Erreur de validation",
                errors
        );

        return ResponseEntity.badRequest().body(response);
    }

    private String extractField(String path) {
        int idx = path.lastIndexOf('.');
        return (idx >= 0) ? path.substring(idx + 1) : path;
    }

    public record ValidationErrorResponse(
            LocalDateTime timestamp,
            int status,
            String error,
            List<FieldValidationError> errors
    ) {}

    public record FieldValidationError(
            String field,
            String message
    ) {}
}
