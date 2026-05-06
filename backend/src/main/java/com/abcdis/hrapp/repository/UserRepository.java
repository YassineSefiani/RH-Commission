package com.abcdis.hrapp.repository;

import com.abcdis.hrapp.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Recherche par email (unique)
    Optional<User> findByEmail(String email);
    
    // Vérifier si un email existe déjà
    Boolean existsByEmail(String email);
    
    // Recherche par superRole
    java.util.List<User> findBySuperRole(String superRole);
    
    // Recherche par statut actif
    java.util.List<User> findByActif(Boolean actif);
}