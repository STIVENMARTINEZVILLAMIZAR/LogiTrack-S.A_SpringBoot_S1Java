package com.logitrack.controller;

import com.logitrack.dto.MovimientoRequest;
import com.logitrack.model.Movimiento;
import com.logitrack.model.StockBodega;
import com.logitrack.repository.StockBodegaRepository;
import com.logitrack.service.MovimientoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/movimientos")
@RequiredArgsConstructor
public class MovimientoController {

    private final MovimientoService movimientoService;
    private final StockBodegaRepository stockBodegaRepository;

    @PostMapping
    public ResponseEntity<Movimiento> crear(@Valid @RequestBody MovimientoRequest request) {
        return ResponseEntity.ok(movimientoService.registrarMovimiento(request));
    }

    @GetMapping
    public List<Movimiento> listar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant hasta,
            @RequestParam(required = false) String tipo) {
        return movimientoService.listar(desde, hasta, tipo);
    }

    @GetMapping("/resumen")
    public Map<String, Double> resumenStockPorBodega() {
        List<StockBodega> stock = stockBodegaRepository.findAll();
        return stock.stream().collect(Collectors.groupingBy(
                sb -> sb.getBodega().getNombre(),
                Collectors.summingDouble(StockBodega::getCantidad)
        ));
    }
}
