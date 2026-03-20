package com.logitrack.service;

import com.logitrack.dto.MovimientoRequest;
import com.logitrack.dto.MovimientoDTO;
import com.logitrack.model.Movimiento;

import java.time.Instant;
import java.util.List;

public interface MovimientoService {
    Movimiento registrarMovimiento(MovimientoRequest request);
    List<Movimiento> listar(Instant desde, Instant hasta, String tipo);
    List<MovimientoDTO> listarRecientes();
}
