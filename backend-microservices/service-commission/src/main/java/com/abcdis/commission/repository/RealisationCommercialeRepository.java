package com.abcdis.commission.repository;

import com.abcdis.commission.model.RealisationCommerciale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RealisationCommercialeRepository extends JpaRepository<RealisationCommerciale, Long> {
    Optional<RealisationCommerciale> findByPeriodeAndCarteIgnoreCaseAndMatricule(String periode, String carte, String matricule);
    boolean existsByPeriodeAndCarteIgnoreCaseAndMatricule(String periode, String carte, String matricule);
    List<RealisationCommerciale> findByPeriode(String periode);
    List<RealisationCommerciale> findByCarteIgnoreCase(String carte);

    @Query("""
            SELECT MAX(r.derniereMaj) FROM RealisationCommerciale r
            WHERE r.periode = :periode
              AND LOWER(r.carte) = LOWER(:carte)
              AND r.matricule = :matricule
            """)
    LocalDateTime maxDerniereMaj(@Param("periode") String periode,
                                  @Param("carte") String carte,
                                  @Param("matricule") String matricule);
}
