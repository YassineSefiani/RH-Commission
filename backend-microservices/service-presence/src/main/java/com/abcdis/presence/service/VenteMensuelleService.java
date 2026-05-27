package com.abcdis.presence.service;

import com.abcdis.presence.exception.ResourceNotFoundException;
import com.abcdis.presence.model.VenteMensuelle;
import com.abcdis.presence.repository.VenteMensuelleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VenteMensuelleService {

    private final VenteMensuelleRepository venteRepository;

    @Transactional(readOnly = true)
    public List<VenteMensuelle> listerParMoisAnnee(Integer mois, Integer annee) {
        return venteRepository.findByMoisAndAnnee(mois, annee);
    }

    @Transactional(readOnly = true)
    public List<VenteMensuelle> listerParCarte(String carte) {
        return venteRepository.findByCarte(carte);
    }

    @Transactional(readOnly = true)
    public List<VenteMensuelle> listerParEmploye(String nomEmploye) {
        return venteRepository.findByNomEmploye(nomEmploye);
    }

    @Transactional
    public VenteMensuelle enregistrer(VenteMensuelle vente) {
        return venteRepository.save(vente);
    }

    @Transactional
    public VenteMensuelle modifier(Long id, VenteMensuelle nouvelleDonnees) {
        VenteMensuelle existante = venteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ventes mensuelles introuvables avec l'ID : " + id));

        if (nouvelleDonnees.getMontantVentes() != null) existante.setMontantVentes(nouvelleDonnees.getMontantVentes());
        if (nouvelleDonnees.getObjectif()      != null) existante.setObjectif(nouvelleDonnees.getObjectif());
        if (nouvelleDonnees.getCarte()         != null) existante.setCarte(nouvelleDonnees.getCarte());

        return venteRepository.save(existante);
    }

    @Transactional
    public void supprimer(Long id) {
        if (!venteRepository.existsById(id)) {
            throw new ResourceNotFoundException("Ventes mensuelles introuvables avec l'ID : " + id);
        }
        venteRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Double getTotalVentesAnnee(Integer annee) {
        Double total = venteRepository.getTotalVentesAnnee(annee);
        return total != null ? total : 0.0;
    }
}
