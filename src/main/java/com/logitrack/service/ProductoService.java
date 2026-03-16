package com.logitrack.service;

import com.logitrack.model.Producto;

import java.util.List;

public interface ProductoService {
    Producto crear(Producto producto);
    Producto actualizar(Long id, Producto producto);
    void eliminar(Long id);
    Producto obtener(Long id);
    List<Producto> listar();
    List<Producto> stockBajo(int umbral);
}
