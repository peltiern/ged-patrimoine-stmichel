package fr.patrimoine.stmichel.ged.modeles.tesseract;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class TesseractConfigParams {

    @JsonProperty("tessedit_create_txt")
    private String createTxt;

    @JsonProperty("tessedit_create_hocr")
    private String createHocr;

    @JsonProperty("tessedit_create_tsv")
    private String createTsv;

    public TesseractConfigParams() {
    }

    public String getCreateTxt() {
        return createTxt;
    }

    public void setCreateTxt(String createTxt) {
        this.createTxt = createTxt;
    }

    /**
     * Getter de la propriété createHocr.
     *
     * @return createHocr
     */
    public String getCreateHocr() {
        return createHocr;
    }

    /**
     * Setter de la propriété createHocr.
     *
     * @param newCreateHocr the createHocr to set
     */
    public void setCreateHocr(final String newCreateHocr) {
        createHocr = newCreateHocr;
    }

    public String getCreateTsv() {
        return createTsv;
    }

    public void setCreateTsv(String createTsv) {
        this.createTsv = createTsv;
    }
}
