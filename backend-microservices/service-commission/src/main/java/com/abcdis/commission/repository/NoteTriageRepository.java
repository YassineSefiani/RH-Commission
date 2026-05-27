package com.abcdis.commission.repository;

import com.abcdis.commission.model.NoteTriage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NoteTriageRepository extends JpaRepository<NoteTriage, Long> {
    Optional<NoteTriage> findByPeriodeAndMatricule(String periode, String matricule);
    boolean existsByPeriodeAndMatricule(String periode, String matricule);
    List<NoteTriage> findByPeriode(String periode);
    List<NoteTriage> findByMatricule(String matricule);

    @Query("""
            SELECT MAX(n.derniereMaj) FROM NoteTriage n
            WHERE n.periode = :periode
              AND n.matricule = :matricule
            """)
    LocalDateTime maxDerniereMaj(@Param("periode") String periode,
                                  @Param("matricule") String matricule);
}
