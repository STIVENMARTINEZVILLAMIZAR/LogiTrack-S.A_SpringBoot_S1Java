package com.logitrack.controller;

import com.logitrack.model.Bodega;
import com.logitrack.service.BodegaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bodegas")
@RequiredArgsConstructor
public class BodegaController {

    private final BodegaService bodegaService;

    @GetMapping
    public List<Bodega> listar() {
        return bodegaService.listar();
    }

    @GetMapping("/{id}")
    public Bodega obtener(@PathVariable Long id) {
        return bodegaService.obtener(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Bodega> crear(@Valid @RequestBody Bodega bodega) {
        return ResponseEntity.ok(bodegaService.crear(bodega));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Bodega> actualizar(@PathVariable Long id, @Valid @RequestBody Bodega bodega) {
        return ResponseEntity.ok(bodegaService.actualizar(id, bodega));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        bodegaService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
