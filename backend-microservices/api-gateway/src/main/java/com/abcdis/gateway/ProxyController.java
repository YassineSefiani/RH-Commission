package com.abcdis.gateway;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
import java.util.List;
import java.util.Map;

/**
 * Controller de proxy — cœur de l'API Gateway.
 *
 * <p>Ce controller intercepte TOUTES les requêtes arrivant sur /api/**
 * et les redirige vers le microservice approprié selon le préfixe d'URL.</p>
 *
 * <p>Fonctionnement :</p>
 * <ol>
 *   <li>Reçoit la requête HTTP du frontend (méthode, URL, headers, body)</li>
 *   <li>Détermine quel microservice cible selon le préfixe d'URL</li>
 *   <li>Recopie la requête vers le microservice cible via RestTemplate</li>
 *   <li>Retourne la réponse du microservice au frontend</li>
 * </ol>
 *
 * <p>Table de routage :</p>
 * <pre>
 *   /api/auth/**             → http://localhost:8081
 *   /api/users/**            → http://localhost:8081
 *   /api/personnel/**        → http://localhost:8082
 *   /api/contraintes/**      → http://localhost:8083
 *   /api/calcul/**           → http://localhost:8083
 *   /api/historique/**       → http://localhost:8083
 *   /api/notifications/**    → http://localhost:8083
 *   /api/fiches-presence/**  → http://localhost:8084
 *   /api/voyages/**          → http://localhost:8084
 *   /api/ventes/**           → http://localhost:8084
 * </pre>
 */
@RestController
public class ProxyController {

    /** URL de base de chaque microservice — surchargeable via env vars en prod. */
    @Value("${services.auth.url:http://localhost:8081}")
    private String authUrl;

    @Value("${services.personnel.url:http://localhost:8082}")
    private String personnelUrl;

    @Value("${services.commission.url:http://localhost:8083}")
    private String commissionUrl;

    @Value("${services.presence.url:http://localhost:8084}")
    private String presenceUrl;

    /** Client HTTP pour transférer les requêtes vers les microservices */
    private final RestTemplate restTemplate;

