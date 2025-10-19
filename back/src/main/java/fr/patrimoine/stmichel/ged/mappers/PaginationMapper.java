package fr.patrimoine.stmichel.ged.mappers;

import fr.patrimoine.stmichel.ged.controllers.dto.pagination.PageResponseDto;
import fr.patrimoine.stmichel.ged.modeles.common.PageResponse;
import org.mapstruct.Context;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PaginationMapper {

    default <M, D> List<D> mapList(List<M> model, @Context ElementMapper<M, D> mapper) {
        if (model == null) {
            return null;
        }
        return model.stream()
                .map(mapper::toDto)
                .toList();
    }

    default <M, D> PageResponseDto<D> toDto(PageResponse<M> modelPage, @Context ElementMapper<M, D> mapper) {
        if (modelPage == null) return null;
        PageResponseDto<D> dto = new PageResponseDto<>();
        dto.setContenu(mapList(modelPage.getContenu(), mapper));
        dto.setNbTotalElements(modelPage.getNbTotalElements());
        dto.setNbTotalPages(modelPage.getNbTotalPages());
        dto.setPage(modelPage.getPage());
        dto.setTaillePage(modelPage.getTaillePage());
        return dto;
    }
}
