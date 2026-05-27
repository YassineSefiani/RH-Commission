package com.abcdis.commission.service;

import com.abcdis.commission.dto.CalculRequest;
import com.abcdis.commission.dto.CalculResponse;
import com.abcdis.commission.model.Contrainte;
import com.abcdis.commission.model.HistoriqueCalcul;
import com.abcdis.commission.repository.ContrainteRepository;
import com.abcdis.commission.repository.HistoriqueCalculRepository;
import com.abcdis.commission.repository.NoteTriageRepository;
import com.abcdis.commission.repository.ObjectifCommercialRepository;
import com.abcdis.commission.repository.RealisationCommercialeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CalculService {

    private static final double SEUIL_PENALITE     = 0.8;  // 80% de l'objectif
    private static final double TAUX_PENALITE       = 0.05; // 5% de déduction
    private static final double OBJECTIF_LIVRAISONS = 100.0;

    private final ContrainteRepository contrainteRepository;
    private final HistoriqueCalculRepository historiqueRepository;
    private final ObjectifCommercialRepository objectifRepository;
    private final RealisationCommercialeRepository realisationRepository;
    private final NoteTriageRepository noteTriageRepository;

    /**
     * Calcule le salaire final et persiste dans l'historique.
     *
     * <p>Anti-redondance : si {@code matricule + periode + carte} sont fournis,
     * recherche un calcul existant pour cette clé. Si la source (Obj/Real/Triage)
     * n'a pas été modifiée depuis le calcul précédent, retourne le calcul existant
     * marqué {@code reutilise = true} sans ré-insertion.</p>
     */
    @Transactional
    public CalculResponse calculerCommission(CalculRequest request) {
        LocalDateTime maintenant = LocalDateTime.now();

        // ─── Anti-redondance ──────────────────────────────────────────────────
        String matricule = blankToNull(request.getMatricule());
        String periode   = blankToNull(request.getPeriode());
        Integer mois     = parserMois(periode, maintenant);
        Integer annee    = parserAnnee(periode, maintenant);
        String periodeNorm = String.format("%04d-%02d", annee, mois);
        boolean forcer = Boolean.TRUE.equals(request.getForcerRecalcul());

        if (matricule != null && !forcer) {
            Optional<HistoriqueCalcul> existingOpt = historiqueRepository
                    .findFirstByMatriculeAndMoisAndAnneeAndCarteOrderByDateCalculDesc(
                            matricule, mois, annee, request.getCarte());

            if (existingOpt.isPresent()) {
                HistoriqueCalcul existing = existingOpt.get();
                LocalDateTime sourceMax = maxSourceVersion(periodeNorm, request.getCarte(), matricule);

                boolean valide = sourceMax == null
                        || (existing.getSourceVersion() != null && !existing.getSourceVersion().isBefore(sourceMax));
                if (valide) {
                    log.info("Calcul réutilisé pour matricule={} periode={} carte={}",
                            matricule, periodeNorm, request.getCarte());
                    return toReusedResponse(existing);
                }
                log.info("Source modifiée — recalcul forcé pour matricule={} periode={} carte={}",
                        matricule, periodeNorm, request.getCarte());
            }
        }

        // ─── Calcul ────────────────────────────────────────────────────────────
        List<Contrainte> contraintes = contrainteRepository
                .findByCarteAndActifTrue(request.getCarte());

        double totalVentes = request.getTotalVentes() != null ? request.getTotalVentes() : 0.0;
        double salaireBase = request.getSalaireBase();
        double commissions = 0.0;
        double bonus       = 0.0;
        double penalites   = 0.0;
        List<String> contraintesAppliquees = new ArrayList<>();

        for (Contrainte c : contraintes) {
            switch (c.getTypeValeur()) {
                case "POURCENTAGE" -> {
                    double montant = totalVentes * (c.getValeur() / 100.0);
                    commissions += montant;
                    contraintesAppliquees.add(
                            c.getNom() + " → +" + String.format("%.2f", montant) + " MAD");
                }
                case "FIXE" -> {
                    if (evaluerCondition(c.getCondition(), totalVentes)) {
                        bonus += c.getValeur();
                        contraintesAppliquees.add(
                                c.getNom() + " → +" + String.format("%.2f", c.getValeur()) + " MAD");
                    }
                }
                default -> log.warn("Type de contrainte inconnu : {}", c.getTypeValeur());
            }
        }

        if (request.getVolumeLivraisons() != null && request.getVolumeLivraisons() > 0) {
            double pct = request.getVolumeLivraisons() / OBJECTIF_LIVRAISONS;
            if (pct < SEUIL_PENALITE) {
                penalites = salaireBase * TAUX_PENALITE;
                contraintesAppliquees.add(String.format(
                        "Pénalité volume livraisons (%.0f%% < 80%%) → -%.2f MAD",
                        pct * 100, penalites));
            }
        }

        double salaireFinal = Math.max(0, salaireBase + commissions + bonus - penalites);

        LocalDateTime sourceVersion = matricule != null
                ? maxSourceVersion(periodeNorm, request.getCarte(), matricule)
                : null;

        HistoriqueCalcul historique = HistoriqueCalcul.builder()
                .nomEmploye(request.getNomEmploye())
                .roleEmploye(request.getRoleEmploye())
                .carte(request.getCarte())
                .matricule(matricule)
                .periode(periodeNorm)
                .salaireBase(salaireBase)
                .totalVentes(totalVentes)
                .commissions(commissions)
                .bonus(bonus)
                .penalites(penalites)
                .salaireFinal(salaireFinal)
                .dateCalcul(maintenant)
                .mois(mois)
                .annee(annee)
                .contraintesAppliquees(contraintesAppliquees.toString())
                .sourceVersion(sourceVersion)
                .build();

        historiqueRepository.save(historique);

        return CalculResponse.builder()
                .nomEmploye(request.getNomEmploye())
                .carte(request.getCarte())
                .matricule(matricule)
                .periode(periodeNorm)
                .salaireBase(salaireBase)
                .totalVentes(totalVentes)
                .commissions(commissions)
                .bonus(bonus)
                .penalites(penalites)
                .salaireFinal(salaireFinal)
                .contraintesAppliquees(contraintesAppliquees)
                .dateCalcul(maintenant)
                .reutilise(false)
                .build();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private CalculResponse toReusedResponse(HistoriqueCalcul h) {
        List<String> contraintes = h.getContraintesAppliquees() != null
                ? Arrays.asList(h.getContraintesAppliquees().replaceAll("^\\[|]$", "").split(",\\s*"))
                : List.of();
        return CalculResponse.builder()
                .nomEmploye(h.getNomEmploye())
                .carte(h.getCarte())
                .matricule(h.getMatricule())
                .periode(h.getPeriode())
                .salaireBase(h.getSalaireBase())
                .totalVentes(h.getTotalVentes())
                .commissions(h.getCommissions())
                .bonus(h.getBonus())
                .penalites(h.getPenalites())
                .salaireFinal(h.getSalaireFinal())
                .contraintesAppliquees(contraintes)
                .dateCalcul(h.getDateCalcul())
                .reutilise(true)
                .build();
    }

    /** Retourne la date la plus récente parmi Objectif/Realisation/Triage de la même clé. */
    private LocalDateTime maxSourceVersion(String periode, String carte, String matricule) {
        LocalDateTime maxObj = objectifRepository.maxDerniereMaj(periode, carte, matricule);
        LocalDateTime maxReal = realisationRepository.maxDerniereMaj(periode, carte, matricule);
        LocalDateTime maxTri = noteTriageRepository.maxDerniereMaj(periode, matricule);
        return Arrays.stream(new LocalDateTime[] { maxObj, maxReal, maxTri })
                .filter(x -> x != null)
                .max(LocalDateTime::compareTo)
                .orElse(null);
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }

    /** Parse "YYYY-MM" → mois ; fallback sur la date courante. */
    private static Integer parserMois(String periode, LocalDateTime maintenant) {
        if (periode != null && periode.matches("\\d{4}-\\d{2}")) {
            return Integer.parseInt(periode.substring(5, 7));
        }
        return maintenant.getMonthValue();
    }

    private static Integer parserAnnee(String periode, LocalDateTime maintenant) {
        if (periode != null && periode.matches("\\d{4}-\\d{2}")) {
            return Integer.parseInt(periode.substring(0, 4));
        }
        return maintenant.getYear();
    }

    private boolean evaluerCondition(String condition, double totalVentes) {
        if (condition == null || condition.isBlank()) return true;
        try {
            String c = condition.trim().toLowerCase();
            if (c.contains(">=")) return totalVentes >= parseSeuilApres(c, ">=");
            if (c.contains(">"))  return totalVentes >  parseSeuilApres(c, ">");
            if (c.contains("<=")) return totalVentes <= parseSeuilApres(c, "<=");
            if (c.contains("<"))  return totalVentes <  parseSeuilApres(c, "<");
            if (c.contains("="))  return totalVentes == parseSeuilApres(c, "=");
        } catch (NumberFormatException | ArrayIndexOutOfBoundsException e) {
            // Condition malformée — règle conservatrice : NE PAS appliquer la contrainte
            // (sinon un bonus injustifié peut être attribué).
            log.warn("Condition de contrainte non parseable : '{}' — IGNORÉE (politique sécurité)", condition);
            return false;
        }
        return true;
    }

    private double parseSeuilApres(String condition, String operateur) {
        return Double.parseDouble(condition.split(operateur)[1].trim());
    }
}
