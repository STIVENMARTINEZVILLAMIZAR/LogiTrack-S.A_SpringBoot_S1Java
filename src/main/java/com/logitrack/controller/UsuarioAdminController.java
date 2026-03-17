package com.logitrack.controller;

import com.logitrack.dto.UsuarioAdminCreateRequest;
import com.logitrack.dto.UsuarioAdminResponse;
import com.logitrack.dto.UsuarioAdminUpdateRequest;
import com.logitrack.service.UsuarioAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/usuarios")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UsuarioAdminController {

    private final UsuarioAdminService usuarioAdminService;

    @GetMapping
    public List<UsuarioAdminResponse> listar() {
        return usuarioAdminService.listar();
    }

    @PostMapping
    public UsuarioAdminResponse crear(@Valid @RequestBody UsuarioAdminCreateRequest request) {
        return usuarioAdminService.crear(request);
    }

    @PutMapping("/{id}")
    public UsuarioAdminResponse actualizar(@PathVariable Long id, @Valid @RequestBody UsuarioAdminUpdateRequest request) {
        return usuarioAdminService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public void eliminar(@PathVariable Long id) {
        usuarioAdminService.eliminar(id);
    }
}
