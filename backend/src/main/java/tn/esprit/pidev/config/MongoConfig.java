package tn.esprit.pidev.config;

import org.springframework.boot.autoconfigure.mongo.MongoClientSettingsBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.security.cert.X509Certificate;

/**
 * Relaxed-TLS MongoDB client, required by MongoDB Atlas on some networks
 * (self-signed intermediate certs / SNI issues).
 *
 * Activated by the "atlas" profile, which the "dev" and "prod" profiles pull in
 * automatically via spring.profiles.group (see application.properties).
 * The default "local" profile does NOT load this bean, so a plain local
 * MongoDB (mongodb://localhost:27017, no TLS) connects normally.
 */
@Configuration
@Profile("atlas")
public class MongoConfig {

    @Bean
    public MongoClientSettingsBuilderCustomizer customMongoClientSettings() throws Exception {
        // Create a trust manager that does not validate certificate chains
        TrustManager[] trustAllCerts = new TrustManager[]{
                new X509TrustManager() {
                    public X509Certificate[] getAcceptedIssuers() {
                        return new X509Certificate[0];
                    }

                    public void checkClientTrusted(X509Certificate[] certs, String authType) {
                    }

                    public void checkServerTrusted(X509Certificate[] certs, String authType) {
                    }
                }
        };

        SSLContext sslContext = SSLContext.getInstance("TLS");
        sslContext.init(null, trustAllCerts, new java.security.SecureRandom());

        return builder -> builder.applyToSslSettings(sslBuilder -> {
            sslBuilder.enabled(true);
            sslBuilder.context(sslContext);
            sslBuilder.invalidHostNameAllowed(true);
        });
    }
}
