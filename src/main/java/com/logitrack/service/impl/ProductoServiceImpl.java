package com.logitrack.service.impl;

import com.logitrack.model.AccionAuditoria;
import com.logitrack.model.Producto;
import com.logitrack.model.Usuario;
import com.logitrack.repository.ProductoRepository;
import com.logitrack.repository.UsuarioRepository;
import com.logitrack.service.AuditoriaService;
import com.logitrack.service.ProductoService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository productoRepository;
    private final AuditoriaService auditoriaService;
    private final UsuarioRepository usuarioRepository;

    @Override
    public Producto crear(Producto producto) {
        Producto saved = productoRepository.save(producto);
        auditoriaService.registrar("producto", saved.getId(), AccionAuditoria.INSERT, currentUserId(), null, saved, null, null);
        return saved;
    }

    @Override
    public Producto actualizar(Long id, Producto producto) {
        Producto existente = obtener(id);
        Producto anterior = copy(existente);
        existente.setNombre(producto.getNombre());
        existente.setCategoria(producto.getCategoria());
        existente.setPrecio(producto.getPrecio());
        existente.setStock(producto.getStock());
        existente.setActivo(producto.getActivo());
        Producto actualizado = productoRepository.save(existente);
        auditoriaService.registrar("producto", id, AccionAuditoria.UPDATE, currentUserId(), anterior, actualizado, null, null);
        return actualizado;
    }

    @Override
    public void eliminar(Long id) {
        Producto existente = obtener(id);
        productoRepository.delete(existente);
        auditoriaService.registrar("producto", id, AccionAuditoria.DELETE, currentUserId(), existente, null, null, null);
    }

    @Override
    public Producto obtener(Long id) {
        return productoRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));
    }

    @Override
    public List<Producto> listar() {
        return productoRepository.findAll();
    }

    @Override
    public List<Producto> stockBajo(int umbral) {
        return productoRepository.findByStockLessThan(umbral);
    }

    private Long currentUserId() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            return usuarioRepository.findByUsername(username).map(Usuario::getId).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private Producto copy(Producto p) {
        return Producto.builder()
                .id(p.getId())
                .nombre(p.getNombre())
                .categoria(p.getCategoria())
                .precio(p.getPrecio())
                .stock(p.getStock())
                .activo(p.getActivo())
                .build();
    }
}
