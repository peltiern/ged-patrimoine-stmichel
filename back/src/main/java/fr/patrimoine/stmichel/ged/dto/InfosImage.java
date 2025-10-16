package fr.patrimoine.stmichel.ged.dto;

public class InfosImage {

    private final int width;

    private final int height;

    public InfosImage(int width, int height) {
        this.width = width;
        this.height = height;
    }

    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }
}

