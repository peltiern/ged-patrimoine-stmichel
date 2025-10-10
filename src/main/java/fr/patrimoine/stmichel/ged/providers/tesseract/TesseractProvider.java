package fr.patrimoine.stmichel.ged.providers.tesseract;

import fr.patrimoine.stmichel.ged.configuration.TesseractClientConfig;
import fr.patrimoine.stmichel.ged.modeles.tesseract.TesseractOptions;
import fr.patrimoine.stmichel.ged.modeles.tesseract.TesseractResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

@FeignClient(
		name = "tesseractClient",
		url = "http://localhost:8884",
		configuration = TesseractClientConfig.class
)
public interface TesseractProvider {

	@PostMapping(value = "/tesseract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	TesseractResponse recognize(
			@RequestPart("file") MultipartFile file,
			@RequestPart(value = "options") TesseractOptions options
	);
}
