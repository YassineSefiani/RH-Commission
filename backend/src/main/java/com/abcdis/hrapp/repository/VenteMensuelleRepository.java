package com.abcdis.hrapp.repository;

import com.abcdis.hrapp.model.VenteMensuelle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface VenteMensuelleRepository extends JpaRepository<VenteMensuelle, Long> {
    
    // Recherche par date
    Optional<VenteMensuelle> findByDate(LocalDate date);
    
    // Recherche par plage de dates
    List<VenteMensuelle> findByDateBetween(LocalDate startDate, LocalDate endDate);
    
    // Recherche avec tri par date décroissante
    List<VenteMensuelle> findAllByOrderByDateDesc();
}
