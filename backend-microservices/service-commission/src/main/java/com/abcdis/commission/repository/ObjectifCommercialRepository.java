package com.abcdis.commission.repository;

import com.abcdis.commission.model.ObjectifCommercial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ObjectifCommercialRepository extends JpaRepository<ObjectifCommercial, Long> {
    Optional<ObjectifCommercial> findByPeriodeAndCarteIgnoreCaseAndMatricule(String periode, String carte, String matricule);
    boolean existsByPeriodeAndCarteIgnoreCaseAndMatricule(String periode, String carte, String matricule);
    List<ObjectifCommercial> findByPeriode(String periode);
    List<ObjectifCommercial> findByCarteIgnoreCase(String carte);

    @Query("""
            SELECT MAX(o.derniereMaj) FROM ObjectifCommercial o
            WHERE o.periode = :periode
              AND LOWER(o.carte) = LOWER(:carte)
              AND o.matricule = :matricule
            """)
    LocalDateTime maxDerniereMaj(@Param("periode") String periode,
                                  @Param("carte") String carte,
                                  @Param("matricule") String matricule);
}
