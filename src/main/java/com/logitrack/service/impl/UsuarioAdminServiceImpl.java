package com.logitrack.service.impl;

import com.logitrack.dto.UsuarioAdminCreateRequest;
import com.logitrack.dto.UsuarioAdminResponse;
import com.logitrack.dto.UsuarioAdminUpdateRequest;
import com.logitrack.model.AccionAuditoria;
import com.logitrack.model.Rol;
import com.logitrack.model.Usuario;
import com.logitrack.repository.RolRepository;
import com.logitrack.repository.UsuarioRepository;
import com.logitrack.service.AuditoriaService;
import com.logitrack.service.UsuarioAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsuarioAdminServiceImpl implements UsuarioAdminService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoriaService;

    @Override
    public List<UsuarioAdminResponse> listar() {
        return usuarioRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public UsuarioAdminResponse crear(UsuarioAdminCreateRequest request) {
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email ya registrado");
        }
        if (usuarioRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Usuario ya registrado");
        }
        Rol rol = resolveRol(request.rol());
        Usuario usuario = Usuario.builder()
                .nombre(request.nombre())
                .apellido(request.apellido())
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .habilitado(request.habilitado() == null ? true : request.habilitado())
                .build();
        usuario.getRoles().add(rol);
        Usuario saved = usuarioRepository.save(usuario);
        registrarAuditoria(AccionAuditoria.INSERT, saved.getId(), null, saved);
        return toResponse(saved);
    }

    @Override
    public UsuarioAdminResponse actualizar(Long id, UsuarioAdminUpdateRequest request) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        Usuario anterior = snapshot(usuario);

        if (request.nombre() != null && !request.nombre().isBlank()) {
            usuario.setNombre(request.nombre());
        }
        if (request.apellido() != null && !request.apellido().isBlank()) {
            usuario.setApellido(request.apellido());
        }
        if (request.username() != null && !request.username().isBlank()) {
            if (usuarioRepository.existsByUsernameAndIdNot(request.username(), id)) {
                throw new IllegalArgumentException("Usuario ya registrado");
            }
            usuario.setUsername(request.username());
        }
        if (request.email() != null && !request.email().isBlank()) {
            if (usuarioRepository.existsByEmailAndIdNot(request.email(), id)) {
                throw new IllegalArgumentException("Email ya registrado");
            }
            usuario.setEmail(request.email());
        }
        if (request.password() != null && !request.password().isBlank()) {
            usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        if (request.habilitado() != null) {
            usuario.setHabilitado(request.habilitado());
        }
        if (request.rol() != null && !request.rol().isBlank()) {
            Rol rol = resolveRol(request.rol());
            usuario.getRoles().clear();
            usuario.getRoles().add(rol);
        }
        Usuario actualizado = usuarioRepository.save(usuario);
        registrarAuditoria(AccionAuditoria.UPDATE, id, anterior, actualizado);
        return toResponse(actualizado);
    }

    @Override
    public void eliminar(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        usuarioRepository.delete(usuario);
        registrarAuditoria(AccionAuditoria.DELETE, id, usuario, null);
    }

    private Rol resolveRol(String rolNombre) {
        String normalized = normalizarRol(rolNombre);
        return rolRepository.findByNombre(normalized)
                .orElseGet(() -> rolRepository.save(Rol.builder()
                        .nombre(normalized)
                        .descripcion("Rol " + normalized.toLowerCase(Locale.ROOT))
                        .build()));
    }

    private String normalizarRol(String rol) {
        if (rol == null || rol.isBlank()) {
            return "EMPLEADO";
        }
        String value = rol.trim().toUpperCase(Locale.ROOT);
        if (!value.equals("ADMIN") && !value.equals("EMPLEADO")) {
            throw new IllegalArgumentException("Rol invalido");
        }
        return value;
    }

    private UsuarioAdminResponse toResponse(Usuario usuario) {
        return new UsuarioAdminResponse(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getUsername(),
                usuario.getEmail(),
                Boolean.TRUE.equals(usuario.getHabilitado()),
                usuario.getRoles().stream().map(Rol::getNombre).sorted().collect(Collectors.toList()),
                usuario.getUltimoLogin(),
                usuario.getCreatedAt(),
                usuario.getUpdatedAt()
        );
    }

    private void registrarAuditoria(AccionAuditoria accion, Long entidadId, Object anterior, Object nuevo) {
        try {
            auditoriaService.registrar("usuario", entidadId, accion, currentUserId(), anterior, nuevo, null, null);
        } catch (Exception ignored) {
        }
    }

    private Long currentUserId() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            return usuarioRepository.findByUsername(username).map(Usuario::getId).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private Usuario snapshot(Usuario usuario) {
        return Usuario.builder()
                .id(usuario.getId())
                .nombre(usuario.getNombre())
                .apellido(usuario.getApellido())
                .username(usuario.getUsername())
                .email(usuario.getEmail())
                .habilitado(usuario.getHabilitado())
                .build();
    }
}
