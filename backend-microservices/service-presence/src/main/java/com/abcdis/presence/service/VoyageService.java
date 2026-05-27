package com.abcdis.presence.service;

import com.abcdis.presence.exception.ResourceNotFoundException;
import com.abcdis.presence.model.FichePresence;
import com.abcdis.presence.model.Voyage;
import com.abcdis.presence.repository.FichePresenceRepository;
import com.abcdis.presence.repository.VoyageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VoyageService {

    private final VoyageRepository voyageRepository;
    private final FichePresenceRepository ficheRepository;

    @Transactional(readOnly = true)
    public List<Voyage> listerParFiche(Long ficheId) {
        return voyageRepository.findByFichePresenceId(ficheId);
    }

    @Transactional // atomique : sauvegarde voyage + mise à jour compteur fiche
    public Voyage ajouterVoyage(Long ficheId, Voyage voyage) {
        FichePresence fiche = ficheRepository.findById(ficheId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Fiche de présence introuvable avec l'ID : " + ficheId));

        voyage.setFichePresence(fiche);
        Voyage saved = voyageRepository.save(voyage);

        // Mise à jour du compteur de voyages dans la fiche
        int count = (fiche.getNombreVoyages() != null ? fiche.getNombreVoyages() : 0) + 1;
        fiche.setNombreVoyages(count);
        ficheRepository.save(fiche);

        return saved;
    }

    @Transactional
    public Voyage modifierVoyage(Long id, Voyage nouvelleDonnees) {
        Voyage existant = voyageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Voyage introuvable avec l'ID : " + id));

        if (nouvelleDonnees.getDestination()  != null) existant.setDestination(nouvelleDonnees.getDestination());
        if (nouvelleDonnees.getMontantVentes() != null) existant.setMontantVentes(nouvelleDonnees.getMontantVentes());
        if (nouvelleDonnees.getNombreColis()  != null) existant.setNombreColis(nouvelleDonnees.getNombreColis());
        if (nouvelleDonnees.getHeureDepart()  != null) existant.setHeureDepart(nouvelleDonnees.getHeureDepart());
        if (nouvelleDonnees.getHeureRetour()  != null) existant.setHeureRetour(nouvelleDonnees.getHeureRetour());
        if (nouvelleDonnees.getObservations() != null) existant.setObservations(nouvelleDonnees.getObservations());

        return voyageRepository.save(existant);
    }

    /**
     * Suppression dans @Transactional — garantit que l'accès à fichePresence (LAZY)
     * se fait dans la même session Hibernate. Évite LazyInitializationException.
     */
    @Transactional
    public void supprimerVoyage(Long id) {
        Voyage voyage = voyageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Voyage introuvable avec l'ID : " + id));

        // Chargement de la fiche via repository — pas via le proxy LAZY du voyage
        Long ficheId = voyage.getFichePresence().getId();
        ficheRepository.findById(ficheId).ifPresent(fiche -> {
            if (fiche.getNombreVoyages() != null && fiche.getNombreVoyages() > 0) {
                fiche.setNombreVoyages(fiche.getNombreVoyages() - 1);
                ficheRepository.save(fiche);
            }
        });

        voyageRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Double getTotalVentesFiche(Long ficheId) {
        Double total = voyageRepository.getTotalVentesFiche(ficheId);
        return total != null ? total : 0.0;
    }
}
