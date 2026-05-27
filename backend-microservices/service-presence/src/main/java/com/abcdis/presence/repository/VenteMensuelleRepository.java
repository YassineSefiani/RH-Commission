package com.abcdis.presence.repository;

import com.abcdis.presence.model.VenteMensuelle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository pour l'accès aux données des Ventes Mensuelles.
 *
 * <p>Permet d'interroger et d'agréger les données de ventes par employé,
 * par carte (marque) et par période.</p>
 */
@Repository
public interface VenteMensuelleRepository extends JpaRepository<VenteMensuelle, Long> {

    /**
     * Trouve les ventes d'un employé pour un mois et une année donnés.
     * Utile pour vérifier si une entrée existe déjà avant d'en créer une nouvelle.
     *
     * @param nomEmploye Le nom complet de l'employé
     * @param mois Le mois (1 à 12)
     * @param annee L'année (ex: 2026)
     * @return Optional vide si non trouvé, sinon les ventes correspondantes
     */
    Optional<VenteMensuelle> findByNomEmployeAndMoisAndAnnee(String nomEmploye,
                                                              Integer mois,
                                                              Integer annee);

    /**
     * Récupère toutes les ventes pour un mois et une année donnés.
     * Permet d'afficher le tableau de performance mensuel de toute l'équipe.
     *
     * @param mois Le mois (1 à 12)
     * @param annee L'année (ex: 2026)
     * @return Liste des ventes de tous les employés ce mois
     */
    List<VenteMensuelle> findByMoisAndAnnee(Integer mois, Integer annee);

    /**
     * Récupère les ventes pour une carte (marque) spécifique.
     * Permet de filtrer les performances par marque.
     *
     * @param carte La carte cible : "COCA_COLA", "FERRERO" ou "WALLS"
     * @return Toutes les ventes pour cette marque
     */
    List<VenteMensuelle> findByCarte(String carte);

    /**
     * Récupère l'historique des ventes d'un employé.
     *
     * @param nomEmploye Le nom de l'employé
     * @return Toutes les ventes enregistrées pour cet employé
     */
    List<VenteMensuelle> findByNomEmploye(String nomEmploye);

    /**
     * Calcule le total des ventes pour toute une année.
     * Utilisé pour les statistiques annuelles du dashboard.
     *
     * @param annee L'année cible
     * @return Total des ventes en MAD sur l'année, ou null si aucune donnée
     */
    @Query("SELECT SUM(v.montantVentes) FROM VenteMensuelle v WHERE v.annee = :annee")
    Double getTotalVentesAnnee(@Param("annee") Integer annee);
}
