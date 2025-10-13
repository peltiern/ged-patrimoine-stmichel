package fr.patrimoine.stmichel.ged.controllers;

import fr.patrimoine.stmichel.ged.controllers.dto.DocumentMetadata;
import fr.patrimoine.stmichel.ged.services.DocumentService;
import fr.patrimoine.stmichel.ged.utils.validators.ValidImageFile;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@Validated
public class DocumentController {

    private final DocumentService  documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping("/v1/documents")
    public ResponseEntity<?> creerDocument(
            @RequestPart(value = "document") @ValidImageFile MultipartFile fichier,
            @RequestPart("metadata") @Valid DocumentMetadata metadata) {

            documentService.creerDocument(fichier, metadata);

            return ResponseEntity.ok("Document ajouté : " + fichier.getOriginalFilename());

    }
}
