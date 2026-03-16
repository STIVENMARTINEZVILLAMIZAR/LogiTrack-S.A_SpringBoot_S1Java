package com.logitrack.dto;

import com.logitrack.model.MovimientoTipo;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record MovimientoRequest(
        @NotNull MovimientoTipo tipo,
        Long bodegaOrigenId,
        Long bodegaDestinoId,
        String comentario,
        String referencia,
        @NotEmpty List<Item> items
) {
    public record Item(@NotNull Long productoId, @NotNull Double cantidad, Double precioUnitario) {}
}
