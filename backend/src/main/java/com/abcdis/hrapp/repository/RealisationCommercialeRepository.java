package com.abcdis.hrapp.repository;

import com.abcdis.hrapp.model.RealisationCommerciale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RealisationCommercialeRepository extends JpaRepository<RealisationCommerciale, Long> {
    Optional<RealisationCommerciale> findByPeriodeAndCarteIgnoreCaseAndMatricule(String periode, String carte, String matricule);
    boolean existsByPeriodeAndCarteIgnoreCaseAndMatricule(String periode, String carte, String matricule);
}
