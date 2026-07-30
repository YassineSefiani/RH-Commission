package com.abcdis.commission.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import javax.crypto.SecretKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Vérifie que chaque requête porte un JWT valide émis par service-auth
 * (même secret partagé via la variable d'environnement JWT_SECRET), et
 * applique des restrictions de rôle sur les routes sensibles : l'historique
 * des calculs et la gestion des contraintes/calculs sont réservés aux rôles
 * qui en ont besoin (le frontend cachait déjà ces pages aux autres rôles,
 * ce filtre applique la même règle côté serveur).
 * Pas de Spring Security ici : un filtre simple suffit pour ce projet.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Value("${jwt.secret}")
    private String secret;

    private record RoleRule(String pathPrefix, List<String> allowedRoles) {}

    private static final List<RoleRule> ROLE_RULES = List.of(
            new RoleRule("/api/historique", List.of("ADMIN", "ADV", "RH")),
            new RoleRule("/api/contraintes", List.of("ADMIN", "ADV")),
            new RoleRule("/api/calcul", List.of("ADMIN", "ADV"))
    );

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return request.getRequestURI().startsWith("/actuator/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token manquant");
            return;
        }

        String role;
        try {
            SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
            Claims claims = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(header.substring(7)).getPayload();
            role = (String) claims.get("role");
        } catch (ExpiredJwtException e) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token expiré");
            return;
        } catch (JwtException e) {
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token invalide");
            return;
        }

        String path = request.getRequestURI();
        for (RoleRule rule : ROLE_RULES) {
            if (path.startsWith(rule.pathPrefix()) && !rule.allowedRoles().contains(role)) {
                response.sendError(HttpServletResponse.SC_FORBIDDEN, "Rôle non autorisé pour cette ressource");
                return;
            }
        }

        request.setAttribute("userRole", role);
        chain.doFilter(request, response);
    }
}
