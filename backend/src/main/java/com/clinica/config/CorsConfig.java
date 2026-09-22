package com.clinica.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Frontend (Vite, localhost:5173) and backend (Spring Boot, localhost:8080)
 * run on different ports in dev, so CORS has to be opened explicitly.
 * Allowed origins come from CORS_ALLOWED_ORIGINS in application.properties.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${clinica.cors.allowed-origins}")
    private String[] allowedOrigins;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "DELETE", "PUT")
                .allowedHeaders("*");
    }
}
