package com.abcdis.commission.repository;

import com.abcdis.commission.model.Volume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface VolumeRepository extends JpaRepository<Volume, Long> {
    Optional<Volume> findByDateAndMatricule(LocalDate date, String matricule);
    List<Volume> findByPeriode(String periode);
    List<Volume> findByMatricule(String matricule);
}
