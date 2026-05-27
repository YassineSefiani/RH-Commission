package com.abcdis.auth.repository;

import com.abcdis.auth.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * ════════════════════════════════════════════════════════════════
 *  REPOSITORY JPA : UtilisateurRepository
 * ════════════════════════════════════════════════════════════════
 *  Interface d'accès aux données pour l'entité Utilisateur.
 *
 *  CONCEPT JEE - PATTERN REPOSITORY (DAO) :
 *  En JEE, le pattern DAO (Data Access Object) sépare la logique
 *  d'accès aux données de la logique métier. Spring Data JPA
 *  implémente automatiquement cette interface - pas besoin d'écrire
 *  les requêtes SQL pour les opérations de base !
 *
 *  JpaRepository<Utilisateur, Long> fournit automatiquement :
 *    - findAll()          → SELECT * FROM utilisateurs
 *    - findById(id)       → SELECT * FROM utilisateurs WHERE id = ?
 *    - save(utilisateur)  → INSERT ou UPDATE
 *    - delete(utilisateur)→ DELETE
 *    - count()            → SELECT COUNT(*) FROM utilisateurs
 *    - existsById(id)     → SELECT 1 FROM utilisateurs WHERE id = ?
 * ════════════════════════════════════════════════════════════════
 */
@Repository // Indique que c'est un composant d'accès aux données (couche DAO)
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    /**
     * Recherche un utilisateur par son adresse email.
     * Spring Data JPA génère automatiquement la requête SQL :
     *   SELECT * FROM utilisateurs WHERE email = ?1
     *
     * @param email L'adresse email à rechercher
     * @return Optional contenant l'utilisateur si trouvé, vide sinon
     */
    Optional<Utilisateur> findByEmail(String email);

    /**
     * Recherche un utilisateur actif par son email.
     * Méthode dérivée - Spring génère : SELECT * FROM utilisateurs WHERE email=? AND actif=?
     *
     * @param email L'adresse email
     * @param actif true pour les comptes actifs
     * @return Optional contenant l'utilisateur actif si trouvé
     */
    Optional<Utilisateur> findByEmailAndActif(String email, boolean actif);

    /**
     * Vérifie si un email est déjà utilisé dans la base.
     * Requête dérivée : SELECT COUNT(*) > 0 FROM utilisateurs WHERE email = ?
     *
     * @param email L'adresse email à vérifier
     * @return true si l'email existe déjà
     */
    boolean existsByEmail(String email);

    /**
     * Récupère tous les utilisateurs ayant un rôle spécifique.
     * Requête JPQL personnalisée (Java Persistence Query Language).
     * JPQL est orienté objet contrairement à SQL natif.
     *
     * @param role Le rôle à filtrer (ex: "ADMIN", "ADV")
     * @return Liste des utilisateurs ayant ce rôle
     */
    @Query("SELECT u FROM Utilisateur u WHERE u.superRole = :role AND u.actif = true")
    List<Utilisateur> findByRole(@Param("role") String role);

    /**
     * Compte le nombre d'utilisateurs actifs.
     *
     * @return Nombre d'utilisateurs actifs
     */
    long countByActif(boolean actif);
}
