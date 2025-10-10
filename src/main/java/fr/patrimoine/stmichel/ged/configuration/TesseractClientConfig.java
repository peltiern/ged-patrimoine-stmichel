package fr.patrimoine.stmichel.ged.configuration;

import feign.codec.Encoder;
import feign.gson.GsonEncoder;
import okhttp3.OkHttpClient;
import org.springframework.context.annotation.Bean;

public class TesseractClientConfig {

	@Bean
	public OkHttpClient client() {
		return new OkHttpClient();
	}

	@Bean
	public Encoder multipartFormEncoder() {
		return new GsonEncoder();
	}
}
