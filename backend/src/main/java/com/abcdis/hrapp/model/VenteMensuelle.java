package com.abcdis.hrapp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "vente_mensuelle")
@Data
public class VenteMensuelle {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private LocalDate date;
    
    @Column(nullable = false)
    private Double volumeCharge;
    
    @Column(nullable = false)
    private Double volumeRetourne;
    
    @Column(nullable = false)
    private Double volumeLivre;
    
    // Calcul automatique avant la sauvegarde
    @PrePersist
    @PreUpdate
    public void calculerVolumeLivre() {
        if (volumeCharge != null && volumeRetourne != null) {
            this.volumeLivre = volumeCharge - volumeRetourne;
        }
    }
}
