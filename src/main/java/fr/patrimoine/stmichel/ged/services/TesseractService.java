package fr.patrimoine.stmichel.ged.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import fr.patrimoine.stmichel.ged.modeles.tesseract.*;
import fr.patrimoine.stmichel.ged.providers.tesseract.TesseractProvider;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;

@Service
public class TesseractService {

    private final TesseractProvider tesseractProvider;

    public TesseractService(TesseractProvider tesseractProvider) {
        this.tesseractProvider = tesseractProvider;
    }

    public TesseractOutputs recognize(MultipartFile fichier) {
        String[] langages = {"fra"};
        TesseractConfigParams configParams = new TesseractConfigParams();
        configParams.setCreateTxt("1");
        configParams.setCreateTsv("1");
        TesseractOptions options = new TesseractOptions(langages, configParams);
        String optionsString = null;
        try {
            optionsString = new ObjectMapper().writeValueAsString(options);
        } catch (JsonProcessingException e) {
            // TODO
            throw new RuntimeException(e);
        }
        TesseractResponse reponse = tesseractProvider.recognize(fichier, optionsString);

        if (reponse == null || reponse.getData() == null || reponse.getData().getExit() == null || reponse.getData().getExit().getCode() != 0) {
            // TODO
            throw new RuntimeException("Erreur lor de la reconnaissance Tesseract");
        }
        if (StringUtils.isBlank(reponse.getData().getStdout())) {
            // TODO
            throw new RuntimeException("Pas de texte reconnu");
        }

        return parseTesseractResponse(reponse.getData().getStdout());
    }

    private TesseractOutputs parseTesseractResponse(String response) {
        String[] lines = response.split("\r?\n");
        StringBuilder tsv = new StringBuilder();
        StringBuilder text = new StringBuilder();

        boolean isTsv = true;

        for (String line : lines) {
            // Compte le nombre de colonnes TSV (il doit y en avoir 12)
            int tabCount = line.chars().map(c -> c == '\t' ? 1 : 0).sum();
            boolean looksLikeTsvLine = tabCount >= 11;

            if (isTsv && !looksLikeTsvLine) {
                // Passage à la partie texte
                isTsv = false;
            }

            if (isTsv) {
                tsv.append(line).append("\n");
            } else {
                text.append(line).append("\n");
            }
        }

        return new TesseractOutputs(parseTsvToWords(tsv.toString().trim()), text.toString().trim());
    }

    private List<TesseractWord> parseTsvToWords(String tsvContent) {
        List<TesseractWord> words = new ArrayList<>();
        String[] lines = tsvContent.split("\r?\n");

        // ignorer l'en-tête
        for (int i = 1; i < lines.length; i++) {
            String line = lines[i];
            if (line.trim().isEmpty()) continue;

            String[] cols = line.split("\t", -1); // -1 pour garder colonnes vides
            if (cols.length < 12) continue; // sécurité

            try {
                int level = Integer.parseInt(cols[0]);
                int pageNum = Integer.parseInt(cols[1]);
                int blockNum = Integer.parseInt(cols[2]);
                int parNum = Integer.parseInt(cols[3]);
                int lineNum = Integer.parseInt(cols[4]);
                int wordNum = Integer.parseInt(cols[5]);
                int left = Integer.parseInt(cols[6]);
                int top = Integer.parseInt(cols[7]);
                int width = Integer.parseInt(cols[8]);
                int height = Integer.parseInt(cols[9]);
                int conf = Integer.parseInt(cols[10]);
                String text = cols[11];

                words.add(new TesseractWord(level, pageNum, blockNum, parNum, lineNum, wordNum, left, top, width, height, conf, text));
            } catch (NumberFormatException e) {
                // ignorer les lignes malformées
            }
        }
        return words;
    }
}
