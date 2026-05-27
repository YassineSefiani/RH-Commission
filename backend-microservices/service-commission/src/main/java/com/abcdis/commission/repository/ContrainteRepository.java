package com.abcdis.commission.repository;

import com.abcdis.commission.model.Contrainte;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository pour l'accès aux données des Contraintes.
 *
 * <p>Spring Data JPA génère automatiquement l'implémentation SQL à partir
 * des noms de méthodes. C'est la magie de Spring Data !</p>
 *
 * <p>Par exemple :</p>
 * <ul>
 *   <li>{@code findByCarte("COCA_COLA")} → SELECT * FROM contraintes WHERE carte = 'COCA_COLA'</li>
 *   <li>{@code findByActifTrue()} → SELECT * FROM contraintes WHERE actif = true</li>
 * </ul>
 *
 * <p>En héritant de {@code JpaRepository<Contrainte, Long>}, on obtient gratuitement :</p>
 * <ul>
 *   <li>{@code save()} — insérer ou mettre à jour</li>
 *   <li>{@code findById()} — trouver par ID</li>
 *   <li>{@code findAll()} — récupérer toutes les entrées</li>
 *   <li>{@code deleteById()} — supprimer par ID</li>
 *   <li>{@code count()} — compter les entrées</li>
 * </ul>
 */
@Repository
public interface ContrainteRepository extends JpaRepository<Contrainte, Long> {

    /**
     * Récupère toutes les contraintes d'une carte (marque) donnée.
     *
     * <p>SQL généré : SELECT * FROM contraintes WHERE carte = ?1</p>
     *
     * @param carte La carte cible : "COCA_COLA", "FERRERO" ou "WALLS"
     * @return Liste des contraintes pour cette carte (actives et inactives)
     */
    List<Contrainte> findByCarte(String carte);

    /**
     * Récupère uniquement les contraintes actives (actif = true).
     *
     * <p>SQL généré : SELECT * FROM contraintes WHERE actif = true</p>
     *
     * @return Liste de toutes les contraintes actives
     */
    List<Contrainte> findByActifTrue();

    /**
     * Récupère les contraintes actives pour une carte spécifique.
     * Méthode utilisée par le moteur de calcul pour appliquer les règles.
     *
     * <p>SQL généré : SELECT * FROM contraintes WHERE carte = ?1 AND actif = true</p>
     *
     * @param carte La carte cible
     * @return Liste des contraintes actives pour cette carte
     */
    List<Contrainte> findByCarteAndActifTrue(String carte);

    /**
     * Compte le nombre total de contraintes actives.
     * Utilisé pour les statistiques du dashboard.
     *
     * <p>SQL généré : SELECT COUNT(*) FROM contraintes WHERE actif = true</p>
     *
     * @return Nombre de contraintes actives
     */
    @Query("SELECT COUNT(c) FROM Contrainte c WHERE c.actif = true")
    Long compterActives();
}
