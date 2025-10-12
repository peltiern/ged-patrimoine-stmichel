package fr.patrimoine.stmichel.ged.services;

import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrServerException;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class MoteurRechercheService {

    private final SolrClient solrClient;

    public MoteurRechercheService(SolrClient solrClient) {
        this.solrClient = solrClient;
    }

    public void indexerObjet(String collection, Object object) {
        try {
            solrClient.addBean(collection, object);
            solrClient.commit(collection);
        } catch (IOException | SolrServerException e) {
            throw new RuntimeException(e);
        }
    }
}
