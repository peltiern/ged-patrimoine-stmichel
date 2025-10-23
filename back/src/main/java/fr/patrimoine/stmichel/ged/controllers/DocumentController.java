package fr.patrimoine.stmichel.ged.controllers;

import fr.patrimoine.stmichel.ged.configuration.security.Protected;
import fr.patrimoine.stmichel.ged.controllers.dto.document.DocumentMetadataDto;
import fr.patrimoine.stmichel.ged.controllers.dto.document.DocumentRequestDto;
import fr.patrimoine.stmichel.ged.controllers.dto.document.DocumentResponseDto;
import fr.patrimoine.stmichel.ged.controllers.dto.pagination.PageResponseDto;
import fr.patrimoine.stmichel.ged.mappers.DocumentMetadataMapper;
import fr.patrimoine.stmichel.ged.services.DocumentService;
import fr.patrimoine.stmichel.ged.utils.validators.ValidImageFile;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@CrossOrigin(origins = "http://localhost:63342")
@RestController
@RequestMapping("/v1/documents")
@Validated
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService, DocumentMetadataMapper documentMetadataMapper) {
        this.documentService = documentService;
    }

    @PostMapping
    @Protected
    public ResponseEntity<DocumentMetadataDto> creerDocument(
            @RequestPart(value = "document") @ValidImageFile MultipartFile fichier,
            @RequestPart("metadata") @Valid DocumentMetadataDto metadataDto) {

        DocumentMetadataDto documentCree = documentService.creerDocument(fichier, metadataDto);

        return ResponseEntity.ok(documentCree);
    }

    @GetMapping
    public ResponseEntity<PageResponseDto<DocumentResponseDto>> getDocuments(
            @ModelAttribute DocumentRequestDto documentRequestDto
    ) {
        return ResponseEntity.ok(documentService.getDocuments(documentRequestDto));
    }
}
