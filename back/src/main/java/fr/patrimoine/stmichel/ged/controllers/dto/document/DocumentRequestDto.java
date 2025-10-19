package fr.patrimoine.stmichel.ged.controllers.dto.document;

import fr.patrimoine.stmichel.ged.modeles.common.SortOrder;

public class DocumentRequestDto {

    private String query;

    private int page = 0;

    private int taillePage = 20;

    private String colonneTri = "date";

    private SortOrder ordreTri = SortOrder.DESC;

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
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
