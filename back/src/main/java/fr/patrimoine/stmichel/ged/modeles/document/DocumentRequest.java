package fr.patrimoine.stmichel.ged.modeles.document;

import fr.patrimoine.stmichel.ged.modeles.common.PageRequest;

public class DocumentRequest {

    private String query;

    private PageRequest pageRequest;

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public PageRequest getPageRequest() {
        return pageRequest;
    }

    public void setPageRequest(PageRequest pageRequest) {
        this.pageRequest = pageRequest;
    }
}
