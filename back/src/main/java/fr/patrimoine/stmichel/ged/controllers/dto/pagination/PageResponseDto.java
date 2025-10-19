package fr.patrimoine.stmichel.ged.controllers.dto.pagination;

import java.util.List;

public final class PageResponseDto<T> {
    private List<T> contenu;
    private long nbTotalElements;
    private int nbTotalPages;
    private int page;
    private int taillePage;

    public List<T> getContenu() {
        return contenu;
    }

    public void setContenu(List<T> contenu) {
        this.contenu = contenu;
    }

    public long getNbTotalElements() {
        return nbTotalElements;
    }

    public void setNbTotalElements(long nbTotalElements) {
        this.nbTotalElements = nbTotalElements;
    }

    public int getNbTotalPages() {
        return nbTotalPages;
    }

    public void setNbTotalPages(int nbTotalPages) {
        this.nbTotalPages = nbTotalPages;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getTaillePage() {
        return taillePage;
    }

    public void setTaillePage(int taillePage) {
        this.taillePage = taillePage;
    }
}
