package fr.patrimoine.stmichel.ged.modeles.tesseract;

import java.util.List;

public record TesseractOutputs(
        List<TesseractWord> words,
        String text
) {

}
