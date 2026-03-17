package com.logitrack.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UsuarioAdminCreateRequest(
        @NotBlank String nombre,
        @NotBlank String apellido,
        @NotBlank String username,
        @NotBlank @Email String email,
        @NotBlank String password,
        String rol,
        Boolean habilitado
) {}
