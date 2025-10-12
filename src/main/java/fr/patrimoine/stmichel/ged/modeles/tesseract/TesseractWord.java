package fr.patrimoine.stmichel.ged.modeles.tesseract;

public class TesseractWord {

    private final int level;
    private final int pageNum;
    private final int blockNum;
    private final int parNum;
    private final int lineNum;
    private final int wordNum;
    private final int left;
    private final int top;
    private final int width;
    private final int height;
    private final int conf;
    private final String text;

    public TesseractWord(int level, int pageNum, int blockNum, int parNum, int lineNum, int wordNum, int left, int top, int width, int height, int conf, String text) {
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

    public int getLeft() {
        return left;
    }

    public int getTop() {
        return top;
    }

    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }

    public int getConf() {
        return conf;
    }

    public String getText() {
        return text;
    }
}
