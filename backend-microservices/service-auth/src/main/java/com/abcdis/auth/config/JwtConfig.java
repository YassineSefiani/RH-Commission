package com.abcdis.auth.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * ════════════════════════════════════════════════════════════════
 *  CONFIGURATION JWT : JwtConfig
 * ════════════════════════════════════════════════════════════════
 *  Centralise les paramètres de configuration JWT injectés depuis
 *  application.properties. Peut être injectée dans n'importe quel
 *  composant Spring qui a besoin de ces valeurs.
 *
 *  CONCEPT JEE - INJECTION DE CONFIGURATION :
 *  En Jakarta EE, on utilise @ConfigProperty (MicroProfile Config)
 *  pour injecter des valeurs de configuration :
 *
 *      @Inject
 *      @ConfigProperty(name = "jwt.secret")
 *      private String secret;
 *
 *  En Spring, l'équivalent est @Value("${jwt.secret}") :
 *      @Value("${jwt.secret}")
 *      private String secret;
 *
 *  Cette classe regroupe toute la configuration JWT en un seul endroit
 *  pour faciliter la maintenance et éviter la duplication.
 *
 *  SÉCURITÉ JWT - BONNES PRATIQUES :
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │  - Clé secrète : minimum 256 bits (32 caractères)           │
 *  │  - Expiration : 15 minutes (accès) / 7 jours (refresh)      │
 *  │  - Algorithme : HS256 (HMAC-SHA256) minimum                 │
 *  │  - En production : stocker la clé dans un coffre-fort       │
 *  │    (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault)  │
 *  └─────────────────────────────────────────────────────────────┘
 * ════════════════════════════════════════════════════════════════
 */
@Configuration // Classe de configuration Spring - chargée au démarrage
public class JwtConfig {

    /**
     * Clé secrète pour signer et vérifier les tokens JWT.
     *
     * Syntaxe @Value : "${propriété:valeurParDéfaut}"
     * Si jwt.secret n'est pas défini dans application.properties,
     * la valeur par défaut est utilisée.
     *
     * ATTENTION : En production, ne jamais mettre la clé en dur dans le code !
     * Utiliser des variables d'environnement ou un gestionnaire de secrets.
     */
    @Value("${jwt.secret:ABCDisHRApp2024SecretKeyForJWTTokenGenerationMustBeLongEnough256Bits}")
    private String secret;

    /**
     * Durée de validité du token d'accès en millisecondes.
     * Valeur par défaut : 86400000 ms = 86400 secondes = 24 heures
     *
     * Calcul : 24h × 60min × 60sec × 1000ms = 86 400 000 ms
     *
     * En production, recommandation sécurité :
     *   - Token d'accès  : 15 minutes (900 000 ms)
     *   - Token de refresh: 7 jours  (604 800 000 ms)
     */
    @Value("${jwt.expiration:86400000}")
    private long expirationMs;

    /**
     * Émetteur du token (identifie qui a créé le token).
     * Stocké dans le claim "iss" (issuer) du JWT.
     */
    @Value("${jwt.issuer:ABC-DIS-HR-System}")
    private String issuer;

    /**
     * Audience du token (identifie pour qui le token est destiné).
     * Stocké dans le claim "aud" (audience) du JWT.
     */
    @Value("${jwt.audience:rh-commission-app}")
    private String audience;

    // ─── Accesseurs (lecture seule - pas de setters pour la config) ──

    /**
     * @return La clé secrète JWT
     */
    public String getSecret() {
        return secret;
    }

    /**
     * @return La durée d'expiration en millisecondes
     */
    public long getExpirationMs() {
        return expirationMs;
    }

    /**
     * Convertit la durée d'expiration en secondes (utile pour certaines API).
     *
     * @return La durée d'expiration en secondes
     */
    public long getExpirationSeconds() {
        return expirationMs / 1000;
    }

    /**
     * @return L'émetteur du token
     */
    public String getIssuer() {
        return issuer;
    }

    /**
     * @return L'audience du token
     */
    public String getAudience() {
        return audience;
    }

    /**
     * Affichage de la configuration (sans révéler la clé secrète).
     * Utile pour les logs de démarrage.
     */
    @Override
    public String toString() {
        return "JwtConfig{" +
                "issuer='" + issuer + '\'' +
                ", audience='" + audience + '\'' +
                ", expirationMs=" + expirationMs +
                ", secret='[MASQUÉ]'" + // Ne jamais logger la clé secrète !
                '}';
    }
}
