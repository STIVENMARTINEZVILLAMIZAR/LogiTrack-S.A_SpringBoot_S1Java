package com.logitrack.repository;

import com.logitrack.model.Bodega;
import com.logitrack.model.Producto;
import com.logitrack.model.StockBodega;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StockBodegaRepository extends JpaRepository<StockBodega, Long> {
    Optional<StockBodega> findByBodegaAndProducto(Bodega bodega, Producto producto);
    List<StockBodega> findByBodega(Bodega bodega);
}
