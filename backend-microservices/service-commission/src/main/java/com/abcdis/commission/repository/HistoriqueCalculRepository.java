package com.abcdis.commission.repository;

import com.abcdis.commission.model.HistoriqueCalcul;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour l'accès aux données de l'historique des calculs.
 *
 * <p>Ce repository fournit des méthodes pour interroger la table {@code historique_calculs}.
 * Les requêtes JPQL (Java Persistence Query Language) utilisent les noms des champs Java
 * (ex: {@code h.nomEmploye}) et non les noms SQL (ex: {@code nom_employe}).</p>
 *
 * <p>Différence JPQL vs SQL :</p>
 * <ul>
 *   <li>SQL : {@code SELECT * FROM historique_calculs WHERE nom_employe LIKE '%ali%'}</li>
 *   <li>JPQL : {@code SELECT h FROM HistoriqueCalcul h WHERE LOWER(h.nomEmploye) LIKE LOWER(CONCAT('%', :nom, '%'))}</li>
 * </ul>
 */
@Repository
public interface HistoriqueCalculRepository extends JpaRepository<HistoriqueCalcul, Long> {

    /**
     * Recherche les calculs dont le nom d'employé contient la chaîne donnée.
     * La recherche est insensible à la casse (majuscules/minuscules ignorées).
     *
     * <p>Exemple : rechercherParNom("ali") trouve "Mohamed Alami", "Alice Benali"</p>
     *
     * @param nom La chaîne de recherche (partie du nom)
     * @return Liste des calculs correspondants
     */
    List<HistoriqueCalcul> findByNomEmployeContainingIgnoreCase(String nom);

    /**
     * Récupère les calculs d'un mois et d'une année précis.
     * Permet d'afficher l'historique filtré par période.
     *
     * <p>SQL généré : SELECT * FROM historique_calculs WHERE mois = ?1 AND annee = ?2</p>
     *
     * @param mois Le numéro du mois (1=Janvier ... 12=Décembre)
     * @param annee L'année (ex: 2026)
     * @return Liste des calculs de ce mois/année
     */
    List<HistoriqueCalcul> findByMoisAndAnnee(Integer mois, Integer annee);

    /**
     * Récupère les calculs pour une carte (marque) donnée.
     *
     * @param carte La carte : "COCA_COLA", "FERRERO" ou "WALLS"
     * @return Liste des calculs pour cette marque
     */
    List<HistoriqueCalcul> findByCarte(String carte);

    /**
     * Récupère les calculs d'une année entière.
     *
     * @param annee L'année (ex: 2026)
     * @return Liste de tous les calculs de cette année
     */
    List<HistoriqueCalcul> findByAnnee(Integer annee);

    /**
     * Calcule le total des commissions versées pour une année donnée.
     * Utilise la fonction d'agrégation SUM de JPQL.
     *
     * @param annee L'année cible
     * @return Total des commissions en MAD, ou null si aucun calcul
     */
    @Query("SELECT SUM(h.commissions) FROM HistoriqueCalcul h WHERE h.annee = :annee")
    Double getTotalCommissionsParAnnee(@Param("annee") Integer annee);

    /**
     * Calcule la masse salariale totale (somme de tous les salaires finaux).
     * Utilisé pour les indicateurs clés du dashboard.
     *
     * @return Masse salariale totale en MAD, ou null si aucun calcul
     */
    @Query("SELECT SUM(h.salaireFinal) FROM HistoriqueCalcul h")
    Double getMasseSalarialeTotal();

    /**
     * Recherche le calcul existant pour un employé sur une période et une carte donnés.
     * Permet de détecter les recalculs redondants.
     */
    java.util.Optional<HistoriqueCalcul> findFirstByMatriculeAndMoisAndAnneeAndCarteOrderByDateCalculDesc(
            String matricule, Integer mois, Integer annee, String carte);

    /** Version paginée triée date desc pour les écrans de listing. */
    Page<HistoriqueCalcul> findAllByOrderByDateCalculDesc(Pageable pageable);
}
