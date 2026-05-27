package com.abcdis.auth.controller;

import com.abcdis.auth.dto.LoginRequest;
import com.abcdis.auth.dto.LoginResponse;
import com.abcdis.auth.model.Utilisateur;
import com.abcdis.auth.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * API REST pour l'authentification et la gestion des utilisateurs.
 * Toutes les erreurs sont gérées centralement par GlobalExceptionHandler.
 */
@RestController
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // ── Authentification ──────────────────────────────────────────────────────

    @PostMapping("/api/auth/connexion")
    public ResponseEntity<LoginResponse> connexion(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.connecter(request));
    }

    /** Compatibilité frontend (ancienne route) */
    @PostMapping("/api/users/login")
    public ResponseEntity<Map<String, Object>> loginCompatibilite(@RequestBody Map<String, String> body) {
        LoginRequest request = new LoginRequest(body.get("email"),
                body.getOrDefault("password", body.get("motDePasse")));
        LoginResponse response = authService.connecter(request);
        return ResponseEntity.ok(Map.of(
                "token",     response.token(),
                "email",     response.email(),
                "prenom",    response.prenom(),
                "nom",       response.nom(),
                "superRole", response.superRole()
        ));
    }

    @PostMapping("/api/auth/valider")
    public ResponseEntity<LoginResponse> validerToken(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authService.validerToken(body.get("token")));
    }

    @PostMapping("/api/users/validate")
    public ResponseEntity<LoginResponse> validerTokenCompat(@RequestBody Map<String, String> body) {
        return validerToken(body);
    }

    // ── Gestion des utilisateurs ──────────────────────────────────────────────

    @GetMapping("/api/users")
    public ResponseEntity<List<Utilisateur>> listerUtilisateurs() {
        return ResponseEntity.ok(authService.listerUtilisateurs());
    }

    @PostMapping("/api/users")
    public ResponseEntity<Utilisateur> creerUtilisateur(@Valid @RequestBody Utilisateur utilisateur) {
        Utilisateur cree = authService.creerUtilisateur(utilisateur);
        cree.setMotDePasse("[CHIFFRÉ]"); // masquer le hash BCrypt dans la réponse
        return ResponseEntity.status(HttpStatus.CREATED).body(cree);
    }
}
