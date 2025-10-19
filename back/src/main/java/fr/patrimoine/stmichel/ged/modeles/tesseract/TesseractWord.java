package fr.patrimoine.stmichel.ged.modeles.tesseract;

public record TesseractWord(
        int level,
        int pageNum,
        int blockNum,
        int parNum,
        int lineNum,
        int wordNum,
        double left,
        double top,
        double width,
        double height,
        int conf,
        String text
) {

}
