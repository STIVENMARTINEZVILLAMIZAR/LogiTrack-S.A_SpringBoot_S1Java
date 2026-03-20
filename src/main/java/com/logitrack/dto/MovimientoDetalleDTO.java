package com.logitrack.dto;

public record MovimientoDetalleDTO(
        Long productoId,
        String productoNombre,
        Double cantidad,
        Double precioUnitario
) {
}
