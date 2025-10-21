package fr.patrimoine.stmichel.ged.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import fr.patrimoine.stmichel.ged.controllers.dto.document.DocumentMetadataDto;
import fr.patrimoine.stmichel.ged.controllers.dto.document.DocumentRequestDto;
import fr.patrimoine.stmichel.ged.controllers.dto.document.DocumentResponseDto;
import fr.patrimoine.stmichel.ged.controllers.dto.pagination.PageResponseDto;
import fr.patrimoine.stmichel.ged.mappers.DocumentMetadataMapper;
import fr.patrimoine.stmichel.ged.mappers.DocumentResponseMapper;
import fr.patrimoine.stmichel.ged.mappers.PaginationMapper;
import fr.patrimoine.stmichel.ged.modeles.common.PageResponse;
import fr.patrimoine.stmichel.ged.modeles.document.DocumentMetadata;
import fr.patrimoine.stmichel.ged.modeles.document.DocumentRequest;
import fr.patrimoine.stmichel.ged.modeles.document.InfosImage;
import fr.patrimoine.stmichel.ged.modeles.solr.Document;
import fr.patrimoine.stmichel.ged.modeles.solr.DocumentResultat;
import fr.patrimoine.stmichel.ged.modeles.tesseract.TesseractOutputs;
import net.coobird.thumbnailator.Thumbnails;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

@Service
public class DocumentService {

    private static final int MAX_WIDTH = 1920;
    private static final int MAX_HEIGHT = 1920;

    private static final String DOSSIERS_DOCUMENTS = "tests/Documents/";

    private final ObjectStorageService objectStorageService;

    private final TesseractService tesseractService;

    private final MoteurRechercheService moteurRechercheService;

    private final DocumentMetadataMapper documentMetadataMapper;

    private final DocumentResponseMapper documentResponseMapper;

    private final PaginationMapper paginationMapper;

    public DocumentService(ObjectStorageService objectStorageService, TesseractService tesseractService, MoteurRechercheService moteurRechercheService, DocumentMetadataMapper documentMetadataMapper, DocumentResponseMapper documentResponseMapper, PaginationMapper paginationMapper) {
        this.objectStorageService = objectStorageService;
        this.tesseractService = tesseractService;
        this.moteurRechercheService = moteurRechercheService;
        this.documentMetadataMapper = documentMetadataMapper;
        this.documentResponseMapper = documentResponseMapper;
        this.paginationMapper = paginationMapper;
    }

    public DocumentMetadataDto creerDocument(MultipartFile fichier, DocumentMetadataDto metadataDto) {

        DocumentMetadata metadata = documentMetadataMapper.toModel(metadataDto);

        if (moteurRechercheService.existsByEid("documents", metadataDto.getEid())) {
            throw new RuntimeException("Un document avec cet EID existe déjà.");
        }

        try {
            // Vérification du type du fichier
            String contentType = fichier.getContentType();
            if (contentType == null) {
                throw new RuntimeException("Le fichier doit être une image JPEG ou TIFF.");
            }

            BufferedImage image = ImageIO.read(fichier.getInputStream());
            if (image == null) {
                throw new RuntimeException("Impossible de lire l'image envoyée.");
            }

            InfosImage infosImage = new InfosImage(image.getWidth(), image.getHeight());

            // Tesseract
            TesseractOutputs tesseractOutputs = tesseractService.recognize(fichier, infosImage);

            // Redimensionnement si nécessaire
            if (infosImage.width() > MAX_WIDTH || infosImage.height() > MAX_HEIGHT) {
                image = Thumbnails.of(image)
                        .size(MAX_WIDTH, MAX_HEIGHT)
                        .keepAspectRatio(true)
                        .asBufferedImage();
            }

            String extension = contentType.contains("tif") ? "tiff" : "jpg";
            File tempFile = File.createTempFile("upload-", "." + extension);
            ImageIO.write(image, extension, tempFile);

            // TODO Sauvegarde sur le S3 (TIFF + image redimensionnée)
            objectStorageService.upload("saint-michel-archives", DOSSIERS_DOCUMENTS + metadata.getEid() + "." + extension, tempFile);
            if (StringUtils.isNotBlank(tesseractOutputs.text())) {
                objectStorageService.upload("saint-michel-archives", DOSSIERS_DOCUMENTS + metadata.getEid() + ".txt", tesseractOutputs.text(), "text/plain");
            }
            if (!CollectionUtils.isEmpty(tesseractOutputs.words())) {
                ObjectMapper objectMapper = new ObjectMapper();
                objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
                String wordsJson = objectMapper.writeValueAsString(tesseractOutputs.words());
                objectStorageService.upload("saint-michel-archives", DOSSIERS_DOCUMENTS + metadata.getEid() + ".json", wordsJson, "application/json");
            }
            tempFile.delete();

            // Indexation
            if (StringUtils.isNotBlank(tesseractOutputs.text())) {
                Document document = new Document(metadata.getEid(), metadata.getTitre(), tesseractOutputs.text(), metadata.getDate(), metadata.getSource());
                moteurRechercheService.indexerObjet("documents", document);
            }

        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la création du document");
        }

        return metadataDto;
    }

    public PageResponseDto<DocumentResponseDto> getDocuments(DocumentRequestDto documentRequestDto) {

        DocumentRequest documentRequest = documentMetadataMapper.toModel(documentRequestDto);
        documentRequest.getPageRequest().setTaillePage(Math.min(documentRequest.getPageRequest().getTaillePage(), 20));

        PageResponse<DocumentResultat> resultats = moteurRechercheService.rechercherObjet("documents", documentRequest);

        return paginationMapper.toDto(resultats, documentResponseMapper);
    }
}
