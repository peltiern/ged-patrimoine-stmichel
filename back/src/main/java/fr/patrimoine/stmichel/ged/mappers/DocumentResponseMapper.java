package fr.patrimoine.stmichel.ged.mappers;

import fr.patrimoine.stmichel.ged.controllers.dto.document.DocumentResponseDto;
import fr.patrimoine.stmichel.ged.modeles.solr.DocumentResultat;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring",
        unmappedSourcePolicy = ReportingPolicy.IGNORE)
public interface DocumentResponseMapper {

    @Mapping(target = "termes", ignore = true)
    @Mapping(target = "id", ignore = true)
    DocumentResultat toModel(DocumentResponseDto dto);

    @Mapping(target = "termesCoordonnees", ignore = true)
    @Mapping(source = "eid", target = "metadata.eid")
    @Mapping(source = "titre", target = "metadata.titre")
    @Mapping(source = "date", target = "metadata.date")
    @Mapping(source = "source", target = "metadata.source")
    DocumentResponseDto toDto(DocumentResultat documentResultat);
}
