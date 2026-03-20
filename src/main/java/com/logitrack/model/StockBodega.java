package com.logitrack.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "stock_bodega", uniqueConstraints = @UniqueConstraint(columnNames = {"bodega_id", "producto_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockBodega {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "bodega_id")
    private Bodega bodega;

    @ManyToOne(optional = false)
    @JoinColumn(name = "producto_id")
    private Producto producto;

    @Column(nullable = false)
    private Double cantidad = 0d;
}
