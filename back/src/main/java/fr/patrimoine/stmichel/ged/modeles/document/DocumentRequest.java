package fr.patrimoine.stmichel.ged.modeles.document;

import fr.patrimoine.stmichel.ged.modeles.common.PageRequest;

public class DocumentRequest {

    private String query;

    /**
     * Date de début de la recherche (format yyyy-MM-dd).
     */
    private String dateDebut;

    /**
     * Date de fin de la recherche (format yyyy-MM-dd).
     */
    private String dateFin;

    private PageRequest pageRequest;

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public String getDateDebut() {
        return dateDebut;
    }

    public void setDateDebut(String dateDebut) {
        this.dateDebut = dateDebut;
    }

    public String getDateFin() {
        return dateFin;
    }

    public void setDateFin(String dateFin) {
        this.dateFin = dateFin;
    }

    public PageRequest getPageRequest() {
        return pageRequest;
    }

    public void setPageRequest(PageRequest pageRequest) {
        this.pageRequest = pageRequest;
    }
}
