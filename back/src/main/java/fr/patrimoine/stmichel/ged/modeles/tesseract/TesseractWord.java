package fr.patrimoine.stmichel.ged.modeles.tesseract;

public class TesseractWord {

    private final int level;
    private final int pageNum;
    private final int blockNum;
    private final int parNum;
    private final int lineNum;
    private final int wordNum;
    private final double left;
    private final double top;
    private final double width;
    private final double height;
    private final int conf;
    private final String text;

    public TesseractWord(int level, int pageNum, int blockNum, int parNum, int lineNum, int wordNum, double left, double top, double width, double height, int conf, String text) {
        this.level = level;
        this.pageNum = pageNum;
        this.blockNum = blockNum;
        this.parNum = parNum;
        this.lineNum = lineNum;
        this.wordNum = wordNum;
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
        this.conf = conf;
        this.text = text;
    }

    public int getLevel() {
        return level;
    }

    public int getPageNum() {
        return pageNum;
    }

    public int getBlockNum() {
        return blockNum;
    }

    public int getParNum() {
        return parNum;
    }

    public int getLineNum() {
        return lineNum;
    }

    public int getWordNum() {
        return wordNum;
    }

    public double getLeft() {
        return left;
    }

    public double getTop() {
        return top;
    }

    public double getWidth() {
        return width;
    }

    public double getHeight() {
        return height;
    }

    public int getConf() {
        return conf;
    }

    public String getText() {
        return text;
    }
}
