package fr.patrimoine.stmichel.ged.controllers;

import fr.patrimoine.stmichel.ged.controllers.dto.DocumentMetadata;
import fr.patrimoine.stmichel.ged.services.ObjectStorageService;
import io.minio.MinioClient;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

@RestController
public class DocumentController {

    private static final int MAX_WIDTH = 1920;
    private static final int MAX_HEIGHT = 1920;

    private ObjectStorageService objectStorageService;

    public DocumentController(ObjectStorageService objectStorageService) {
        this.objectStorageService = objectStorageService;
    }

    @PostMapping("/v1/documents")
    public ResponseEntity<?> creerDocument(
            @RequestPart(value = "document") MultipartFile fichier,
            @RequestPart("metadata") DocumentMetadata metadata) {

        try {
            // Vérification du type du fichier
            String contentType = fichier.getContentType();
            if (contentType == null ||
                    !(contentType.equalsIgnoreCase("image/jpeg") ||
                            contentType.equalsIgnoreCase("image/tiff") ||
                            contentType.equalsIgnoreCase("image/tif"))) {
                return ResponseEntity
                        .badRequest()
                        .body("Le fichier doit être une image JPEG ou TIFF.");
            }

            BufferedImage image = ImageIO.read(fichier.getInputStream());
            if (image == null) {
                return ResponseEntity
                        .badRequest()
                        .body("Impossible de lire l'image envoyée.");
            }

            // Redimensionnement si nécessaire
            if (image.getWidth() > MAX_WIDTH || image.getHeight() > MAX_HEIGHT) {
                image = Thumbnails.of(image)
                        .size(MAX_WIDTH, MAX_HEIGHT)
                        .keepAspectRatio(true)
                        .asBufferedImage();
            }

            String extension = contentType.contains("tiff") ? "tiff" : "jpg";
            File tempFile = File.createTempFile("upload-", "." + extension);
            ImageIO.write(image, extension, tempFile);

            // TODO Sauvegarde sur le S3 (TIFF + image redimensionnée)
            objectStorageService.upload(tempFile);
            tempFile.delete();

            // TODO Sauvegarde dans SolR

            return ResponseEntity.ok("Document ajouté : " + fichier.getOriginalFilename());

        } catch (IOException e) {
            return ResponseEntity.internalServerError()
                    .body("Erreur lors du traitement de l'image : " + e.getMessage());
        }
    }
}
