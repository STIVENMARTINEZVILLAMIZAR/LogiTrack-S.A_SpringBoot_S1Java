package com.logitrack.service;

import com.logitrack.model.Bodega;

import java.util.List;

public interface BodegaService {
    Bodega crear(Bodega bodega);
    Bodega actualizar(Long id, Bodega bodega);
    void eliminar(Long id);
    Bodega obtener(Long id);
    List<Bodega> listar();
}
