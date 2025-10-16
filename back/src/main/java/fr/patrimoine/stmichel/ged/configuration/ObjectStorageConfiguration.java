package fr.patrimoine.stmichel.ged.configuration;

import io.minio.MinioClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class ObjectStorageConfiguration {

    @Value(value = "${application.object-storage.endpoint}")
    private String objectStorageEndpoint;

    @Value("${application.object-storage.client-id}")
    private String objectStorageClientId;

    @Value("${application.object-storage.client-secret}")
    private String objectStorageClientSecret;

    @Bean
    public MinioClient minIoClient() throws IOException {
        return MinioClient.builder()
                .endpoint(objectStorageEndpoint)
                .credentials(objectStorageClientId, objectStorageClientSecret)
                .build();
    }
}
