package com.abcdis.presence.repository;

import com.abcdis.presence.model.VolumeDistribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VolumeDistributionRepository extends JpaRepository<VolumeDistribution, Long> {
    Optional<VolumeDistribution> findByPeriodeAndMatricule(String periode, String matricule);
    boolean existsByPeriodeAndMatricule(String periode, String matricule);
    List<VolumeDistribution> findByPeriode(String periode);
    List<VolumeDistribution> findByMatricule(String matricule);

    @Query("SELECT SUM(v.volumeCharge) FROM VolumeDistribution v WHERE v.periode = :periode")
    Double getTotalVolumeChargePourPeriode(String periode);
}
