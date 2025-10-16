package fr.patrimoine.stmichel.ged.modeles.solr;

import org.apache.solr.client.solrj.beans.Field;

import java.util.Date;
import java.util.List;
import java.util.Set;

public class DocumentResultat {

    @Field
    private String id;

    @Field
    private String eid;

    @Field
    private String titre;

    @Field
    private Date date;

    @Field
    private String source;

    private List<String> extraits;

    private Set<String> termes;

    public DocumentResultat() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEid() {
        return eid;
    }

    public String getTitre() {
        return titre;
    }

    public Date getDate() {
        return date;
    }

    public String getSource() {
        return source;
    }

    public List<String> getExtraits() {
        return extraits;
    }

    public void setExtraits(List<String> extraits) {
        this.extraits = extraits;
    }

    public Set<String> getTermes() {
        return termes;
    }

    public void setTermes(Set<String> termes) {
        this.termes = termes;
    }
}
