package fr.patrimoine.stmichel.ged.controllers.dto;

import java.time.LocalDate;

public class DocumentMetadata {

    private String eid;

    private String titre;

    private LocalDate date;

    private String source;

    public String getEid() {
        return eid;
    }

    public void setEid(String eid) {
        this.eid = eid;
    }

    public String getTitre() {
        return titre;
    }

    public void setTitre(String titre) {
        this.titre = titre;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
