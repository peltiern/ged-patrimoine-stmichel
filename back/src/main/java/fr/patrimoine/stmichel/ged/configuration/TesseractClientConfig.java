package fr.patrimoine.stmichel.ged.configuration;

import feign.codec.Encoder;
import feign.form.spring.SpringFormEncoder;
import org.springframework.boot.autoconfigure.http.HttpMessageConverters;
import org.springframework.cloud.openfeign.support.SpringEncoder;
import org.springframework.context.annotation.Bean;
import org.springframework.beans.factory.ObjectFactory;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TesseractClientConfig {

	@Bean
	public Encoder feignFormEncoder(ObjectFactory<HttpMessageConverters> converters) {
		return new SpringFormEncoder(new SpringEncoder(converters));
	}
}
