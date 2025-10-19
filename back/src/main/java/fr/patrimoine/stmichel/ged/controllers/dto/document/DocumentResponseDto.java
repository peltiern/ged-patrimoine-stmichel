package fr.patrimoine.stmichel.ged.controllers.dto.document;

import java.util.List;
import java.util.Set;

public class DocumentResponseDto {

    private DocumentMetadataDto metadata;

    private List<String> extraits;

    private Set<String> termes;

    public DocumentMetadataDto getMetadata() {
        return metadata;
    }

    public void setMetadata(DocumentMetadataDto metadata) {
        this.metadata = metadata;
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
