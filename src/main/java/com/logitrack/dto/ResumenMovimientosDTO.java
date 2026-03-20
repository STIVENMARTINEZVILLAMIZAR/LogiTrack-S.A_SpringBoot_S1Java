package com.logitrack.dto;

import java.util.Map;

public record ResumenMovimientosDTO(
        long total,
        Map<String, Long> porTipo
) {
}
