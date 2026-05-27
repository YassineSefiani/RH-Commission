package com.abcdis.personnel.repository;

import com.abcdis.personnel.model.Personnel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ════════════════════════════════════════════════════════════════
 *  REPOSITORY JPA : PersonnelRepository
 * ════════════════════════════════════════════════════════════════
 *  Interface d'accès aux données pour l'entité Personnel.
 *
 *  PATTERN DAO (Data Access Object) en JEE :
 *  Ce repository encapsule toutes les opérations de base de données
 *  liées aux employés. La couche Service n'a pas besoin de connaître
 *  le SQL - elle appelle uniquement ces méthodes abstraites.
 *
 *  Spring Data JPA génère AUTOMATIQUEMENT les implémentations SQL
 *  à partir des noms des méthodes (convention de nommage) :
 *
 *  findByNom(nom)      → SELECT * FROM personnel WHERE nom = ?
 *  findByActif(true)   → SELECT * FROM personnel WHERE actif = true
 *  findByCarte(carte)  → SELECT * FROM personnel WHERE carte = ?
 * ════════════════════════════════════════════════════════════════
 */
@Repository
public interface PersonnelRepository extends JpaRepository<Personnel, Long> {

    /** Recherche par matricule unique */
    Optional<Personnel> findByMatricule(String matricule);

    /** Récupère tous les employés actifs */
    List<Personnel> findByActifTrue();

    /**
     * Recherche les employés d'une carte commerciale spécifique.
     * Utilisé pour le calcul des commissions par marque.
     */
    List<Personnel> findByCarte(String carte);

    /** Recherche les employés actifs d'une carte commerciale */
    List<Personnel> findByCarteAndActifTrue(String carte);

    /** Recherche les employés par ville */
    List<Personnel> findByVille(String ville);

    /** Recherche par type de contrat (CDI, Int) */
    List<Personnel> findByNatureContrat(String natureContrat);

    /**
     * Recherche textuelle sur le nom ou prénom.
     * JPQL (Java Persistence Query Language) - similaire à SQL mais orienté objet.
     * LOWER() → insensible à la casse
     * LIKE '%...%' → recherche partielle
     */
    @Query("SELECT p FROM Personnel p WHERE " +
           "LOWER(p.nom) LIKE LOWER(CONCAT('%', :terme, '%')) OR " +
           "LOWER(p.prenom) LIKE LOWER(CONCAT('%', :terme, '%'))")
    List<Personnel> rechercherParNom(@Param("terme") String terme);

    /** Vérifie si un matricule est déjà utilisé */
    boolean existsByMatricule(String matricule);

    /** Compte le nombre d'employés actifs */
    long countByActifTrue();

    /** Compte le nombre d'employés inactifs */
    long countByActifFalse();

    /**
     * Récupère la liste des villes distinctes (pour le filtre).
     * DISTINCT élimine les doublons dans les résultats.
     */
    @Query("SELECT DISTINCT p.ville FROM Personnel p WHERE p.ville IS NOT NULL ORDER BY p.ville")
    List<String> findVillesDistinctes();

    /**
     * Récupère la liste des cartes distinctes (pour le filtre).
     */
    @Query("SELECT DISTINCT p.carte FROM Personnel p WHERE p.carte IS NOT NULL ORDER BY p.carte")
    List<String> findCartesDistinctes();
}
