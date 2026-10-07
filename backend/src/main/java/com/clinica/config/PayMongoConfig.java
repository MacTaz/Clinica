package com.clinica.config;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * Configures a RestClient bean for PayMongo API calls.
 *
 * PayMongo uses HTTP Basic Auth where the secret key is the username
 * and the password is an empty string:
 *   Authorization: Basic base64("sk_test_...:") 
 *
 * The bean is only used when PAYMONGO_SECRET_KEY is set.
 */
@Configuration
public class PayMongoConfig {

    @Value("${paymongo.api.base-url}")
    private String baseUrl;

    @Value("${paymongo.secret-key}")
    private String secretKey;

    @Bean(name = "payMongoHttpClient")
    public RestClient payMongoHttpClient() {
        // PayMongo auth: Basic base64(secretKey + ":"), empty password
        String credentials = secretKey + ":";
        String encoded = Base64.getEncoder().encodeToString(credentials.getBytes(StandardCharsets.UTF_8));
        String authHeader = "Basic " + encoded;

        return RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", authHeader)
                .defaultHeader("Content-Type", "application/json")
                .defaultHeader("Accept", "application/json")
                .build();
    }
}
