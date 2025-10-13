package fr.patrimoine.stmichel.ged.controllers.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public class DocumentMetadata {

    @NotBlank(message = "L'EID est obligatoire")
    private String eid;

    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    @NotNull(message = "La date est obligatoire")
    private LocalDate date;

    @NotBlank(message = "La source est obligatoire")
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
