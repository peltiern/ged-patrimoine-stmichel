package fr.patrimoine.stmichel.ged.services;

import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Service
public class S3Service {

    private final S3Client s3Client;

    public S3Service(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    /**
     * Upload depuis un InputStream.
     * Le flux doit être ouvert et indépendant pour cet upload.
     */
    public void upload(String bucket, String nomFichier, InputStream inputStream, long taille, String contentType) {
        System.out.println("Ecriture de " + nomFichier);

        PutObjectRequest putOb = PutObjectRequest.builder()
                .bucket(bucket)
                .key(nomFichier)
                .build();

        s3Client.putObject(putOb, RequestBody.fromInputStream(inputStream, taille));
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
}
