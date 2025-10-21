package fr.patrimoine.stmichel.ged.services;

import fr.patrimoine.stmichel.ged.modeles.common.PageResponse;
import fr.patrimoine.stmichel.ged.modeles.common.SortOrder;
import fr.patrimoine.stmichel.ged.modeles.document.DocumentRequest;
import fr.patrimoine.stmichel.ged.modeles.solr.DocumentResultat;
import org.apache.commons.lang3.StringUtils;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.regex.Pattern;

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

    public PageResponse<DocumentResultat> rechercherObjet(String collection, DocumentRequest documentRequest) {

        List<DocumentResultat> documents;
        long nbTotalResultats;

        int indexDebut = documentRequest.getPageRequest().getPage() * documentRequest.getPageRequest().getTaillePage();
        int taillePage = documentRequest.getPageRequest().getTaillePage();
        String colonneTri = documentRequest.getPageRequest().getColonneTri() == null ? "date" : documentRequest.getPageRequest().getColonneTri();
        SolrQuery.ORDER ordreTri = documentRequest.getPageRequest().getOrdreTri() == SortOrder.ASC ? SolrQuery.ORDER.asc : SolrQuery.ORDER.desc;

        try {

            SolrQuery solrQuery = new SolrQuery();
            solrQuery.setQuery(StringUtils.isNotBlank(documentRequest.getQuery()) ? documentRequest.getQuery() + "~1" : "*:*");

            solrQuery.set("defType", "edismax");     // Permet d’utiliser un parser plus intelligent
            solrQuery.set("qf", "eid contenu");                // Champs à interroger
            solrQuery.set("q.op", "AND");
            solrQuery.set("pf", "contenu");
            solrQuery.setStart(indexDebut);
            solrQuery.setRows(taillePage);                   // Nombre de résultats à retourner
            solrQuery.addSort(colonneTri, ordreTri);
            solrQuery.setHighlight(true);            // Active le highlighting
            solrQuery.addHighlightField("*");        // Sur tous les champs
            solrQuery.setHighlightSimplePre("<b>");
            solrQuery.setHighlightSimplePost("</b>");
            solrQuery.setHighlightFragsize(30);
            solrQuery.setHighlightSnippets(3);

            // Exécution de la requête
            QueryResponse response = solrClient.query(collection, solrQuery);

            // Résultats
            documents = response.getBeans(DocumentResultat.class);
            Map<String, Map<String, List<String>>> highlighting = response.getHighlighting();
            documents.forEach(document -> {
                document.setExtraits(new ArrayList<>());
                Map<String, List<String>> mapExtraits = highlighting.get(document.getId());
                if (mapExtraits != null) {
                    Optional.ofNullable(mapExtraits.get("contenu")).ifPresent(document::setExtraits);
                }
                // Extraction des termes matchés
                document.setTermes(new HashSet<>());
                document.getExtraits().stream()
                        .flatMap(s -> Pattern.compile("<b>(.*?)</b>").matcher(s).results())
                        .map(m -> m.group(1).toLowerCase())
                        .forEach(s -> document.getTermes().add(s.toLowerCase()));
            });
            nbTotalResultats = response.getResults().getNumFound();

        } catch (SolrServerException | IOException e) {
            // TODO
            throw new RuntimeException(e);
        }

        return new PageResponse<>(documents, nbTotalResultats, (int) Math.ceil((double) nbTotalResultats / taillePage), indexDebut / taillePage, taillePage);
    }

    public boolean existsByEid(String collection, String eid) {
        SolrQuery query = new SolrQuery("eid:\"" + eid + "\"");

	    QueryResponse response;
	    try {
		    response = solrClient.query(collection, query);
	    } catch (SolrServerException | IOException e) {
		    throw new RuntimeException(e);
	    }
	    return response.getResults().getNumFound() > 0;
    }

}