    /**
     * Injection du RestTemplate par constructeur.
     *
     * @param restTemplate Le client HTTP (défini comme @Bean dans ApiGatewayApplication)
     */
    public ProxyController(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * Point d'entrée unique du proxy : intercepte toutes les requêtes /api/**.
     *
     * <p>Cette méthode gère tous les verbes HTTP (GET, POST, PUT, PATCH, DELETE)
     * grâce à l'annotation @RequestMapping sans restriction de méthode.</p>
     *
     * @param request La requête HTTP entrante (contient URL, méthode, headers, body)
     * @return La réponse du microservice cible, retournée telle quelle au client
     */
    @RequestMapping("/api/**")
    public ResponseEntity<byte[]> proxy(HttpServletRequest request) throws IOException {

        // ─── ÉTAPE 1 : Déterminer le microservice cible ───────────────
        String path = request.getRequestURI();              // Ex: /api/constraints/5
        String query = request.getQueryString();             // Ex: mois=5&annee=2026
        String rewrittenPath = rewriterUrl(path);            // Traduit routes frontend (EN) → backend (FR)
        String targetBase = resolverCible(rewrittenPath);    // Route selon le path réécrit

        if (targetBase == null) {
            // Route /api/** non reconnue par le gateway → 404 plutôt que 403 anonyme
            String nfBody = "{\"status\":404,\"error\":\"Not Found\",\"message\":\"Route inconnue : " + path + "\"}";
            HttpHeaders nfHeaders = new HttpHeaders();
            nfHeaders.setContentType(MediaType.APPLICATION_JSON);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .headers(nfHeaders)
                    .body(nfBody.getBytes(StandardCharsets.UTF_8));
        }

        // Construire l'URL complète vers le microservice
        String targetUrl = targetBase + rewrittenPath + (query != null ? "?" + query : "");

        // ─── ÉTAPE 2 : Copier les headers de la requête originale ─────
        // Important : on propage le Content-Type, Authorization, etc.
        HttpHeaders headers = new HttpHeaders();
        Enumeration<String> headerNames = request.getHeaderNames();
        while (headerNames != null && headerNames.hasMoreElements()) {
            String name = headerNames.nextElement();
            // Exclure les headers Host (sinon le microservice rejette la requête)
            if (!name.equalsIgnoreCase("host")) {
                headers.add(name, request.getHeader(name));
            }
        }

        // ─── ÉTAPE 3 : Lire le corps de la requête (body) ────────────
        byte[] body = request.getInputStream().readAllBytes();

        // ─── ÉTAPE 4 : Déterminer la méthode HTTP ─────────────────────
        HttpMethod method = HttpMethod.valueOf(request.getMethod());

        // ─── ÉTAPE 5 : Envoyer la requête vers le microservice cible ──
        HttpEntity<byte[]> entity = new HttpEntity<>(body.length > 0 ? body : null, headers);

        try {
            // exchange() : méthode générique qui supporte tous les verbes HTTP
            ResponseEntity<byte[]> upstream = restTemplate.exchange(targetUrl, method, entity, byte[].class);
            return stripCorsHeaders(upstream.getStatusCode(), upstream.getHeaders(), upstream.getBody());
        } catch (HttpStatusCodeException e) {
            // En cas d'erreur HTTP du microservice (4xx, 5xx), on retourne
            // le même code d'erreur et le même body au client frontend
            return stripCorsHeaders(e.getStatusCode(), e.getResponseHeaders(), e.getResponseBodyAsByteArray());
        } catch (ResourceAccessException e) {
            // Timeout ou microservice injoignable — renvoie 503 Service Unavailable
            String errBody = "{\"status\":503,\"error\":\"Service Unavailable\",\"message\":\""
                    + (e.getMessage() != null ? e.getMessage().replace("\"", "'") : "upstream unreachable")
                    + "\"}";
            HttpHeaders errHeaders = new HttpHeaders();
            errHeaders.setContentType(MediaType.APPLICATION_JSON);
            return ResponseEntity
                    .status(HttpStatus.SERVICE_UNAVAILABLE)
                    .headers(errHeaders)
                    .body(errBody.getBytes(StandardCharsets.UTF_8));
        }
    }

    /**
     * Retire les headers CORS de la réponse du microservice pour éviter la
     * duplication d'Access-Control-Allow-Origin (le gateway @CrossOrigin
     * ajoute déjà ces headers — laisser passer ceux d'amont déclenche
     * "header contains multiple values" côté navigateur).
     */
    private ResponseEntity<byte[]> stripCorsHeaders(org.springframework.http.HttpStatusCode status,
                                                     HttpHeaders upstreamHeaders,
                                                     byte[] body) {
        HttpHeaders cleaned = new HttpHeaders();
        if (upstreamHeaders != null) {
            upstreamHeaders.forEach((name, values) -> {
                if (name == null) return;
                String lower = name.toLowerCase();
                if (lower.startsWith("access-control-") || lower.equals("vary")) return;
                cleaned.put(name, values);
            });
        }
        return ResponseEntity.status(status).headers(cleaned).body(body);
    }

    /**
     * Détermine l'URL de base du microservice cible selon le préfixe d'URL.
     *
     * <p>Cette méthode implémente la table de routage de la gateway.
     * Elle analyse le début du path pour savoir quel service appeler.</p>
     *
     * @param path Le chemin de la requête (ex: /api/contraintes/5)
     * @return L'URL de base du microservice cible (ex: http://localhost:8083)
     */
    private String resolverCible(String path) {
        // Service Auth (port 8081) : authentification, users, audit log
        if (path.startsWith("/api/auth/") || path.equals("/api/auth")
                || path.startsWith("/api/users/") || path.equals("/api/users")
                || path.startsWith("/api/audit/") || path.equals("/api/audit")) {
            return authUrl;
        }

        // Service Personnel (port 8082) : CRUD employés
        if (path.startsWith("/api/personnel/") || path.equals("/api/personnel")) {
            return personnelUrl;
        }

        // Service Commission (port 8083) : contraintes + calcul + historique + import + notifications
        if (path.startsWith("/api/contraintes/") || path.equals("/api/contraintes")
                || path.startsWith("/api/calcul/") || path.equals("/api/calcul")
                || path.startsWith("/api/historique/") || path.equals("/api/historique")
                || path.startsWith("/api/import/") || path.equals("/api/import")
                || path.startsWith("/api/notifications/") || path.equals("/api/notifications")) {
            return commissionUrl;
        }

        // Service Présence (port 8084) : fiches, voyages, ventes, volumes
        if (path.startsWith("/api/fiches-presence/") || path.equals("/api/fiches-presence")
                || path.startsWith("/api/voyages/") || path.equals("/api/voyages")
                || path.startsWith("/api/ventes/") || path.equals("/api/ventes")
                || path.startsWith("/api/volumes/") || path.equals("/api/volumes")) {
            return presenceUrl;
        }

        // Route inconnue → null (le caller renvoie 404 plutôt que de proxier au hasard)
        return null;
    }

    /**
     * Réécrit les URLs frontend (anglais) vers les URLs backend (français).
     * Permet au frontend d'utiliser des routes anglaises sans modifier les microservices.
     *
     * @param path Le chemin original de la requête frontend
     * @return Le chemin traduit pour le microservice cible
     */
    private String rewriterUrl(String path) {
        // /api/constraints/** → /api/contraintes/**
        if (path.startsWith("/api/constraints/")) {
            return "/api/contraintes/" + path.substring("/api/constraints/".length());
        }
        if (path.equals("/api/constraints")) {
            return "/api/contraintes";
        }
        // /api/history/** → /api/historique/**
        if (path.startsWith("/api/history/")) {
            return "/api/historique/" + path.substring("/api/history/".length());
        }
        if (path.equals("/api/history")) {
            return "/api/historique";
        }
        // /api/fiche-presence/** → /api/fiches-presence/** (singulier → pluriel)
        if (path.startsWith("/api/fiche-presence/")) {
            return "/api/fiches-presence/" + path.substring("/api/fiche-presence/".length());
        }
        if (path.equals("/api/fiche-presence")) {
            return "/api/fiches-presence";
        }
        // Toutes les autres routes : pas de réécriture
        return path;
    }
}
