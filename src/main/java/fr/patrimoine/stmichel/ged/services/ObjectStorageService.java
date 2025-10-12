package fr.patrimoine.stmichel.ged.services;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.UploadObjectArgs;
import io.minio.errors.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

@Service
public class ObjectStorageService {

    private final MinioClient minioClient;

    public ObjectStorageService(MinioClient minioClient) {
        this.minioClient = minioClient;
    }

    public void upload(String bucket, String nomFichier, File fichier) {

        try {
            minioClient.uploadObject(
                    UploadObjectArgs.builder()
                            .bucket(bucket)
                            .object(nomFichier)
                            .filename(fichier.getAbsolutePath())
                            .build()
            );
        } catch (ErrorResponseException | InsufficientDataException | InternalException | InvalidKeyException |
                 InvalidResponseException | IOException | NoSuchAlgorithmException | ServerException |
                 XmlParserException e) {
            // TODO
            throw new RuntimeException(e);
        }
    }

    public void upload(String bucket, String nomFichier, String contenu, String typeMime) {

        byte[] contenuBytes = contenu.getBytes(StandardCharsets.UTF_8);

        try {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(nomFichier)
                            .stream(new ByteArrayInputStream(contenuBytes), contenuBytes.length, -1)
                            .contentType(typeMime)
                            .build()
            );
        } catch (ErrorResponseException | InsufficientDataException | InternalException | InvalidKeyException |
                 InvalidResponseException | IOException | NoSuchAlgorithmException | ServerException |
                 XmlParserException e) {
            // TODO
            throw new RuntimeException(e);
        }
    }
}
