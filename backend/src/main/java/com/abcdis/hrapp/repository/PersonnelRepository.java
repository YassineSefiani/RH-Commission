package com.abcdis.hrapp.repository;

import com.abcdis.hrapp.model.Personnel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonnelRepository extends JpaRepository<Personnel, Long> {
    
    // Recherche par matricule (unique)
    Optional<Personnel> findByMatricule(String matricule);
    
    // Recherche par nom (insensible à la casse)
    List<Personnel> findByNomContainingIgnoreCase(String nom);

    // Recherche par Carte
    List<Personnel> findByCarte(String carte);
    
    // Recherche par nature de contrat
    List<Personnel> findByNatureContrat(String natureContrat);
    
    // Recherche par ville
    List<Personnel> findByVille(String ville);
    
    // Recherche par statut actif
    List<Personnel> findByActif(Boolean actif);
    
    // Recherche par fonction
    List<Personnel> findByFonction(String fonction);
    
    // Vérifier si un matricule existe déjà
    boolean existsByMatricule(String matricule);
    List<Personnel> findByCarteAndActifTrue(String carte);
}