package com.logitrack.dto;

import com.logitrack.model.MovimientoTipo;

import java.time.Instant;
import java.util.List;

public record MovimientoDTO(
        Long id,
        Instant fecha,
        MovimientoTipo tipo,
        String bodegaOrigen,
        String bodegaDestino,
        String usuario,
        String comentario,
        String referencia,
        List<MovimientoDetalleDTO> detalles
) {
}
