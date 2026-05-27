package com.abcdis.presence.service;

import com.abcdis.presence.exception.ResourceNotFoundException;
import com.abcdis.presence.model.FichePresence;
import com.abcdis.presence.repository.FichePresenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FichePresenceService {

    private final FichePresenceRepository ficheRepository;

    @Transactional(readOnly = true)
    public List<FichePresence> listerToutes() {
        return ficheRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<FichePresence> listerParDate(LocalDate date) {
        return ficheRepository.findByDate(date);
    }

    @Transactional(readOnly = true)
    public List<FichePresence> listerParPeriode(LocalDate debut, LocalDate fin) {
        return ficheRepository.findByDateBetween(debut, fin);
    }

    @Transactional(readOnly = true)
    public List<FichePresence> listerParLivreur(String nomLivreur) {
        return ficheRepository.rechercherParNomLivreur(nomLivreur);
    }

    @Transactional(readOnly = true)
    public List<FichePresence> listerParMoisAnnee(int mois, int annee) {
        return ficheRepository.findByMoisAndAnnee(mois, annee);
    }

    @Transactional(readOnly = true)
    public FichePresence trouverParId(Long id) {
        return ficheRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Fiche de présence introuvable avec l'ID : " + id));
    }

    @Transactional
    public FichePresence creer(FichePresence fiche) {
        return ficheRepository.save(fiche);
    }

    @Transactional
    public FichePresence modifier(Long id, FichePresence nouvelleDonnees) {
        FichePresence existante = trouverParId(id);
        if (nouvelleDonnees.getMatriculeCamion() != null) existante.setMatriculeCamion(nouvelleDonnees.getMatriculeCamion());
        if (nouvelleDonnees.getCanal()           != null) existante.setCanal(nouvelleDonnees.getCanal());
        if (nouvelleDonnees.getDate()            != null) existante.setDate(nouvelleDonnees.getDate());

        // Livreur 1
        if (nouvelleDonnees.getLivreur1Id()        != null) existante.setLivreur1Id(nouvelleDonnees.getLivreur1Id());
        if (nouvelleDonnees.getLivreur1Matricule() != null) existante.setLivreur1Matricule(nouvelleDonnees.getLivreur1Matricule());
        if (nouvelleDonnees.getLivreur1Nom()       != null) existante.setLivreur1Nom(nouvelleDonnees.getLivreur1Nom());
        if (nouvelleDonnees.getLivreur1Prenom()    != null) existante.setLivreur1Prenom(nouvelleDonnees.getLivreur1Prenom());

        // Livreur 2
        if (nouvelleDonnees.getLivreur2Id()        != null) existante.setLivreur2Id(nouvelleDonnees.getLivreur2Id());
        if (nouvelleDonnees.getLivreur2Matricule() != null) existante.setLivreur2Matricule(nouvelleDonnees.getLivreur2Matricule());
        if (nouvelleDonnees.getLivreur2Nom()       != null) existante.setLivreur2Nom(nouvelleDonnees.getLivreur2Nom());
        if (nouvelleDonnees.getLivreur2Prenom()    != null) existante.setLivreur2Prenom(nouvelleDonnees.getLivreur2Prenom());

        // Livreur 3
        if (nouvelleDonnees.getLivreur3Id()        != null) existante.setLivreur3Id(nouvelleDonnees.getLivreur3Id());
        if (nouvelleDonnees.getLivreur3Matricule() != null) existante.setLivreur3Matricule(nouvelleDonnees.getLivreur3Matricule());
        if (nouvelleDonnees.getLivreur3Nom()       != null) existante.setLivreur3Nom(nouvelleDonnees.getLivreur3Nom());
        if (nouvelleDonnees.getLivreur3Prenom()    != null) existante.setLivreur3Prenom(nouvelleDonnees.getLivreur3Prenom());

        if (nouvelleDonnees.getHeureDepart()     != null) existante.setHeureDepart(nouvelleDonnees.getHeureDepart());
        if (nouvelleDonnees.getHeureRetour()     != null) existante.setHeureRetour(nouvelleDonnees.getHeureRetour());
        if (nouvelleDonnees.getObservations()    != null) existante.setObservations(nouvelleDonnees.getObservations());
        return ficheRepository.save(existante);
    }

    @Transactional
    public void supprimer(Long id) {
        trouverParId(id); // lève ResourceNotFoundException si absent → 404 via handler
        ficheRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obtenirStatistiques(int mois, int annee) {
        List<FichePresence> fiches = listerParMoisAnnee(mois, annee);
        long livreursDifferents = fiches.stream()
                .flatMap(f -> java.util.stream.Stream.of(
                        f.getLivreur1Matricule(),
                        f.getLivreur2Matricule(),
                        f.getLivreur3Matricule()))
                .filter(m -> m != null && !m.isBlank())
                .distinct()
                .count();
        int totalVoyages = fiches.stream()
                .mapToInt(f -> f.getNombreVoyages() != null ? f.getNombreVoyages() : 0)
                .sum();
        return Map.of(
                "mois",             mois,
                "annee",            annee,
                "totalFiches",      fiches.size(),
                "livreursPrésents", livreursDifferents,
                "totalVoyages",     totalVoyages
        );
    }
}
