# LogiTrack S.A. Backend

Backend Spring Boot para gestión y auditoría de bodegas con autenticación JWT, auditoría de cambios y documentación Swagger.

<p align="center">
<img src="https://img.shields.io/badge/Java-17-orange?logo=java&logoColor=white"/> <img src="https://img.shields.io/badge/MySQL-8.0.45-blue?logo=mysql&logoColor=white"/> <img src="https://img.shields.io/badge/Maven-4.0.0-C71A36?logo=apache-maven&logoColor=white"/> <img src="https://img.shields.io/badge/Editor-VSCode-007ACC?logo=visualstudiocode&logoColor=white"/> <img src="https://img.shields.io/badge/github-repo-blue?logo=github"/><img src="https://img.shields.io/badge/SpringBoot-6DB33F?style=flat-square&logo=Spring&logoColor=white"/> 
</p>

## Requisitos
- Java 17
- Maven 3.9+
- MySQL 8 (usuario/clave configurables vía variables `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`)

## Puesta en marcha
1. Crear la base `logitrack` o dejar que `schema.sql` la cree (propiedad `spring.sql.init.mode=always`).
2. Ajustar credenciales en `src/main/resources/application.properties` si es necesario.
3. Ejecutar:
   ```bash
   ./mvnw spring-boot:run
   ```
4. Swagger UI: `/swagger-ui.html`.

Credenciales seed: `admin` / `password`.

## Endpoints principales
- `POST /auth/login` y `POST /auth/register` (JWT).
- CRUD ` /bodegas`, `/productos`.
- `GET /productos/stock-bajo?umbral=10`.
- `POST /movimientos` (entrada/salida/transferencia con items).
- `GET /movimientos?desde=2024-01-01T00:00:00Z&hasta=...&tipo=ENTRADA`.
- `GET /movimientos/resumen` (stock total por bodega).
- `GET /auditorias?usuarioId=1` o `?accion=INSERT`.

## Auditoría
Cada operación de negocio registra en `auditoria` los valores previos/nuevos, usuario, IP y agente cuando aplica.

## Seguridad
Spring Security + JWT (HS256). Se permiten sin token: `/auth/**`, `/swagger-ui/**`, `/v3/api-docs/**`.

## Estructura
- `model/` entidades JPA y enums.
- `repository/` repositorios Spring Data.
- `service/` lógica de negocio y auditoría.
- `controller/` REST.
- `security/` JWT, filtros y configuración.
- `src/main/resources/schema.sql` y `data.sql` para inicializar.
