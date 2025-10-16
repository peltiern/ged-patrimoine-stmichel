package fr.patrimoine.stmichel.ged.modeles.tesseract;

import java.util.List;

public class TesseractOutputs {

    private final List<TesseractWord> words;

    private final String text;

    public TesseractOutputs(List<TesseractWord> words, String text) {
        this.words = words;
        this.text = text;
    }

    public List<TesseractWord> getWords() {
        return words;
    }

    public String getText() {
        return text;
    }
}
