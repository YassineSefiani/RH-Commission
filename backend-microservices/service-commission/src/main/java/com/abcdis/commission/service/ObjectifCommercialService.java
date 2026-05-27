package com.abcdis.commission.service;

import com.abcdis.commission.exception.ResourceNotFoundException;
import com.abcdis.commission.model.ObjectifCommercial;
import com.abcdis.commission.repository.ObjectifCommercialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ObjectifCommercialService {

    private final ObjectifCommercialRepository objectifRepository;

    @Transactional(readOnly = true)
    public List<ObjectifCommercial> listerTous() {
        return objectifRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ObjectifCommercial> listerParPeriode(String periode) {
        return objectifRepository.findByPeriode(periode);
    }

    @Transactional(readOnly = true)
    public List<ObjectifCommercial> listerParCarte(String carte) {
        return objectifRepository.findByCarteIgnoreCase(carte);
    }

    @Transactional
    public ObjectifCommercial enregistrer(ObjectifCommercial objectif) {
        objectifRepository.findByPeriodeAndCarteIgnoreCaseAndMatricule(
                objectif.getPeriode(), objectif.getCarte(), objectif.getMatricule())
                .ifPresent(existant -> objectif.setId(existant.getId()));
        // Empreinte de fraîcheur — utilisée par l'anti-redondance du calcul
        objectif.setDerniereMaj(java.time.LocalDateTime.now());
        return objectifRepository.save(objectif);
    }

    @Transactional
    public List<ObjectifCommercial> enregistrerBatch(List<ObjectifCommercial> objectifs) {
        return objectifs.stream().map(this::enregistrer).toList();
    }

    @Transactional
    public void supprimer(Long id) {
        if (!objectifRepository.existsById(id)) {
            throw new ResourceNotFoundException("Objectif introuvable avec l'ID : " + id);
        }
        objectifRepository.deleteById(id);
    }
}
