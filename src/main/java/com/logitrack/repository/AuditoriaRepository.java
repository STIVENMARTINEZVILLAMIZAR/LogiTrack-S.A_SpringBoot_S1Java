package com.logitrack.repository;

import com.logitrack.model.Auditoria;
import com.logitrack.model.AccionAuditoria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditoriaRepository extends JpaRepository<Auditoria, Long> {
    List<Auditoria> findByUsuarioId(Long usuarioId);
    List<Auditoria> findByAccion(AccionAuditoria accion);
}
