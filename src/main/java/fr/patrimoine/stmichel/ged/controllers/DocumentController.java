package fr.patrimoine.stmichel.ged.controllers;

import fr.patrimoine.stmichel.ged.configuration.security.Protected;
import fr.patrimoine.stmichel.ged.dto.DocumentMetadata;
import fr.patrimoine.stmichel.ged.modeles.solr.DocumentResultat;
import fr.patrimoine.stmichel.ged.services.DocumentService;
import fr.patrimoine.stmichel.ged.utils.validators.ValidImageFile;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/v1/documents")
@Validated
public class DocumentController {

    private final DocumentService  documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping
    @Protected
    public ResponseEntity<?> creerDocument(
            @RequestPart(value = "document") @ValidImageFile MultipartFile fichier,
            @RequestPart("metadata") @Valid DocumentMetadata metadata) {

            documentService.creerDocument(fichier, metadata);

            return ResponseEntity.ok("Document ajouté : " + fichier.getOriginalFilename());

    }

    @GetMapping
    public ResponseEntity<List<DocumentResultat>> getDocuments(@RequestParam("query") String query) {
        return new ResponseEntity<>(documentService.getDocuments(query), HttpStatus.OK);
    }
}
