package com.logitrack.service.impl;

import com.logitrack.dto.MovimientoRequest;
import com.logitrack.model.*;
import com.logitrack.repository.*;
import com.logitrack.service.AuditoriaService;
import com.logitrack.service.MovimientoService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class MovimientoServiceImpl implements MovimientoService {

    private final MovimientoRepository movimientoRepository;
    private final ProductoRepository productoRepository;
    private final BodegaRepository bodegaRepository;
    private final StockBodegaRepository stockBodegaRepository;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaService auditoriaService;

    @Override
    @Transactional
    public Movimiento registrarMovimiento(MovimientoRequest request) {
        Usuario usuario = currentUser();
        Movimiento movimiento = new Movimiento();
        movimiento.setFecha(Instant.now());
        movimiento.setTipo(request.tipo());
        movimiento.setUsuario(usuario);

        if (request.tipo() == MovimientoTipo.ENTRADA || request.tipo() == MovimientoTipo.TRANSFERENCIA) {
            movimiento.setBodegaDestino(requireBodega(request.bodegaDestinoId(), "Bodega destino requerida"));
        }
        if (request.tipo() == MovimientoTipo.SALIDA || request.tipo() == MovimientoTipo.TRANSFERENCIA) {
            movimiento.setBodegaOrigen(requireBodega(request.bodegaOrigenId(), "Bodega origen requerida"));
        }
        movimiento.setComentario(request.comentario());
        movimiento.setReferencia(request.referencia());

        request.items().forEach(item -> {
            Producto producto = productoRepository.findById(item.productoId())
                    .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado"));
            MovimientoDetalle detalle = new MovimientoDetalle();
            detalle.setMovimiento(movimiento);
            detalle.setProducto(producto);
            detalle.setCantidad(item.cantidad());
            detalle.setPrecioUnitario(item.precioUnitario());
            movimiento.getDetalles().add(detalle);
        });

        Movimiento guardado = movimientoRepository.save(movimiento);
        aplicarAStock(guardado);
        auditoriaService.registrar("movimiento", guardado.getId(), AccionAuditoria.INSERT, usuario != null ? usuario.getId() : null, null, guardado, null, null);
        return guardado;
    }

    @Override
    public List<Movimiento> listar(Instant desde, Instant hasta, String tipo) {
        MovimientoTipo tipoEnum = null;
        if (tipo != null) {
            try { tipoEnum = MovimientoTipo.valueOf(tipo); } catch (IllegalArgumentException ignored) {}
        }
        if (tipoEnum == null && desde == null && hasta == null) {
            return movimientoRepository.findAll();
        }
        return movimientoRepository.search(tipoEnum, desde, hasta);
    }

    private Bodega requireBodega(Long id, String mensaje) {
        if (id == null) throw new IllegalArgumentException(mensaje);
        return bodegaRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Bodega no encontrada"));
    }

    private void aplicarAStock(Movimiento movimiento) {
        for (MovimientoDetalle det : movimiento.getDetalles()) {
            Producto producto = det.getProducto();
            double qty = det.getCantidad();

            if (movimiento.getTipo() == MovimientoTipo.ENTRADA) {
                actualizarStockBodega(movimiento.getBodegaDestino(), producto, qty);
                int nuevoGlobal = producto.getStock() + (int) qty;
                producto.setStock(nuevoGlobal);
            } else if (movimiento.getTipo() == MovimientoTipo.SALIDA) {
                actualizarStockBodega(movimiento.getBodegaOrigen(), producto, -qty);
                int nuevoGlobal = producto.getStock() - (int) qty;
                if (nuevoGlobal < 0) {
                    throw new IllegalArgumentException("Stock global insuficiente para producto " + producto.getNombre());
                }
                producto.setStock(nuevoGlobal);
            } else if (movimiento.getTipo() == MovimientoTipo.TRANSFERENCIA) {
                actualizarStockBodega(movimiento.getBodegaOrigen(), producto, -qty);
                actualizarStockBodega(movimiento.getBodegaDestino(), producto, qty);
            }
            productoRepository.save(producto);
        }
    }

    private void actualizarStockBodega(Bodega bodega, Producto producto, double delta) {
        StockBodega stock = stockBodegaRepository.findByBodegaAndProducto(bodega, producto)
                .orElseGet(() -> StockBodega.builder().bodega(bodega).producto(producto).cantidad(0d).build());
        double nuevaCantidad = Optional.ofNullable(stock.getCantidad()).orElse(0d) + delta;
        if (nuevaCantidad < 0) {
            throw new IllegalArgumentException("Stock insuficiente en bodega " + bodega.getNombre());
        }
        stock.setCantidad(nuevaCantidad);
        stockBodegaRepository.save(stock);
    }

    private Usuario currentUser() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            return usuarioRepository.findByUsername(username).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}
