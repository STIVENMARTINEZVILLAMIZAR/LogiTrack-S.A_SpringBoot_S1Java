package com.logitrack.dto;

import java.time.Instant;
import java.util.List;

public record UsuarioAdminResponse(
        Long id,
        String nombre,
        String apellido,
        String username,
        String email,
        boolean habilitado,
        List<String> roles,
        Instant ultimoLogin,
        Instant createdAt,
        Instant updatedAt
) {}
