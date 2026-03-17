package com.logitrack.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.logitrack.model.AccionAuditoria;
import com.logitrack.model.Auditoria;
import com.logitrack.model.Usuario;
import com.logitrack.repository.AuditoriaRepository;
import com.logitrack.repository.UsuarioRepository;
import com.logitrack.service.AuditoriaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditoriaServiceImpl implements AuditoriaService {

    private final AuditoriaRepository auditoriaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(String entidad, Long entidadId, AccionAuditoria accion, Long usuarioId, Object valoresPrevios, Object valoresNuevos, String ip, String userAgent) {
        try {
            Usuario usuario = usuarioId != null ? usuarioRepository.findById(usuarioId).orElse(null) : null;
            String prev = valoresPrevios != null ? objectMapper.writeValueAsString(valoresPrevios) : null;
            String nuevo = valoresNuevos != null ? objectMapper.writeValueAsString(valoresNuevos) : null;

            Auditoria audit = Auditoria.builder()
                    .entidad(entidad)
                    .entidadId(entidadId)
                    .accion(accion)
                    .usuario(usuario)
                    .valoresAnteriores(prev)
                    .valoresNuevos(nuevo)
                    .ip(ip)
                    .userAgent(userAgent)
                    .build();
            auditoriaRepository.save(audit);
        } catch (Exception e) {
            // Silenciar errores de auditoria para no afectar flujo principal
        }
    }
}
