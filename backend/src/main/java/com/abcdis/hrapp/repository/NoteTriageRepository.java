package com.abcdis.hrapp.repository;

import com.abcdis.hrapp.model.NoteTriage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface NoteTriageRepository extends JpaRepository<NoteTriage, Long> {
    Optional<NoteTriage> findByPeriodeAndMatricule(String periode, String matricule);
    boolean existsByPeriodeAndMatricule(String periode, String matricule);
}
