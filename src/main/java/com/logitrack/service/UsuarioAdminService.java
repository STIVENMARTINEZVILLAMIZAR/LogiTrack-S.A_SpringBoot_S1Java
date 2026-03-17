package com.logitrack.service;

import com.logitrack.dto.UsuarioAdminCreateRequest;
import com.logitrack.dto.UsuarioAdminResponse;
import com.logitrack.dto.UsuarioAdminUpdateRequest;

import java.util.List;

public interface UsuarioAdminService {
    List<UsuarioAdminResponse> listar();
    UsuarioAdminResponse crear(UsuarioAdminCreateRequest request);
    UsuarioAdminResponse actualizar(Long id, UsuarioAdminUpdateRequest request);
    void eliminar(Long id);
}
