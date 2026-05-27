package com.abcdis.presence.repository;

import com.abcdis.presence.model.Voyage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour l'accès aux données des Voyages.
 *
 * <p>Un voyage est une tournée de livraison rattachée à une fiche de présence.
 * Ce repository permet de récupérer les voyages par fiche parent et de
 * calculer les totaux de ventes.</p>
 */
@Repository
public interface VoyageRepository extends JpaRepository<Voyage, Long> {

    /**
     * Récupère tous les voyages appartenant à une fiche de présence.
     * Utilisé pour afficher le détail d'une journée de travail.
     *
     * <p>SQL : SELECT * FROM voyages WHERE fiche_presence_id = ?</p>
     *
     * @param fichePresenceId L'ID de la fiche de présence parente
     * @return Liste des voyages de cette fiche, triés par ordre naturel
     */
    List<Voyage> findByFichePresenceId(Long fichePresenceId);

    /**
     * Calcule la somme des ventes pour tous les voyages d'une fiche.
     * Permet d'obtenir le total des ventes de la journée.
     *
     * <p>JPQL : SELECT SUM(v.montantVentes) FROM Voyage v
     *           WHERE v.fichePresence.id = :ficheId</p>
     *
     * @param ficheId L'ID de la fiche de présence
     * @return Le total des ventes en MAD, ou null si aucun voyage
     */
    @Query("SELECT SUM(v.montantVentes) FROM Voyage v WHERE v.fichePresence.id = :ficheId")
    Double getTotalVentesFiche(@Param("ficheId") Long ficheId);
}
