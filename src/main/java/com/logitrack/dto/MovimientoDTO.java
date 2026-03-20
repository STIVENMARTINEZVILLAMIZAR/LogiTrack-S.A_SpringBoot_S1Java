package com.logitrack.dto;

import java.time.Instant;
import java.util.List;

import com.logitrack.model.MovimientoTipo;

public record MovimientoDTO(
        Long id,
        Instant fecha,
        MovimientoTipo tipo,
        String bodegaOrigen,
        String  bodegaDestino,
        String usuario,
        String comentario,
        String referencia,
        List<MovimientoDetalleDTO> detalles
) {
}
