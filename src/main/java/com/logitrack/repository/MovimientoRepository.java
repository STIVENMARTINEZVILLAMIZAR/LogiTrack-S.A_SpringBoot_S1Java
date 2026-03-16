package com.logitrack.repository;

import com.logitrack.model.Movimiento;
import com.logitrack.model.MovimientoTipo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface MovimientoRepository extends JpaRepository<Movimiento, Long> {
    List<Movimiento> findByFechaBetween(Instant desde, Instant hasta);

    @Query("select m from Movimiento m where (:tipo is null or m.tipo = :tipo) and (:desde is null or m.fecha >= :desde) and (:hasta is null or m.fecha <= :hasta)")
    List<Movimiento> search(@Param("tipo") MovimientoTipo tipo, @Param("desde") Instant desde, @Param("hasta") Instant hasta);
}
