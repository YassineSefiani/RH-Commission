package com.abcdis.hrapp.service;

import com.abcdis.hrapp.dto.*;
import com.abcdis.hrapp.model.*;
import com.abcdis.hrapp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class CalculationService {

    @Autowired private PersonnelRepository personnelRepository;
    @Autowired private VolumeDistributionRepository volumeRepo;
    @Autowired private NoteTriageRepository triageRepo;
    @Autowired private ObjectifCommercialRepository objectifRepo;
    @Autowired private RealisationCommercialeRepository realisationRepo;

    // ── CHECK ─────────────────────────────────────────────────────────────────

    public DataCheckResponse check(String carte, String periode) {
        DataCheckResponse response = new DataCheckResponse();
        List<String> manquantes = new ArrayList<>();

        List<Personnel> equipe = personnelRepository.findByCarteAndActifTrue(carte);

        if (equipe.isEmpty()) {
            manquantes.add("Aucun employé actif trouvé pour la carte " + carte);
            response.setPret(false);
            response.setDonneesManquantes(manquantes);
            return response;
        }

        String carteUp = carte.toUpperCase();
        if (carteUp.equals("COKE")) {
            checkCoke(equipe, periode, manquantes);
        } else {
            checkCommercial(equipe, carte, periode, manquantes);
        }

        response.setPret(manquantes.isEmpty());
        response.setDonneesManquantes(manquantes);
        return response;
    }

    private void checkCoke(List<Personnel> equipe, String periode, List<String> manquantes) {
        for (Personnel emp : equipe) {
            if (isLivreurOuAide(emp.getRole())) {
                if (!volumeRepo.existsByPeriodeAndMatricule(periode, emp.getMatricule()))
                    manquantes.add("Volume distribué manquant pour " + emp.getNom() + " " + emp.getPrenom()
                            + " (" + emp.getMatricule() + ") — période " + periode);
                if ("CDI".equalsIgnoreCase(emp.getNatureContrat())
                        && !triageRepo.existsByPeriodeAndMatricule(periode, emp.getMatricule()))
                    manquantes.add("Note de triage manquante pour " + emp.getNom() + " " + emp.getPrenom()
                            + " (" + emp.getMatricule() + ") — période " + periode);
            }
        }
    }

    private void checkCommercial(List<Personnel> equipe, String carte, String periode, List<String> manquantes) {
        for (Personnel emp : equipe) {
            if (!objectifRepo.existsByPeriodeAndCarteIgnoreCaseAndMatricule(periode, carte, emp.getMatricule()))
                manquantes.add("Objectif manquant pour " + emp.getNom() + " " + emp.getPrenom()
                        + " (" + emp.getMatricule() + ") — période " + periode);
            if (!realisationRepo.existsByPeriodeAndCarteIgnoreCaseAndMatricule(periode, carte, emp.getMatricule()))
                manquantes.add("Réalisation manquante pour " + emp.getNom() + " " + emp.getPrenom()
                        + " (" + emp.getMatricule() + ") — période " + periode);
        }
    }

    // ── CALCUL ────────────────────────────────────────────────────────────────

    public CalculationResponse calculate(CalculationRequest request) {
        String carte = request.getCarte();
        String periode = request.getPeriode();
        List<Personnel> equipe = personnelRepository.findByCarteAndActifTrue(carte);
        List<EmployeeResult> resultats = new ArrayList<>();

        String carteUp = carte.toUpperCase();
        if (carteUp.contains("COCA") || carteUp.equals("COKE")) {
            for (Personnel emp : equipe) resultats.add(calculerCoke(emp, periode));
        } else if (carteUp.contains("FERRERO")) {
            boolean tousAuDessus100 = equipe.stream()
                    .allMatch(emp -> getRatio(emp, carte, periode) > 1.0);
            for (Personnel emp : equipe) resultats.add(calculerFerrero(emp, carte, periode, tousAuDessus100));
        } else {
            for (Personnel emp : equipe) resultats.add(calculerCommercial(emp, carte, periode));
        }

        double totalEquipe = resultats.stream().mapToDouble(EmployeeResult::getFinalSalary).sum();

        CalculationResponse resp = new CalculationResponse();
        resp.setPeriode(periode);
        resp.setCarte(carte);
        resp.setResultats(resultats);
        resp.setTotalEquipe(round2(totalEquipe));
        return resp;
    }

    // ── COKE R01/R02/R03 ─────────────────────────────────────────────────────

    private EmployeeResult calculerCoke(Personnel emp, String periode) {
        List<ResultDetail> detail = new ArrayList<>();
        double commissions = 0, bonuses = 0;

        Optional<VolumeDistribution> volOpt = volumeRepo.findByPeriodeAndMatricule(periode, emp.getMatricule());

        if (volOpt.isPresent() && isLivreurOuAide(emp.getRole())) {
            VolumeDistribution vol = volOpt.get();

            // R01 — Commission distribution
            double taux = tauxDistribution(emp.getNatureContrat(), emp.getRole());
            double r01 = round2(vol.getVolumeCharge() * taux);
            if (r01 > 0) {
                detail.add(new ResultDetail("R01", "Commission distribution", r01));
                commissions += r01;
            }

            // R02 — Commission retour (CDI Livreur, > 15 jours)
            if ("CDI".equalsIgnoreCase(emp.getNatureContrat())
                    && emp.getRole() != null && emp.getRole().equalsIgnoreCase("Livreur")
                    && vol.getJouresTravailles() > 15) {
                double tauxRetour = vol.getVolumeRetourne() / vol.getVolumeCharge();
                double r02 = commissionRetour(tauxRetour);
                if (r02 > 0) {
                    detail.add(new ResultDetail("R02", "Commission retour (" + pct(tauxRetour) + ")", r02));
                    commissions += r02;
                }
            }

            // R03 — Commission triage (CDI, > 15 jours)
            if ("CDI".equalsIgnoreCase(emp.getNatureContrat()) && vol.getJouresTravailles() > 15) {
                Optional<NoteTriage> triageOpt = triageRepo.findByPeriodeAndMatricule(periode, emp.getMatricule());
                if (triageOpt.isPresent() && triageOpt.get().getNote() >= 0.70) {
                    detail.add(new ResultDetail("R03", "Commission triage (" + pct(triageOpt.get().getNote()) + ")", 200.0));
                    bonuses += 200.0;
                }
            }
        }

        return buildResult(emp, commissions, bonuses, 0, detail);
    }

    private double tauxDistribution(String contrat, String role) {
        if (role == null) return 0;
        boolean cdi = "CDI".equalsIgnoreCase(contrat);
        String r = role.toLowerCase();
        if (r.equals("livreur")) return cdi ? 0.18 : 0.12;
        if (r.equals("livreur gms")) return 0.11;
        if (r.startsWith("aide livreur")) return cdi ? 0.12 : 0.08;
        return 0.0;
    }

    private double commissionRetour(double taux) {
        if (taux < 0.01) return 250.0;
        if (taux < 0.02) return 150.0;
        return 0.0;
    }

    // ── WALLS / MAGNUM R05/R06 ────────────────────────────────────────────────

    private EmployeeResult calculerCommercial(Personnel emp, String carte, String periode) {
        List<ResultDetail> detail = new ArrayList<>();
        double commissions = 0;

        Optional<ObjectifCommercial> objOpt = objectifRepo.findByPeriodeAndCarteIgnoreCaseAndMatricule(periode, carte, emp.getMatricule());
        Optional<RealisationCommerciale> realOpt = realisationRepo.findByPeriodeAndCarteIgnoreCaseAndMatricule(periode, carte, emp.getMatricule());

        if (objOpt.isEmpty() || realOpt.isEmpty()) return buildResult(emp, 0, 0, 0, detail);

        double target = objOpt.get().getTarget();
        double ca = realOpt.get().getCaRealise();
        double ratio = target > 0 ? ca / target : 0;
        String roleLower = emp.getRole() != null ? emp.getRole().toLowerCase() : "";

        if (roleLower.contains("vendeur") && !roleLower.contains("gros")) {
            double r05 = round2(ca * 0.015);
            detail.add(new ResultDetail("R05", "Commission vendeur (1,5% CA)", r05));
            commissions = r05;
        } else if (roleLower.contains("superviseur") || roleLower.contains("area")) {
            String canal = emp.getFonction() != null ? emp.getFonction() : "";
            double r06 = round2(commissionEncadrement(roleLower, canal, ca, ratio));
            if (r06 > 0) {
                detail.add(new ResultDetail("R06", "Commission encadrement (" + pct(ratio) + ")", r06));
                commissions = r06;
            }
        }

        return buildResult(emp, commissions, 0, 0, detail);
    }

    private double commissionEncadrement(String roleLower, String canal, double ca, double ratio) {
        String canalUp = canal != null ? canal.toUpperCase() : "";
        if (roleLower.contains("area")) {
            if (ratio > 1.00) return ca * 0.007;
            if (ratio > 0.90) return ca * 0.006;
            if (ratio > 0.80) return ca * 0.005;
            if (ratio > 0.70) return ca * 0.004;
            return 0;
        }
        if (canalUp.contains("MT")) {
            if (ratio > 1.00) return 10_000;
            if (ratio > 0.90) return 8_000;
            if (ratio > 0.80) return 6_000;
            if (ratio > 0.70) return 4_000;
            return 0;
        }
        if (canalUp.contains("HORECA") || canalUp.contains("ECOM")) {
            return ratio > 0.70 ? ca * 0.006 : 0;
        }
        if (ratio > 1.00) return ca * 0.010;
        if (ratio > 0.90) return ca * 0.009;
        if (ratio > 0.80) return ca * 0.008;
        if (ratio > 0.70) return ca * 0.007;
        return 0;
    }

    // ── FERRERO R07 ───────────────────────────────────────────────────────────

    private EmployeeResult calculerFerrero(Personnel emp, String carte, String periode, boolean tousAuDessus100) {
        List<ResultDetail> detail = new ArrayList<>();
        double commissions = 0, bonuses = 0;

        Optional<ObjectifCommercial> objOpt = objectifRepo.findByPeriodeAndCarteIgnoreCaseAndMatricule(periode, carte, emp.getMatricule());
        Optional<RealisationCommerciale> realOpt = realisationRepo.findByPeriodeAndCarteIgnoreCaseAndMatricule(periode, carte, emp.getMatricule());

        if (objOpt.isEmpty() || realOpt.isEmpty()) return buildResult(emp, 0, 0, 0, detail);

        double target = objOpt.get().getTarget();
        double ca = realOpt.get().getCaRealise();
        double ratio = target > 0 ? ca / target : 0;
        String roleLower = emp.getRole() != null ? emp.getRole().toLowerCase() : "";

        double r07 = round2(commissionFerrero(roleLower, ca, ratio));
        if (r07 > 0) {
            detail.add(new ResultDetail("R07", "Commission Ferrero (" + pct(ratio) + ")", r07));
            commissions = r07;
        }
        if (tousAuDessus100 && roleLower.contains("superviseur")) {
            detail.add(new ResultDetail("R07-BONUS", "Bonus équipe 100%", 7_500));
            bonuses = 7_500;
        }

        return buildResult(emp, commissions, bonuses, 0, detail);
    }

    private double commissionFerrero(String roleLower, double ca, double ratio) {
        if (roleLower.contains("vendeur gros")) {
            if (ratio > 1.00) return 8_500;
            if (ratio > 0.90) return 5_000;
            if (ratio > 0.80) return 4_000;
            if (ratio > 0.70) return 3_000;
            return 0;
        }
        if (roleLower.contains("superviseur")) {
            if (ratio > 1.00) return 5_000;
            if (ratio > 0.90) return 3_000;
            if (ratio > 0.80) return 2_500;
            if (ratio > 0.70) return 2_000;
            return 0;
        }
        if (ratio > 1.00) return ca * 0.020;
        if (ratio > 0.90) return ca * 0.018;
        if (ratio > 0.80) return ca * 0.015;
        if (ratio > 0.70) return ca * 0.010;
        return 0;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private boolean isLivreurOuAide(String role) {
        if (role == null) return false;
        String r = role.toLowerCase();
        return r.contains("livreur") || r.contains("aide");
    }

    private double getRatio(Personnel emp, String carte, String periode) {
        var obj = objectifRepo.findByPeriodeAndCarteIgnoreCaseAndMatricule(periode, carte, emp.getMatricule());
        var real = realisationRepo.findByPeriodeAndCarteIgnoreCaseAndMatricule(periode, carte, emp.getMatricule());
        if (obj.isEmpty() || real.isEmpty()) return 0;
        double target = obj.get().getTarget();
        return target > 0 ? real.get().getCaRealise() / target : 0;
    }

    private EmployeeResult buildResult(Personnel emp, double commissions, double bonuses, double penalties, List<ResultDetail> detail) {
        EmployeeResult r = new EmployeeResult();
        r.setMatricule(emp.getMatricule());
        r.setPrenom(emp.getPrenom());
        r.setNom(emp.getNom());
        r.setRole(emp.getRole());
        r.setNatureContrat(emp.getNatureContrat());
        r.setCommissions(round2(commissions));
        r.setBonuses(round2(bonuses));
        r.setPenalties(round2(penalties));
        r.setFinalSalary(round2(commissions + bonuses - penalties));
        r.setDetail(detail);
        return r;
    }

    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }
    private String pct(double v) { return Math.round(v * 100) + "%"; }
}
