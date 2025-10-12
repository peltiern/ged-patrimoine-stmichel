package fr.patrimoine.stmichel.ged.modeles.solr;

import org.apache.solr.client.solrj.beans.Field;

public class Document {

    @Field
    private String eid;

    @Field
    private String titre;

    @Field
    private String contenu;

    @Field
    private String date;

    public Document(String eid, String titre, String contenu, String date) {
        this.eid = eid;
        this.titre = titre;
        this.contenu = contenu;
        this.date = date;
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

    public String getDate() {
        return date;
    }
}
