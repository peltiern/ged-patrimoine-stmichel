package fr.patrimoine.stmichel.ged.configuration;

import org.apache.solr.client.solrj.SolrClient;
import org.apache.solr.client.solrj.impl.HttpJdkSolrClient;
import org.apache.solr.client.solrj.impl.HttpSolrClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SolrClientConfig {

    @Bean
    public SolrClient solrClient() {
        return new HttpJdkSolrClient.Builder("http://localhost:8983/solr").build();
    }
}
