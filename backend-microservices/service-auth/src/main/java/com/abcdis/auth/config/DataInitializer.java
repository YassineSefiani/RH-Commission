package com.abcdis.auth.config;

import com.abcdis.auth.model.Utilisateur;
import com.abcdis.auth.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Initialise les utilisateurs par défaut au démarrage.
 * Idempotent — ne crée les comptes que s'ils n'existent pas.
 *
 * <p>{@code app.seed.force-password-resync} (default true) : si true, resynchronise
 * le mot de passe des comptes seed quand il a divergé. Mettre à false en prod
 * pour empêcher tout reset à partir du code source.</p>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.force-password-resync:true}")
    private boolean forcePasswordResync;

    @Override
    public void run(String... args) {
        creerSiAbsent("yassine.admin@abcdis.com", "Admin1234!", "Yassine",   "Admin", "ADMIN");
        creerSiAbsent("admin@abcdis.com",          "Admin2024!", "Super",     "Admin", "ADMIN");
        creerSiAbsent("adv@abcdis.com",            "Adv1234!",   "ADV",       "User",  "ADV");
        creerSiAbsent("rh@abcdis.com",             "Rh1234!",    "RH",        "User",  "RH");
        creerSiAbsent("dispatcher@abcdis.com",     "Dispatch1!", "Dispatch",  "User",  "DISPATCHER");
        log.info("DataInitializer : vérification des comptes par défaut terminée.");
    }

    private void creerSiAbsent(String email, String motDePasse,
                                String prenom, String nom, String superRole) {
        Utilisateur existant = utilisateurRepository.findByEmail(email).orElse(null);
        if (existant == null) {
            Utilisateur u = Utilisateur.builder()
                    .email(email)
                    .motDePasse(passwordEncoder.encode(motDePasse))
                    .prenom(prenom)
                    .nom(nom)
                    .superRole(superRole)
                    .actif(true)
                    .build();
            utilisateurRepository.save(u);
            log.info("Compte créé : {} ({})", email, superRole);
        } else if (forcePasswordResync && !passwordEncoder.matches(motDePasse, existant.getMotDePasse())) {
            // Compte existe mais mot de passe diffère du seed (legacy / drift).
            // Resync uniquement si app.seed.force-password-resync=true (désactiver en prod).
            existant.setMotDePasse(passwordEncoder.encode(motDePasse));
            existant.setSuperRole(superRole);
            existant.setActif(true);
            if (existant.getPrenom() == null || existant.getPrenom().isBlank()) existant.setPrenom(prenom);
            if (existant.getNom() == null || existant.getNom().isBlank())       existant.setNom(nom);
            utilisateurRepository.save(existant);
            log.info("Mot de passe resynchronisé : {} ({})", email, superRole);
        }
    }
}
