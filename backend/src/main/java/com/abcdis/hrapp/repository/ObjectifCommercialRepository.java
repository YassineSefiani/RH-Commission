package com.abcdis.hrapp.repository;

import com.abcdis.hrapp.model.ObjectifCommercial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ObjectifCommercialRepository extends JpaRepository<ObjectifCommercial, Long> {
    Optional<ObjectifCommercial> findByPeriodeAndCarteIgnoreCaseAndMatricule(String periode, String carte, String matricule);
    boolean existsByPeriodeAndCarteIgnoreCaseAndMatricule(String periode, String carte, String matricule);
}
