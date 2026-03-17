package com.logitrack.config;

import com.logitrack.model.Rol;
import com.logitrack.model.Usuario;
import com.logitrack.repository.RolRepository;
import com.logitrack.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username:admin}")
    private String adminUsername;

    @Value("${app.admin.email:admin@logitrack.com}")
    private String adminEmail;

    @Value("${app.admin.password:password}")
    private String adminPassword;

    @Value("${app.admin.reset-on-startup:true}")
    private boolean resetOnStartup;

    @Override
    public void run(String... args) {
        Rol adminRol = rolRepository.findByNombre("ADMIN")
                .orElseGet(() -> rolRepository.save(Rol.builder().nombre("ADMIN").descripcion("Administrador del sistema").build()));

        Usuario admin = usuarioRepository.findByUsername(adminUsername).orElse(null);
        if (admin == null) {
            admin = Usuario.builder()
                    .nombre("Admin")
                    .apellido("General")
                    .username(adminUsername)
                    .email(adminEmail)
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .habilitado(true)
                    .build();
            admin.getRoles().add(adminRol);
            usuarioRepository.save(admin);
            return;
        }

        if (!admin.getRoles().contains(adminRol)) {
            admin.getRoles().add(adminRol);
        }
        if (resetOnStartup) {
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
        }
        if (admin.getEmail() == null || admin.getEmail().isBlank()) {
            admin.setEmail(adminEmail);
        }
        admin.setHabilitado(true);
        usuarioRepository.save(admin);
    }
}
