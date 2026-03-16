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
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
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
        Rol rolEmpleado = rolRepository.findByNombre("EMPLEADO")
                .orElseGet(() -> rolRepository.save(Rol.builder().nombre("EMPLEADO").descripcion("Rol por defecto").build()));

        Usuario usuario = Usuario.builder()
                .nombre(request.nombre())
                .apellido(request.apellido())
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .roles(Set.of(rolEmpleado))
                .build();
        usuarioRepository.save(usuario);
        String token = generarToken(usuario);
        auditoriaService.registrar("usuario", usuario.getId(), AccionAuditoria.INSERT, usuario.getId(), null, Map.of("username", usuario.getUsername()), null, null);
        return new AuthResponse(token, jwtService.extractClaim(token, claims -> claims.getExpiration().getTime() - claims.getIssuedAt().getTime()));
    }

    private String generarToken(Usuario usuario) {
        List<String> roles = usuario.getRoles().stream().map(Rol::getNombre).toList();
        User userDetails = new User(usuario.getUsername(), usuario.getPasswordHash(),
                roles.stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)).collect(Collectors.toSet()));
        return jwtService.generateToken(userDetails, Map.of("roles", roles));
    }
}
