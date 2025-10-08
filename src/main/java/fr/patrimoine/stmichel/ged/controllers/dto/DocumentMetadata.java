package fr.patrimoine.stmichel.ged.controllers.dto;

import java.time.LocalDate;

public class DocumentMetadata {

    private LocalDate date;

    private String source;

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
