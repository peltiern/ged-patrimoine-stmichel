package fr.patrimoine.stmichel.ged.services;

import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.UploadObjectArgs;
import io.minio.errors.*;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.io.*;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

@Service
public class ObjectStorageService {

    private MinioClient minioClient;

    public ObjectStorageService(MinioClient minioClient) {
        this.minioClient = minioClient;
    }

    public void upload(File fichier) {

        try {
            minioClient.uploadObject(
                    UploadObjectArgs.builder()
                            .bucket("saint-michel-archives")
                            .object("test.jpg")
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
}
