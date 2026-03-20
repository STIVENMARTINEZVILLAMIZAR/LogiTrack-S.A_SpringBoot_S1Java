package com.logitrack.controller;

import com.logitrack.dto.ResumenMovimientosDTO;
import com.logitrack.model.MovimientoTipo;
import com.logitrack.repository.MovimientoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/reportes")
@RequiredArgsConstructor
public class ReporteController {

    private final MovimientoRepository movimientoRepository;

    @GetMapping("/movimientos")
    public ResponseEntity<ResumenMovimientosDTO> resumenMovimientos() {
        long total = movimientoRepository.count();
        Map<String, Long> porTipo = Arrays.stream(MovimientoTipo.values())
                .collect(Collectors.toMap(Enum::name, movimientoRepository::countByTipo));
        return ResponseEntity.ok(new ResumenMovimientosDTO(total, porTipo));
    }
}
