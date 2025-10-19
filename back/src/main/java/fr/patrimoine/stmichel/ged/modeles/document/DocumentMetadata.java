package fr.patrimoine.stmichel.ged.modeles.document;

import org.apache.solr.client.solrj.beans.Field;

import java.util.Date;

public class DocumentMetadata {

    @Field("eid")
    private String eid;

    @Field("titre")
    private String titre;

    @Field("date")
    private Date date;

    @Field("source")
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
