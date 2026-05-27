package com.abcdis.gateway;

import org.apache.hc.client5.http.config.ConnectionConfig;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.impl.io.PoolingHttpClientConnectionManager;
import org.apache.hc.core5.util.Timeout;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Point d'entrée de l'API Gateway.
 *
 * <p>Cette gateway est un proxy HTTP simple construit avec Spring MVC et RestTemplate.
 * Elle route les requêtes du frontend (port 8080) vers les microservices appropriés
 * sans dépendre de Spring Cloud Gateway.</p>
 *
 * <p>Architecture du routage :</p>
 * <pre>
 *   Frontend React (port 3000/5173)
 *         │
 *         ▼
 *   API Gateway (port 8080)   ← un seul point d'entrée
 *    ├─ /api/auth/**        → service-auth       (8081)
 *    ├─ /api/users/**       → service-auth       (8081)
 *    ├─ /api/personnel/**   → service-personnel  (8082)
 *    ├─ /api/contraintes/** → service-commission (8083)
 *    ├─ /api/calcul/**      → service-commission (8083)
 *    ├─ /api/historique/**  → service-commission (8083)
 *    ├─ /api/fiches-presence/** → service-presence (8084)
 *    ├─ /api/voyages/**     → service-presence   (8084)
 *    └─ /api/ventes/**      → service-presence   (8084)
 * </pre>
 */
@SpringBootApplication
public class ApiGatewayApplication {

    @Value("${app.proxy.connect-timeout-ms:3000}")
    private long connectTimeoutMs;

    @Value("${app.proxy.read-timeout-ms:15000}")
    private long readTimeoutMs;

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    /**
     * RestTemplate backed by Apache HttpClient 5 with explicit connect/read
     * timeouts so that a hung downstream service can't block the gateway.
     */
    @Bean
    public RestTemplate restTemplate() {
        // Connection-level timeouts (socket connect + read) via HttpClient5 ConnectionConfig
        ConnectionConfig connectionConfig = ConnectionConfig.custom()
                .setConnectTimeout(Timeout.ofMilliseconds(connectTimeoutMs))
                .setSocketTimeout(Timeout.ofMilliseconds(readTimeoutMs))
                .build();
        PoolingHttpClientConnectionManager cm = new PoolingHttpClientConnectionManager();
        cm.setDefaultConnectionConfig(connectionConfig);

        // Request-level config (connection-request timeout from pool)
        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectionRequestTimeout(Timeout.ofMilliseconds(connectTimeoutMs))
                .setResponseTimeout(Timeout.ofMilliseconds(readTimeoutMs))
                .build();

        CloseableHttpClient httpClient = HttpClients.custom()
                .setConnectionManager(cm)
                .setDefaultRequestConfig(requestConfig)
                .build();

        return new RestTemplate(new HttpComponentsClientHttpRequestFactory(httpClient));
    }
}
