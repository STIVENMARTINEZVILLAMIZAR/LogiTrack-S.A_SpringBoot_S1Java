package com.logitrack.controller;

import com.logitrack.model.Producto;
import com.logitrack.service.ProductoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/productos")
@RequiredArgsConstructor
public class ProductoController {

    private final ProductoService productoService;

    @GetMapping
    public List<Producto> listar() { return productoService.listar(); }

    @GetMapping("/{id}")
    public Producto obtener(@PathVariable Long id) { return productoService.obtener(id); }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Producto> crear(@Valid @RequestBody Producto producto) {
        return ResponseEntity.ok(productoService.crear(producto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Producto> actualizar(@PathVariable Long id, @Valid @RequestBody Producto producto) {
        return ResponseEntity.ok(productoService.actualizar(id, producto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        productoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stock-bajo")
    public List<Producto> stockBajo(@RequestParam(defaultValue = "10") int umbral) {
        return productoService.stockBajo(umbral);
    }
}
