package com.logitrack.dto;

import jakarta.validation.constraints.Email;

public record UsuarioAdminUpdateRequest(
        String nombre,
        String apellido,
        String username,
        @Email String email,
        String password,
        String rol,
        Boolean habilitado
) {}
