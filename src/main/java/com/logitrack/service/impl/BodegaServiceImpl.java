package com.logitrack.service.impl;

import com.logitrack.model.AccionAuditoria;
import com.logitrack.model.Bodega;
import com.logitrack.model.Usuario;
import com.logitrack.repository.BodegaRepository;
import com.logitrack.repository.UsuarioRepository;
import com.logitrack.service.AuditoriaService;
import com.logitrack.service.BodegaService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BodegaServiceImpl implements BodegaService {

    private final BodegaRepository bodegaRepository;
    private final AuditoriaService auditoriaService;
    private final UsuarioRepository usuarioRepository;

    @Override
    public Bodega crear(Bodega bodega) {
        Bodega saved = bodegaRepository.save(bodega);
        auditoriaService.registrar("bodega", saved.getId(), AccionAuditoria.INSERT, currentUserId(), null, saved, null, null);
        return saved;
    }

    @Override
    public Bodega actualizar(Long id, Bodega bodega) {
        Bodega existente = obtener(id);
        Bodega anterior = copy(existente);
        existente.setNombre(bodega.getNombre());
        existente.setUbicacion(bodega.getUbicacion());
        existente.setCapacidad(bodega.getCapacidad());
        existente.setEncargado(bodega.getEncargado());
        existente.setActiva(bodega.getActiva());
        Bodega actualizado = bodegaRepository.save(existente);
        auditoriaService.registrar("bodega", id, AccionAuditoria.UPDATE, currentUserId(), anterior, actualizado, null, null);
        return actualizado;
    }

    @Override
    public void eliminar(Long id) {
        Bodega existente = obtener(id);
        bodegaRepository.delete(existente);
        auditoriaService.registrar("bodega", id, AccionAuditoria.DELETE, currentUserId(), existente, null, null, null);
    }

    @Override
    public Bodega obtener(Long id) {
        return bodegaRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Bodega no encontrada"));
    }

    @Override
    public List<Bodega> listar() {
        return bodegaRepository.findAll();
    }

    private Long currentUserId() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            return usuarioRepository.findByUsername(username).map(Usuario::getId).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private Bodega copy(Bodega bodega) {
        return Bodega.builder()
                .id(bodega.getId())
                .nombre(bodega.getNombre())
                .ubicacion(bodega.getUbicacion())
                .capacidad(bodega.getCapacidad())
                .encargado(bodega.getEncargado())
                .activa(bodega.getActiva())
                .build();
    }
}
