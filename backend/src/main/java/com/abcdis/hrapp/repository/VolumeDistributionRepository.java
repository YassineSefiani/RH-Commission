package com.abcdis.hrapp.repository;

import com.abcdis.hrapp.model.VolumeDistribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface VolumeDistributionRepository extends JpaRepository<VolumeDistribution, Long> {
    Optional<VolumeDistribution> findByPeriodeAndMatricule(String periode, String matricule);
    boolean existsByPeriodeAndMatricule(String periode, String matricule);
}
