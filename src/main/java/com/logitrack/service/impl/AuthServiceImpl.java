package com.logitrack.service.impl;

import com.logitrack.dto.AuthRequest;
import com.logitrack.dto.AuthResponse;
import com.logitrack.dto.RegisterRequest;
import com.logitrack.model.AccionAuditoria;
import com.logitrack.model.Rol;
import com.logitrack.model.Usuario;
import com.logitrack.repository.RolRepository;
import com.logitrack.repository.UsuarioRepository;
import com.logitrack.security.jwt.JwtService;
import com.logitrack.service.AuditoriaService;
import com.logitrack.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.time.Instant;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuditoriaService auditoriaService;

    @Override
    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        Usuario usuario = usuarioRepository.findByUsername(request.username())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));
        usuario.setUltimoLogin(Instant.now());
        usuarioRepository.save(usuario);
        String token = generarToken(usuario);
        auditoriaService.registrar("usuario", usuario.getId(), AccionAuditoria.LOGIN, usuario.getId(), null, Map.of("username", usuario.getUsername()), null, null);
        return new AuthResponse(token, jwtService.extractClaim(token, claims -> claims.getExpiration().getTime() - claims.getIssuedAt().getTime()));
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email ya registrado");
        }
        if (usuarioRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Usuario ya registrado");
        }
        boolean adminActual = currentUserIsAdmin();
        String rolSolicitado = normalizarRol(request.rol());
        if ("ADMIN".equals(rolSolicitado) && !adminActual) {
            throw new AccessDeniedException("Solo un administrador puede asignar rol ADMIN");
        }
        String rolNombre = adminActual ? rolSolicitado : "EMPLEADO";
        Rol rolAsignado = rolRepository.findByNombre(rolNombre)
                .orElseGet(() -> rolRepository.save(Rol.builder().nombre(rolNombre).descripcion("Rol " + rolNombre.toLowerCase(Locale.ROOT)).build()));

        Usuario usuario = Usuario.builder()
                .nombre(request.nombre())
                .apellido(request.apellido())
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();
        usuario.getRoles().add(rolAsignado);
        usuarioRepository.saveAndFlush(usuario);
        String token = generarToken(usuario);
        try {
            auditoriaService.registrar("usuario", usuario.getId(), AccionAuditoria.INSERT, usuario.getId(), null, Map.of("username", usuario.getUsername()), null, null);
        } catch (Exception ignored) {
        }
        return new AuthResponse(token, jwtService.extractClaim(token, claims -> claims.getExpiration().getTime() - claims.getIssuedAt().getTime()));
    }

    private String generarToken(Usuario usuario) {
        List<String> roles = usuario.getRoles().stream().map(Rol::getNombre).toList();
        User userDetails = new User(usuario.getUsername(), usuario.getPasswordHash(),
                roles.stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)).collect(Collectors.toSet()));
        return jwtService.generateToken(userDetails, Map.of("roles", roles));
    }

    private String normalizarRol(String rol) {
        if (rol == null) {
            return "EMPLEADO";
        }
        String value = rol.trim().toUpperCase(Locale.ROOT);
        if (value.isEmpty()) {
            return "EMPLEADO";
        }
        if (!value.equals("ADMIN") && !value.equals("EMPLEADO")) {
            throw new IllegalArgumentException("Rol invalido");
        }
        return value;
    }

    private boolean currentUserIsAdmin() {
        try {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return false;
            }
            return auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        } catch (Exception e) {
            return false;
        }
    }
}
