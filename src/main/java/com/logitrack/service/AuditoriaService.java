package com.logitrack.service;

import com.logitrack.model.AccionAuditoria;

public interface AuditoriaService {
    void registrar(String entidad, Long entidadId, AccionAuditoria accion, Long usuarioId, Object valoresPrevios, Object valoresNuevos, String ip, String userAgent);
}
