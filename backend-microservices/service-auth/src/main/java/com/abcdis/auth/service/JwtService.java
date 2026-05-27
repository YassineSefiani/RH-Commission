package com.abcdis.auth.service;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Map;

@Slf4j
@Service
public class JwtService {

    @Value("${jwt.secret:ABCDisHRApp2024SecretKeyForJWTTokenGenerationMustBeLongEnough256Bits}")
    private String secretKey;

    @Value("${jwt.expiration:86400000}")
    private long expirationMs;

    // Fix critique : encode directement les bytes UTF-8 (pas de double-encodage Base64)
    private SecretKey getCleSignature() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    public String genererToken(String email, String role, String prenom, String nom) {
        Date now = new Date();
        return Jwts.builder()
                .claims(Map.of("role", role, "prenom", prenom, "nom", nom))
                .subject(email)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(getCleSignature())
                .compact();
    }

    public String extraireEmail(String token) {
        return extraireClaims(token).getSubject();
    }

    public String extraireRole(String token) {
        return (String) extraireClaims(token).get("role");
    }

    public boolean validerToken(String token) {
        try {
            extraireClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("Token JWT expiré : {}", e.getMessage());
            return false;
        } catch (JwtException e) {
            log.warn("Token JWT invalide : {}", e.getMessage());
            return false;
        }
    }

    private Claims extraireClaims(String token) {
        return Jwts.parser()
                .verifyWith(getCleSignature())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
