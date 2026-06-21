package com.abcdis.commission.service;

import com.abcdis.commission.dto.HistoriqueCreationRequest;
import com.abcdis.commission.exception.ResourceNotFoundException;
import com.abcdis.commission.model.HistoriqueCalcul;
import com.abcdis.commission.repository.HistoriqueCalculRepository;
import com.abcdis.commission.repository.NoteTriageRepository;
import com.abcdis.commission.repository.ObjectifCommercialRepository;
import com.abcdis.commission.repository.RealisationCommercialeRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Service dédié à la consultation et gestion de l'historique des calculs.
 * Extrait de CalculService pour respecter le principe de responsabilité unique (SRP).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HistoriqueService {

    private final HistoriqueCalculRepository historiqueRepository;
    private final ObjectifCommercialRepository objectifRepository;
    private final RealisationCommercialeRepository realisationRepository;
    private final NoteTriageRepository noteTriageRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Transactional(readOnly = true)
    public List<HistoriqueCalcul> listerHistorique() {
        // Garde-fou : limite à 1000 derniers pour éviter OOM sur table massive.
        return historiqueRepository
                .findAllByOrderByDateCalculDesc(org.springframework.data.domain.PageRequest.of(0, 1000))
                .getContent();
    }

    @Transactional(readOnly = true)
    public List<HistoriqueCalcul> rechercherParNom(String nom) {
        return historiqueRepository.findByNomEmployeContainingIgnoreCase(nom);
    }

    @Transactional(readOnly = true)
    public List<HistoriqueCalcul> filtrerParMoisAnnee(Integer mois, Integer annee) {
        return historiqueRepository.findByMoisAndAnnee(mois, annee);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obtenirStatistiques() {
        int anneeActuelle = LocalDateTime.now().getYear();
        Double masseSalariale     = historiqueRepository.getMasseSalarialeTotal();
        Double totalCommissions   = historiqueRepository.getTotalCommissionsParAnnee(anneeActuelle);

        return Map.of(
                "totalCalculs",      historiqueRepository.count(),
                "masseSalariale",    masseSalariale    != null ? masseSalariale    : 0.0,
                "totalCommissions",  totalCommissions  != null ? totalCommissions  : 0.0,
                "annee",             anneeActuelle
        );
    }

    @Transactional(readOnly = true)
    public HistoriqueCalcul trouverParId(Long id) {
        return historiqueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Calcul introuvable avec l'ID : " + id));
    }

    @Transactional
    public HistoriqueCalcul enregistrer(HistoriqueCreationRequest request) {
        String contraintesJson = toJsonString(request.constraintsApplied());

        LocalDateTime now = LocalDateTime.now();
        String matricule = blankToNull(request.matricule());
        String periode   = blankToNull(request.periode());
        boolean forcer   = Boolean.TRUE.equals(request.forcerRecalcul());

        Integer mois  = parserMois(periode, now);
        Integer annee = parserAnnee(periode, now);
        String periodeNorm = String.format("%04d-%02d", annee, mois);
        String carte = request.carte() != null ? request.carte() : "";

        // Anti-redondance : si calcul existant pour (matricule, mois, annee, carte) et
        // source inchangée, on retourne l'existant sans nouvelle insertion.
        if (matricule != null && !forcer) {
            Optional<HistoriqueCalcul> existing = historiqueRepository
                    .findFirstByMatriculeAndMoisAndAnneeAndCarteOrderByDateCalculDesc(
                            matricule, mois, annee, carte);
            if (existing.isPresent()) {
                LocalDateTime sourceMax = maxSourceVersion(periodeNorm, carte, matricule);
                boolean valide = sourceMax == null
                        || (existing.get().getSourceVersion() != null
                            && !existing.get().getSourceVersion().isBefore(sourceMax));
                if (valide) {
                    log.info("Historique réutilisé pour matricule={} periode={} carte={}",
                            matricule, periodeNorm, carte);
                    return existing.get();
                }
                // Source modifiée → on supprime l'ancien pour conserver un seul calcul valide
                historiqueRepository.delete(existing.get());
            }
        }

        LocalDateTime sourceVersion = matricule != null
                ? maxSourceVersion(periodeNorm, carte, matricule)
                : null;

        HistoriqueCalcul historique = HistoriqueCalcul.builder()
                .nomEmploye(request.employeeName() != null ? request.employeeName() : "Inconnu")
                .roleEmploye(request.employeeRole())
                .carte(carte)
                .matricule(matricule)
                .periode(periodeNorm)
                .salaireBase(request.baseSalary() != null ? request.baseSalary() : 0.0)
                .totalVentes(request.totalSales() != null ? request.totalSales() : 0.0)
                .commissions(request.commissions() != null ? request.commissions() : 0.0)
                .bonus(request.bonuses() != null ? request.bonuses() : 0.0)
                .penalites(request.penalties() != null ? request.penalties() : 0.0)
                .salaireFinal(request.finalSalary() != null ? request.finalSalary() : 0.0)
                .contraintesAppliquees(contraintesJson)
                .details(request.details())
                .dateCalcul(now)
                .mois(mois)
                .annee(annee)
                .sourceVersion(sourceVersion)
                .batchId(request.batchId())
                .simulationName(request.simulationName())
                .isArchived(request.isArchived() != null ? request.isArchived() : false) // ✨ Ajout ici
                .build();

        return historiqueRepository.save(historique);
    }

    private LocalDateTime maxSourceVersion(String periode, String carte, String matricule) {
        LocalDateTime maxObj  = objectifRepository.maxDerniereMaj(periode, carte, matricule);
        LocalDateTime maxReal = realisationRepository.maxDerniereMaj(periode, carte, matricule);
        LocalDateTime maxTri  = noteTriageRepository.maxDerniereMaj(periode, matricule);
        return Arrays.stream(new LocalDateTime[] { maxObj, maxReal, maxTri })
                .filter(x -> x != null)
                .max(LocalDateTime::compareTo)
                .orElse(null);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    private static Integer parserMois(String periode, LocalDateTime now) {
        if (periode != null && periode.matches("\\d{4}-\\d{2}")) {
            return Integer.parseInt(periode.substring(5, 7));
        }
        return now.getMonthValue();
    }

    private static Integer parserAnnee(String periode, LocalDateTime now) {
        if (periode != null && periode.matches("\\d{4}-\\d{2}")) {
            return Integer.parseInt(periode.substring(0, 4));
        }
        return now.getYear();
    }

    @Transactional
    public void supprimerCalcul(Long id) {
        if (!historiqueRepository.existsById(id)) {
            throw new ResourceNotFoundException("Calcul introuvable avec l'ID : " + id);
        }
        historiqueRepository.deleteById(id);
    }

    @Transactional
    public void viderHistorique() {
        historiqueRepository.deleteAll();
    }

    @Transactional
    public void archiverCalcul(Long id) {
        HistoriqueCalcul calcul = trouverParId(id);
        calcul.setIsArchived(true);
        historiqueRepository.save(calcul);
        log.info("Calcul ID {} validé et archivé avec succès.", id);
    }

    /**
     * Sérialise un Object (List, Map, String JSON déjà sérialisé...) en JSON valide.
     * Évite le `.toString()` Java qui produit "[a, b, c]" non-JSON.
     */
    private String toJsonString(Object value) {
        if (value == null) return "[]";
        if (value instanceof String s) {
            String trimmed = s.trim();
            if (trimmed.isEmpty()) return "[]";
            // Si déjà du JSON valide, garder tel quel
            try {
                objectMapper.readTree(trimmed);
                return trimmed;
            } catch (JsonProcessingException ignored) {
                // Pas du JSON — encapsuler dans une chaîne JSON
                try {
                    return objectMapper.writeValueAsString(trimmed);
                } catch (JsonProcessingException e) {
                    log.warn("Impossible de sérialiser la chaîne", e);
                    return "[]";
                }
            }
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            log.warn("Impossible de sérialiser {}", value.getClass(), e);
            return "[]";
        }
    }
}
