package com.abcdis.hrapp.service;

import com.abcdis.hrapp.model.FichePresence;
import com.abcdis.hrapp.repository.FichePresenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class FichePresenceService {

    @Autowired
    private FichePresenceRepository repository;

    public List<FichePresence> getAllFichePresence() {
        return repository.findAll();
    }

    public Optional<FichePresence> getFichePresenceById(Long id) {
        return repository.findById(id);
    }

    public FichePresence createFichePresence(FichePresence fichePresence) {
        return repository.save(fichePresence);
    }

    public Optional<FichePresence> updateFichePresence(Long id, FichePresence details) {
        return repository.findById(id).map(existing -> {
            existing.setDate(details.getDate());
            existing.setMatriculeCamion(details.getMatriculeCamion());
            existing.setCanal(details.getCanal());
            existing.setLivreur1Id(details.getLivreur1Id());
            existing.setLivreur1Matricule(details.getLivreur1Matricule());
            existing.setLivreur1Nom(details.getLivreur1Nom());
            existing.setLivreur1Prenom(details.getLivreur1Prenom());
            existing.setLivreur2Id(details.getLivreur2Id());
            existing.setLivreur2Matricule(details.getLivreur2Matricule());
            existing.setLivreur2Nom(details.getLivreur2Nom());
            existing.setLivreur2Prenom(details.getLivreur2Prenom());
            existing.setLivreur3Id(details.getLivreur3Id());
            existing.setLivreur3Matricule(details.getLivreur3Matricule());
            existing.setLivreur3Nom(details.getLivreur3Nom());
            existing.setLivreur3Prenom(details.getLivreur3Prenom());
            return repository.save(existing);
        });
    }

    public boolean deleteFichePresence(Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }

    public List<FichePresence> getFichePresenceByDate(LocalDate date) {
        return repository.findByDate(date);
    }

    public List<FichePresence> getFichePresenceByMatriculeCamion(String matriculeCamion) {
        return repository.findByMatriculeCamion(matriculeCamion);
    }

    public List<FichePresence> getFichePresenceByCanal(String canal) {
        return repository.findByCanal(canal);
    }

    public List<FichePresence> getFichePresenceByDateAndMatriculeCamion(LocalDate date, String matriculeCamion) {
        return repository.findByDateAndMatriculeCamion(date, matriculeCamion);
    }
}
