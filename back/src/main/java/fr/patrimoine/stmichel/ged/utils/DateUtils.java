package fr.patrimoine.stmichel.ged.utils;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;

public class DateUtils {

    public static final String FORMAT_LOCAL_DATE = "yyyy-MM-dd";
    public static final String FORMAT_SOLR_DATE = "yyyy-MM-dd'T'HH:mm:ss'Z'";

    /**
     * Parse une date au format yyyy-MM-dd au format Solr yyyy-MM-dd'T'HH:mm:ss'Z
     *
     * @param date la date à parser
     * @return la date au format SolR
     */
    public static String parseToSolrDate(String date) {
        LocalDate localDate = LocalDate.parse(date, DateTimeFormatter.ofPattern(FORMAT_LOCAL_DATE));
        ZonedDateTime zdt = localDate.atStartOfDay(ZoneOffset.UTC);
        DateTimeFormatter solrFormat = DateTimeFormatter.ofPattern(FORMAT_SOLR_DATE);
        return solrFormat.format(zdt);
    }
}
