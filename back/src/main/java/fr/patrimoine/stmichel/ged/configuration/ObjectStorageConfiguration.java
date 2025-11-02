package fr.patrimoine.stmichel.ged.configuration;

import io.minio.MinioClient;
import okhttp3.OkHttpClient;
import okhttp3.Protocol;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.util.List;

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
                .httpClient(new OkHttpClient.Builder().protocols(List.of(Protocol.HTTP_1_1)).build())
                .build();
    }
}
