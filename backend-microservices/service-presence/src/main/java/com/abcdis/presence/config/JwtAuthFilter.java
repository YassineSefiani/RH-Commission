package com.abcdis.presence.config;

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

/**
 * Vérifie que chaque requête porte un JWT valide émis par service-auth
 * (même secret partagé via la variable d'environnement JWT_SECRET).
 * Pas de Spring Security ici : ce projet n'a pas besoin de la complexité
 * d'un SecurityFilterChain, juste d'un contrôle d'accès simple.
 *
 * <p>Modifier/supprimer une fiche de présence est réservé au rôle
 * DISPATCHER — c'est sa fiche, personne d'autre n'a à y toucher.</p>
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Value("${jwt.secret}")
    private String secret;

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

        String method = request.getMethod();
        boolean isModification = "PUT".equals(method) || "DELETE".equals(method);
        if (isModification && request.getRequestURI().startsWith("/api/fiches-presence")
                && !"DISPATCHER".equals(role)) {
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Seul le dispatcher peut modifier ou supprimer une fiche de présence");
            return;
        }

        request.setAttribute("userRole", role);
        chain.doFilter(request, response);
    }
}
