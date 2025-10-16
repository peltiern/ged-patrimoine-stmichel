package fr.patrimoine.stmichel.ged.modeles.solr;

import org.apache.solr.client.solrj.beans.Field;

import java.util.Date;
import java.util.List;

public class Document {

    @Field
    private String eid;

    @Field
    private String titre;

    @Field
    private String contenu;

    @Field
    private Date date;

    @Field
    private String source;

    public Document(String eid, String titre, String contenu, Date date, String source) {
        this.eid = eid;
        this.titre = titre;
        this.contenu = contenu;
        this.date = date;
        this.source = source;
    }

    public String getEid() {
        return eid;
    }

    public String getTitre() {
        return titre;
    }

    public String getContenu() {
        return contenu;
    }

    public Date getDate() {
        return date;
    }

    public String getSource() {
        return source;
    }
}
