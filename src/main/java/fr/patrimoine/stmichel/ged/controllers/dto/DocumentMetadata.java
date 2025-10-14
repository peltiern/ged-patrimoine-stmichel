package fr.patrimoine.stmichel.ged.controllers.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.apache.solr.client.solrj.beans.Field;

import java.util.Date;

public class DocumentMetadata {

    @Field("eid")
    @NotBlank(message = "L'EID est obligatoire")
    private String eid;

    @Field("titre")
    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    @Field("date")
    @NotNull(message = "La date est obligatoire")
    private Date date;

    @Field("source")
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

    public Date getDate() {
        return date;
    }

    public void setDate(Date date) {
        this.date = date;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
