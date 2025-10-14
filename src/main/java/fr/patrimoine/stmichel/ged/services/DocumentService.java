package fr.patrimoine.stmichel.ged.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import fr.patrimoine.stmichel.ged.controllers.dto.DocumentMetadata;
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
import java.util.List;

@Service
public class DocumentService {

    private static final int MAX_WIDTH = 1920;
    private static final int MAX_HEIGHT = 1920;

    private static final String DOSSIERS_DOCUMENTS = "tests/Documents/";

    private final ObjectStorageService objectStorageService;

    private final TesseractService  tesseractService;

    private final MoteurRechercheService moteurRechercheService;

    public DocumentService(ObjectStorageService objectStorageService, TesseractService tesseractService, MoteurRechercheService moteurRechercheService) {
        this.objectStorageService = objectStorageService;
        this.tesseractService = tesseractService;
        this.moteurRechercheService = moteurRechercheService;
    }

    public void creerDocument(MultipartFile fichier, DocumentMetadata metadata) {

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

            // Tesseract
            TesseractOutputs tesseractOutputs = tesseractService.recognize(fichier);

            // Redimensionnement si nécessaire
            if (image.getWidth() > MAX_WIDTH || image.getHeight() > MAX_HEIGHT) {
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
            if (StringUtils.isNotBlank(tesseractOutputs.getText())) {
                objectStorageService.upload("saint-michel-archives", DOSSIERS_DOCUMENTS + metadata.getEid() + ".txt", tesseractOutputs.getText(), "text/plain");
            }
            if (!CollectionUtils.isEmpty(tesseractOutputs.getWords())) {
                ObjectMapper objectMapper = new ObjectMapper();
                objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
                String wordsJson = objectMapper.writeValueAsString(tesseractOutputs.getWords());
                objectStorageService.upload("saint-michel-archives", DOSSIERS_DOCUMENTS + metadata.getEid() + ".json", wordsJson, "application/json");
            }
            tempFile.delete();

            // Indexation
            if (StringUtils.isNotBlank(tesseractOutputs.getText())) {
                Document document = new Document(metadata.getEid(), metadata.getTitre(), tesseractOutputs.getText(), metadata.getDate(), metadata.getSource());
                moteurRechercheService.indexerObjet("documents", document);
            }

        } catch (IOException e) {
           throw new RuntimeException("Erreur lors de la création du document");
        }
    }

    public List<DocumentResultat> getDocuments(String query) {
        return moteurRechercheService.rechercherObjet("documents", query);
    }
}
