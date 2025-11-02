package fr.patrimoine.stmichel.ged.configuration;

import io.minio.MinioClient;
import okhttp3.OkHttpClient;
import okhttp3.Protocol;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.AwsCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.endpoints.S3EndpointProvider;
import software.amazon.awssdk.services.s3.model.Bucket;

import java.io.IOException;
import java.net.URI;
import java.util.List;

@Configuration
public class S3Configuration {

    @Value(value = "${application.object-storage.endpoint}")
    private String objectStorageEndpoint;

    @Value("${application.object-storage.client-id}")
    private String objectStorageClientId;

    @Value("${application.object-storage.client-secret}")
    private String objectStorageClientSecret;

    @Bean
    public S3Client s3Client() throws IOException {
        AwsCredentials credentials = AwsBasicCredentials.create(objectStorageClientId, objectStorageClientSecret);
        S3Client s3Client = S3Client
                .builder()
                .endpointOverride(URI.create(objectStorageEndpoint))
                .region(Region.of("fr-par"))
                .credentialsProvider(StaticCredentialsProvider.create(credentials))
                .build();

        // Test : lister les buckets
        for (Bucket bucket : s3Client.listBuckets().buckets()) {
            System.out.println(bucket.name());
        }
        return s3Client;
    }
}
