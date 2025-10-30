package fr.patrimoine.stmichel.ged.controllers.dto.document;

import java.util.List;
import java.util.Map;

public class DocumentResponseDto {

    private DocumentMetadataDto metadata;

    private List<String> extraits;

    private Map<String, List<TermesCoordonnees>> termesCoordonnees;

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

    public Map<String, List<TermesCoordonnees>> getTermesCoordonnees() {
        return termesCoordonnees;
    }

    public void setTermesCoordonnees(Map<String, List<TermesCoordonnees>> termesCoordonnees) {
        this.termesCoordonnees = termesCoordonnees;
    }
}
