package com.abcdis.personnel.service;

import com.abcdis.personnel.dto.PersonnelStatsDTO;
import com.abcdis.personnel.exception.DuplicateResourceException;
import com.abcdis.personnel.exception.ResourceNotFoundException;
import com.abcdis.personnel.model.Personnel;
import com.abcdis.personnel.repository.PersonnelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PersonnelService {

    private final PersonnelRepository personnelRepository;

    @Transactional(readOnly = true)
    public List<Personnel> listerTous() {
        return personnelRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Personnel> listerActifs() {
        return personnelRepository.findByActifTrue();
    }

    @Transactional(readOnly = true)
    public Optional<Personnel> trouverParId(Long id) {
        return personnelRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<Personnel> trouverParMatricule(String matricule) {
        return personnelRepository.findByMatricule(matricule);
    }

    @Transactional(readOnly = true)
    public List<Personnel> trouverParCarte(String carte) {
        return personnelRepository.findByCarte(carte);
    }

    @Transactional(readOnly = true)
    public List<Personnel> trouverParVille(String ville) {
        return personnelRepository.findByVille(ville);
    }

    @Transactional(readOnly = true)
    public List<Personnel> trouverParContrat(String typeContrat) {
        return personnelRepository.findByNatureContrat(typeContrat);
    }

    @Transactional(readOnly = true)
    public List<Personnel> rechercherParNom(String terme) {
        return personnelRepository.rechercherParNom(terme);
    }

    @Transactional
    public Personnel creer(Personnel personnel) {
        if (personnelRepository.existsByMatricule(personnel.getMatricule())) {
            throw new DuplicateResourceException(
                    "Matricule déjà utilisé : " + personnel.getMatricule());
        }
        return personnelRepository.save(personnel);
    }

    @Transactional
    public Personnel modifier(Long id, Personnel modifications) {
        Personnel existant = personnelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Employé introuvable avec l'ID : " + id));

        // Patch partiel : seuls les champs non-null sont mis à jour
        if (modifications.getNom() != null)           existant.setNom(modifications.getNom());
        if (modifications.getPrenom() != null)         existant.setPrenom(modifications.getPrenom());
        if (modifications.getCarte() != null)          existant.setCarte(modifications.getCarte());
        if (modifications.getFonction() != null)       existant.setFonction(modifications.getFonction());
        if (modifications.getRole() != null)           existant.setRole(modifications.getRole());
        if (modifications.getNumero() != null)         existant.setNumero(modifications.getNumero());
        if (modifications.getNatureContrat() != null)  existant.setNatureContrat(modifications.getNatureContrat());
        if (modifications.getVille() != null)          existant.setVille(modifications.getVille());

        return personnelRepository.save(existant);
    }

    @Transactional
    public void supprimer(Long id) {
        if (!personnelRepository.existsById(id)) {
            throw new ResourceNotFoundException("Employé introuvable avec l'ID : " + id);
        }
        personnelRepository.deleteById(id);
    }

    @Transactional
    public Personnel basculerStatut(Long id) {
        Personnel personnel = personnelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employé introuvable : " + id));
        personnel.setActif(!personnel.isActif());
        return personnelRepository.save(personnel);
    }

    @Transactional(readOnly = true)
    public PersonnelStatsDTO obtenirStatistiques() {
        return new PersonnelStatsDTO(
                personnelRepository.count(),
                personnelRepository.countByActifTrue(),
                personnelRepository.countByActifFalse()
        );
    }
}
