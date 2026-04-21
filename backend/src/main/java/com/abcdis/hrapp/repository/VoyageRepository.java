package com.abcdis.hrapp.repository;

import com.abcdis.hrapp.model.Voyage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoyageRepository extends JpaRepository<Voyage, Long> {
    
    // Recherche par numéro de voyage
    Optional<Voyage> findByNumeroVoyage(String numeroVoyage);
    
    // Recherche par date
    List<Voyage> findByDate(LocalDate date);
    
    // Recherche par camion
    List<Voyage> findByCamion(String camion);
    
    // Recherche par canal
    List<Voyage> findByCanal(String canal);
    
    // Recherche par livreur
    List<Voyage> findByLivreur(String livreur);
    
    // Recherche par date (plage)
    List<Voyage> findByDateBetween(LocalDate startDate, LocalDate endDate);
}
