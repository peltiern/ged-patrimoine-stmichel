package fr.patrimoine.stmichel.ged.modeles.common;

public class PageRequest {

    private int page;

    private int taillePage;

    private String colonneTri;

    private SortOrder ordreTri;

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

    public String getColonneTri() {
        return colonneTri;
    }

    public void setColonneTri(String colonneTri) {
        this.colonneTri = colonneTri;
    }

    public SortOrder getOrdreTri() {
        return ordreTri;
    }

    public void setOrdreTri(SortOrder ordreTri) {
        this.ordreTri = ordreTri;
    }
}
