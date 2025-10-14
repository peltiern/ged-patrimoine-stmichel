package fr.patrimoine.stmichel.ged.services;

import fr.patrimoine.stmichel.ged.controllers.dto.DocumentCriteria;
import fr.patrimoine.stmichel.ged.controllers.dto.DocumentMetadata;
import org.apache.commons.lang3.StringUtils;
import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.SolrQuery;
import org.apache.solr.client.solrj.SolrServerException;
import org.apache.solr.client.solrj.response.QueryResponse;
import org.apache.solr.common.SolrDocument;
import org.apache.solr.common.SolrDocumentList;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

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

	public List<DocumentMetadata> rechercherObjet(String collection, String query) {

        List<DocumentMetadata> documents = new ArrayList<>();

		try {
			SolrQuery solrQuery = new SolrQuery();
            solrQuery.setQuery(StringUtils.isNotBlank(query) ? query : "*:*");

            solrQuery.set("defType", "edismax");     // Permet d’utiliser un parser plus intelligent
            solrQuery.set("qf", "eid titre contenu");                // Champs à interroger (ici, tous)
            solrQuery.setStart(0);
            solrQuery.setRows(10);                   // Nombre de résultats à retourner
            solrQuery.setHighlight(true);            // Active le highlighting
            solrQuery.addHighlightField("*");        // Sur tous les champs
            solrQuery.setHighlightSimplePre("<b>");
            solrQuery.setHighlightSimplePost("</b>");

			// Exécution de la requête
			QueryResponse response = solrClient.query(collection, solrQuery);

			// Résultats
            documents = response.getBeans(DocumentMetadata.class);
//			System.out.println("Résultats trouvés : " + results.getNumFound());
//			for (SolrDocument doc : results) {
//				System.out.println(" - " + doc.getFieldValue("id") + " → " + doc);
//			}
//
//			// Exemple de récupération des highlights
//			response.getHighlighting().forEach((docId, highlights) -> {
//				System.out.println("Highlights pour " + docId + ": " + highlights);
//			});

		} catch (SolrServerException | IOException e) {
            // TODO
			throw new RuntimeException(e);
		}

		return documents;
	}
}
