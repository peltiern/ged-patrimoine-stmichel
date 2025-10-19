package fr.patrimoine.stmichel.ged.utils.validators;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

@Target({ElementType.PARAMETER, ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Constraint(validatedBy = ImageFileValidator.class)
public @interface ValidImageFile {
    String message() default "Le fichier doit être une image JPEG ou TIFF.";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
