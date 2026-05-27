package com.abcdis.auth.service;

import com.abcdis.auth.dto.LoginRequest;
import com.abcdis.auth.dto.LoginResponse;
import com.abcdis.auth.exception.DuplicateResourceException;
import com.abcdis.auth.exception.InvalidCredentialsException;
import com.abcdis.auth.exception.InvalidTokenException;
import com.abcdis.auth.exception.ResourceNotFoundException;
import com.abcdis.auth.model.Utilisateur;
import com.abcdis.auth.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor // injection par constructeur — les 3 champs final sont injectés
public class AuthService {

    private final UtilisateurRepository utilisateurRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true) // lecture pure — pas de write transaction inutile
    public LoginResponse connecter(LoginRequest request) {
        Utilisateur utilisateur = utilisateurRepository
                .findByEmailAndActif(request.email(), true)
                .orElseThrow(() -> new InvalidCredentialsException(
                        "Compte introuvable ou désactivé pour : " + request.email()));

        if (!passwordEncoder.matches(request.motDePasse(), utilisateur.getMotDePasse())) {
            throw new InvalidCredentialsException("Email ou mot de passe incorrect");
        }

        String token = jwtService.genererToken(
                utilisateur.getEmail(),
                utilisateur.getSuperRole(),
                utilisateur.getPrenom(),
                utilisateur.getNom()
        );

        return new LoginResponse(token, utilisateur.getEmail(),
                utilisateur.getPrenom(), utilisateur.getNom(), utilisateur.getSuperRole());
    }

    @Transactional(readOnly = true)
    public LoginResponse validerToken(String token) {
        if (!jwtService.validerToken(token)) {
            throw new InvalidTokenException("Token JWT invalide ou expiré");
        }

        String email = jwtService.extraireEmail(token);
        String role  = jwtService.extraireRole(token);

        Utilisateur utilisateur = utilisateurRepository
                .findByEmailAndActif(email, true)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable"));

        return new LoginResponse(token, utilisateur.getEmail(),
                utilisateur.getPrenom(), utilisateur.getNom(), role);
    }

    @Transactional
    public Utilisateur creerUtilisateur(Utilisateur utilisateur) {
        if (utilisateurRepository.existsByEmail(utilisateur.getEmail())) {
            throw new DuplicateResourceException(
                    "Un compte existe déjà avec cet email : " + utilisateur.getEmail());
        }
        utilisateur.setMotDePasse(passwordEncoder.encode(utilisateur.getMotDePasse()));
        return utilisateurRepository.save(utilisateur);
    }

    @Transactional(readOnly = true)
    public List<Utilisateur> listerUtilisateurs() {
        return utilisateurRepository.findAll();
    }
}
