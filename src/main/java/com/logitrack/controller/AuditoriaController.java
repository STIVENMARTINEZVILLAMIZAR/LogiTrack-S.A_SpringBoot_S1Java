package com.logitrack.controller;

import com.logitrack.model.AccionAuditoria;
import com.logitrack.model.Auditoria;
import com.logitrack.repository.AuditoriaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/auditorias")
@RequiredArgsConstructor
public class AuditoriaController {

    private final AuditoriaRepository auditoriaRepository;

    @GetMapping
    public List<Auditoria> listar(@RequestParam(required = false) Long usuarioId,
                                  @RequestParam(required = false) AccionAuditoria accion) {
        if (usuarioId != null) {
            return auditoriaRepository.findByUsuarioId(usuarioId);
        }
        if (accion != null) {
            return auditoriaRepository.findByAccion(accion);
        }
        return auditoriaRepository.findAll();
    }
}
