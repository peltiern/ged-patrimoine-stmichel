package fr.patrimoine.stmichel.ged.utils.validators;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

public class ImageFileValidator implements ConstraintValidator<ValidImageFile, MultipartFile> {

    private static final Set<String> TYPES_VALIDES = Set.of(
            "image/jpeg",
            "image/tiff",
            "image/tif"
    );

    @Override
    public boolean isValid(MultipartFile fichier, ConstraintValidatorContext context) {
        if (fichier == null || fichier.isEmpty()) {
            return false;
        }

        String contentType = fichier.getContentType();
        return contentType != null && TYPES_VALIDES.contains(contentType.toLowerCase());
    }
}
