package fr.patrimoine.stmichel.ged.controllers;

import fr.patrimoine.stmichel.ged.controllers.dto.DocumentCriteria;
import fr.patrimoine.stmichel.ged.controllers.dto.DocumentMetadata;
import fr.patrimoine.stmichel.ged.services.DocumentService;
import fr.patrimoine.stmichel.ged.services.MoteurRechercheService;
import fr.patrimoine.stmichel.ged.utils.validators.ValidImageFile;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/v1/documents")
@Validated
public class DocumentController {

    private final DocumentService  documentService;

    private final MoteurRechercheService moteurRechercheService;

    public DocumentController(DocumentService documentService, final MoteurRechercheService moteurRechercheService) {
        this.documentService = documentService;
        this.moteurRechercheService = moteurRechercheService;
    }

    @PostMapping
    public ResponseEntity<?> creerDocument(
            @RequestPart(value = "document") @ValidImageFile MultipartFile fichier,
            @RequestPart("metadata") @Valid DocumentMetadata metadata) {

            documentService.creerDocument(fichier, metadata);

            return ResponseEntity.ok("Document ajouté : " + fichier.getOriginalFilename());

    }

    @GetMapping
    public ResponseEntity<List<DocumentMetadata>> getDocuments(@RequestParam("query") String query) {
        return new ResponseEntity<>(documentService.getDocuments(query), HttpStatus.OK);
    }
}
