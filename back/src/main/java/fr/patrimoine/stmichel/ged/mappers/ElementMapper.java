package fr.patrimoine.stmichel.ged.mappers;

public interface ElementMapper<M, D> {

    D toDto(M model);

    M toModel(D dto);
}
