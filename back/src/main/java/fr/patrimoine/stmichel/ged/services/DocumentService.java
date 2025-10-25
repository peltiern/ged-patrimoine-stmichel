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
import fr.patrimoine.stmichel.ged.utils.ImageUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;

@Service
public class DocumentService {

    public static final String IMAGE_JPEG = "image/jpeg";
    public static final String IMAGE_TIFF = "image/tiff";
    public static final String EXTENSION_JPG = "jpg";
    public static final String EXTENSION_TIFF = "tiff";
    private static final int MAX_WIDTH = 1920;
    private static final int MAX_HEIGHT = 1920;
    private static final String DOSSIERS_DOCUMENTS = "tests/Documents/";

    @Value(value = "${application.object-storage.bucket.archives}")
    private String bucketArchives;

    @Value(value = "${application.object-storage.bucket.public}")
    private String bucketPublic;

    private final ObjectStorageService objectStorageService;

    private final TesseractService tesseractService;

    private final MoteurRechercheService moteurRechercheService;

    private final DocumentMetadataMapper documentMetadataMapper;

    private final DocumentResponseMapper documentResponseMapper;

    private final PaginationMapper paginationMapper;

    private final Tika tika;

    public DocumentService(ObjectStorageService objectStorageService, TesseractService tesseractService, MoteurRechercheService moteurRechercheService, DocumentMetadataMapper documentMetadataMapper, DocumentResponseMapper documentResponseMapper, PaginationMapper paginationMapper, Tika tika) {
        this.objectStorageService = objectStorageService;
        this.tesseractService = tesseractService;
        this.moteurRechercheService = moteurRechercheService;
        this.documentMetadataMapper = documentMetadataMapper;
        this.documentResponseMapper = documentResponseMapper;
        this.paginationMapper = paginationMapper;
        this.tika = tika;
    }

    public DocumentMetadataDto creerDocument(MultipartFile fichier, DocumentMetadataDto metadataDto) {

        DocumentMetadata metadata = documentMetadataMapper.toModel(metadataDto);

        if (moteurRechercheService.existsByEid("documents", metadataDto.getEid())) {
            throw new RuntimeException("Un document avec cet EID existe déjà.");
        }

        try {
            // Vérification du type du fichier
            String contentType = tika.detect(fichier.getInputStream());
            if (!(StringUtils.equals(contentType, IMAGE_JPEG) || StringUtils.equals(contentType, IMAGE_TIFF))) {
                throw new RuntimeException("Le fichier doit être une image JPEG ou TIFF.");
            }

            // Récupération des dimensions de l'image
            BufferedImage image = ImageIO.read(fichier.getInputStream());
            if (image == null) {
                throw new RuntimeException("Impossible de lire l'image envoyée.");
            }
            InfosImage infosImage = new InfosImage(image.getWidth(), image.getHeight());

            // OCR
            TesseractOutputs tesseractOutputs = tesseractService.recognize(fichier, infosImage);

            // Redimensionnement de l'image si nécessaire puis transformation en RGB
            BufferedImage imageRedimensionneeRgb = Optional.of(image)
                    .filter(img -> img.getWidth() > MAX_WIDTH || img.getHeight() > MAX_HEIGHT)
                    .map(img -> ImageUtils.redimensionnerImage(img, MAX_WIDTH, MAX_HEIGHT))
                    .map(ImageUtils::convertirEnRgb)
                    .orElseGet(() -> ImageUtils.convertirEnRgb(image));

            // Sauvegarde de l'image redimensionnée sur le bucket public
            uploadImage(imageRedimensionneeRgb, bucketPublic, DOSSIERS_DOCUMENTS + metadata.getEid(), IMAGE_JPEG);

            // Sauvegarde de l'image initiale sur le bucket archives
            uploadImage(image, bucketArchives, DOSSIERS_DOCUMENTS + metadata.getEid(), contentType);

            // Sauvegarde du contenu texte du document sur le bucket public
            if (StringUtils.isNotBlank(tesseractOutputs.text())) {
                objectStorageService.upload(bucketPublic, DOSSIERS_DOCUMENTS + metadata.getEid() + ".txt", tesseractOutputs.text(), "text/plain");
            }

            // Sauvegarde des mots trouvés dans le document sur le bucket public
            if (!CollectionUtils.isEmpty(tesseractOutputs.words())) {
                ObjectMapper objectMapper = new ObjectMapper();
                objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
                String wordsJson = objectMapper.writeValueAsString(tesseractOutputs.words());
                objectStorageService.upload(bucketPublic, DOSSIERS_DOCUMENTS + metadata.getEid() + ".json", wordsJson, "application/json");
            }

            // Indexation du document
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

    private void uploadImage(BufferedImage imageRedimensionneeRgb, String bucket, String cheminDossier, String contentType) throws IOException {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            String extensionImage = StringUtils.equals(contentType, IMAGE_TIFF) ? EXTENSION_TIFF : EXTENSION_JPG;
            ImageIO.write(imageRedimensionneeRgb, extensionImage, baos);
            baos.flush();

            byte[] data = baos.toByteArray();

            try (InputStream is = new ByteArrayInputStream(data)) {
                objectStorageService.upload(
                        bucket,
                        cheminDossier + "." + extensionImage,
                        is,
                        data.length,
                        contentType
                );
            }
        }
    }
}
