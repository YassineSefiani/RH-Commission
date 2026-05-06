package com.abcdis.hrapp.repository;

import com.abcdis.hrapp.model.FichePresence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface FichePresenceRepository extends JpaRepository<FichePresence, Long> {

    List<FichePresence> findByDate(LocalDate date);

    List<FichePresence> findByMatriculeCamion(String matriculeCamion);

    List<FichePresence> findByCanal(String canal);

    List<FichePresence> findByDateAndMatriculeCamion(LocalDate date, String matriculeCamion);
}
