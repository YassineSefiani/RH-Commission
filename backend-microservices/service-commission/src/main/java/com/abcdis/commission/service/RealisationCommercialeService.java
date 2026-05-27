package com.abcdis.commission.service;

import com.abcdis.commission.exception.ResourceNotFoundException;
import com.abcdis.commission.model.RealisationCommerciale;
import com.abcdis.commission.repository.RealisationCommercialeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RealisationCommercialeService {

    private final RealisationCommercialeRepository realisationRepository;

    @Transactional(readOnly = true)
    public List<RealisationCommerciale> listerToutes() {
        return realisationRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<RealisationCommerciale> listerParPeriode(String periode) {
        return realisationRepository.findByPeriode(periode);
    }

    @Transactional(readOnly = true)
    public List<RealisationCommerciale> listerParCarte(String carte) {
        return realisationRepository.findByCarteIgnoreCase(carte);
    }

    @Transactional
    public RealisationCommerciale enregistrer(RealisationCommerciale realisation) {
        realisationRepository.findByPeriodeAndCarteIgnoreCaseAndMatricule(
                realisation.getPeriode(), realisation.getCarte(), realisation.getMatricule())
                .ifPresent(existante -> realisation.setId(existante.getId()));
        realisation.setDerniereMaj(java.time.LocalDateTime.now());
        return realisationRepository.save(realisation);
    }

    @Transactional
    public List<RealisationCommerciale> enregistrerBatch(List<RealisationCommerciale> realisations) {
        return realisations.stream().map(this::enregistrer).toList();
    }

    @Transactional
    public void supprimer(Long id) {
        if (!realisationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Réalisation introuvable avec l'ID : " + id);
        }
        realisationRepository.deleteById(id);
    }
}
