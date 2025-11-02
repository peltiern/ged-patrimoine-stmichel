package fr.patrimoine.stmichel.ged.services;

import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.UploadObjectArgs;
import io.minio.errors.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

@Service
public class ObjectStorageService {

    private final MinioClient minioClient;

    public ObjectStorageService(MinioClient minioClient) {
        this.minioClient = minioClient;
    }

    /**
     * Upload depuis un InputStream.
     * Le flux doit être ouvert et indépendant pour cet upload.
     */
    public void upload(String bucket, String nomFichier, InputStream inputStream, long taille, String contentType) {
        System.out.println("Ecriture de " + nomFichier);
        try {
            PutObjectArgs.Builder builder = PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(nomFichier)
                    .contentType(contentType);

            if (taille >= 0) {
                builder.stream(inputStream, taille, -1); // taille connue → multipart possible
            } else {
                builder.stream(inputStream, -1, 5 * 1024 * 1024L); // taille inconnue → part size 5Mo
            }

            minioClient.putObject(builder.build());
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'upload du fichier : " + nomFichier, e);
        }
        // Ne pas fermer inputStream ici → le flux doit être géré en amont
    }

    /**
     * Upload de contenu texte ou JSON.
     */
    public void upload(String bucket, String nomFichier, String contenu, String typeMime) {
        byte[] contenuBytes = contenu.getBytes(StandardCharsets.UTF_8);
        try (InputStream is = new ByteArrayInputStream(contenuBytes)) {
            upload(bucket, nomFichier, is, contenuBytes.length, typeMime);
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la conversion en flux du fichier : " + nomFichier, e);
        }
    }

    public byte[] download(String bucket, String nomFichier) {
        try (InputStream stream = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(bucket)
                        .object(nomFichier)
                        .build())) {

            return stream.readAllBytes();

        } catch (Exception e) {
            // TODO
            throw new RuntimeException(e);
        }
    }
}
