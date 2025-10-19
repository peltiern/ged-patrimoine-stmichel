package fr.patrimoine.stmichel.ged.mappers;

import fr.patrimoine.stmichel.ged.controllers.dto.document.DocumentMetadataDto;
import fr.patrimoine.stmichel.ged.controllers.dto.document.DocumentRequestDto;
import fr.patrimoine.stmichel.ged.modeles.document.DocumentMetadata;
import fr.patrimoine.stmichel.ged.modeles.document.DocumentRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DocumentMetadataMapper extends ElementMapper<DocumentMetadata, DocumentMetadataDto> {

    @Mapping(target = "id", ignore = true)
    DocumentMetadataDto toDto(DocumentMetadata model);

    DocumentMetadata toModel(DocumentMetadataDto documentMetadataDto);

    @Mapping(target = "pageRequest.page", source = "page")
    @Mapping(target = "pageRequest.taillePage", source = "taillePage")
    @Mapping(target = "pageRequest.colonneTri", source = "colonneTri")
    @Mapping(target = "pageRequest.ordreTri", source = "ordreTri")
    DocumentRequest toModel(DocumentRequestDto documentRequestDto);
}
