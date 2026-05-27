package com.abcdis.presence.repository;

import com.abcdis.presence.model.FichePresence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

/**
 * Repository pour l'accès aux données des Fiches de Présence.
 *
 * <p>Fournit des méthodes pour interroger la table {@code fiches_presence}.
 * Spring Data JPA génère automatiquement le SQL à partir des noms de méthodes.</p>
 *
 * <p>Exemples de méthodes dérivées :</p>
 * <ul>
 *   <li>{@code findByDate} → WHERE date = ?</li>
 *   <li>{@code findByNomLivreur} → WHERE nom_livreur = ?</li>
 *   <li>{@code findByDateBetween} → WHERE date BETWEEN ? AND ?</li>
 * </ul>
 */
@Repository
public interface FichePresenceRepository extends JpaRepository<FichePresence, Long> {

    /**
     * Récupère toutes les fiches de présence d'une date donnée.
     * Permet de voir tous les camions qui sont sortis un jour précis.
     *
     * @param date La date cible (ex: 2026-05-19)
     * @return Liste des fiches pour cette date
     */
    List<FichePresence> findByDate(LocalDate date);

    /**
     * Récupère les fiches associées à un livreur spécifique.
     * Permet de consulter l'historique de présence d'un employé.
     *
     * @param nomLivreur Le nom complet du livreur
     * @return Toutes les fiches où ce livreur est enregistré
     */
    List<FichePresence> findByNomLivreur(String nomLivreur);

    /**
     * Recherche dans les 3 slots de livreur (livreur1/2/3) par nom partiel insensible à la casse.
     * Couvre le cas où un livreur peut être chauffeur OU aide.
     */
    @Query("""
            SELECT f FROM FichePresence f
            WHERE LOWER(f.livreur1Nom) LIKE LOWER(CONCAT('%', :nom, '%'))
               OR LOWER(f.livreur2Nom) LIKE LOWER(CONCAT('%', :nom, '%'))
               OR LOWER(f.livreur3Nom) LIKE LOWER(CONCAT('%', :nom, '%'))
            """)
    List<FichePresence> rechercherParNomLivreur(@Param("nom") String nom);

    /**
     * Récupère les fiches pour un camion spécifique.
     *
     * @param matriculeCamion Le numéro de matricule du camion
     * @return Toutes les fiches pour ce camion
     */
    List<FichePresence> findByMatriculeCamion(String matriculeCamion);

    /**
     * Récupère les fiches dans une plage de dates.
     * Utile pour les rapports hebdomadaires ou mensuels.
     *
     * <p>SQL généré : SELECT * FROM fiches_presence WHERE date BETWEEN ?1 AND ?2</p>
     *
     * @param debut Date de début de la période (incluse)
     * @param fin Date de fin de la période (incluse)
     * @return Liste des fiches dans cette période
     */
    List<FichePresence> findByDateBetween(LocalDate debut, LocalDate fin);

    /**
     * Récupère les fiches d'un mois et d'une année spécifiques.
     * Utilise JPQL avec les fonctions MONTH() et YEAR() de H2/Hibernate.
     *
     * <p>JPQL : SELECT f FROM FichePresence f
     *           WHERE MONTH(f.date) = :mois AND YEAR(f.date) = :annee</p>
     *
     * @param mois Le mois (1 à 12)
     * @param annee L'année (ex: 2026)
     * @return Fiches du mois/année demandé
     */
    @Query("SELECT f FROM FichePresence f WHERE MONTH(f.date) = :mois AND YEAR(f.date) = :annee")
    List<FichePresence> findByMoisAndAnnee(@Param("mois") int mois, @Param("annee") int annee);
}
