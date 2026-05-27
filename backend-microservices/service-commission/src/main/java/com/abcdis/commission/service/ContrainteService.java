package com.abcdis.commission.service;

import com.abcdis.commission.exception.ResourceNotFoundException;
import com.abcdis.commission.model.Contrainte;
import com.abcdis.commission.repository.ContrainteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ContrainteService {

    private final ContrainteRepository contrainteRepository;

    @Transactional(readOnly = true)
    public List<Contrainte> listerToutes() {
        return contrainteRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Contrainte> listerParCarte(String carte) {
        return contrainteRepository.findByCarte(carte);
    }

    @Transactional(readOnly = true)
    public List<Contrainte> listerActives() {
        return contrainteRepository.findByActifTrue();
    }

    @Transactional(readOnly = true)
    public Contrainte trouverParId(Long id) {
        return contrainteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Contrainte introuvable avec l'ID : " + id));
    }

    @Transactional
    public Contrainte creer(Contrainte contrainte) {
        return contrainteRepository.save(contrainte);
    }

    @Transactional
    public Contrainte modifier(Long id, Contrainte nouvelleDonnees) {
        Contrainte existante = trouverParId(id);
        if (nouvelleDonnees.getNom()        != null) existante.setNom(nouvelleDonnees.getNom());
        if (nouvelleDonnees.getCarte()      != null) existante.setCarte(nouvelleDonnees.getCarte());
        if (nouvelleDonnees.getValeur()     != null) existante.setValeur(nouvelleDonnees.getValeur());
        if (nouvelleDonnees.getCondition()  != null) existante.setCondition(nouvelleDonnees.getCondition());
        if (nouvelleDonnees.getTypeValeur() != null) existante.setTypeValeur(nouvelleDonnees.getTypeValeur());
        if (nouvelleDonnees.getActif()      != null) existante.setActif(nouvelleDonnees.getActif());
        if (nouvelleDonnees.getType()       != null) existante.setType(nouvelleDonnees.getType());
        if (nouvelleDonnees.getRuleGroups() != null) existante.setRuleGroups(nouvelleDonnees.getRuleGroups());
        return contrainteRepository.save(existante);
    }

    @Transactional
    public Contrainte basculerStatut(Long id) {
        Contrainte contrainte = trouverParId(id);
        contrainte.setActif(!contrainte.getActif());
        return contrainteRepository.save(contrainte);
    }

    @Transactional
    public void supprimer(Long id) {
        // trouverParId lance ResourceNotFoundException si absent → 404 via handler
        contrainteRepository.delete(trouverParId(id));
    }

    @Transactional(readOnly = true)
    public Long compterActives() {
        return contrainteRepository.compterActives();
    }
}
