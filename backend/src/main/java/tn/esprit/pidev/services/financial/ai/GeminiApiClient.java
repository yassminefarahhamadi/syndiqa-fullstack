package tn.esprit.pidev.services.financial.ai;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class GeminiApiClient {

    private final RestTemplate restTemplate;
    private final String apiKey;
    private final boolean aiEnabled;

    /**
     * Gemini AI Integration for Financial Reminders
     * 
     * Uses Google Gemini 2.0 Flash model (Free Tier) for generating
     * personalized payment reminders with adaptive tone based on
     * overdue duration and resident payment history.
     */
    public GeminiApiClient(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${gemini.api.key:}") String apiKey) {
        
        this.apiKey = apiKey;
        this.aiEnabled = apiKey != null && !apiKey.trim().isEmpty() && !apiKey.equals("mock-only");

        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofSeconds(10))
                .setReadTimeout(Duration.ofSeconds(30))
                .build();
    }

    public boolean isAiEnabled() {
        return aiEnabled;
    }

    public Optional<String> callGemini(String prompt, int maxTokens) {
        if (!aiEnabled) {
            log.debug("AI is disabled or running in mock-mode. Returning empty string to trigger fallback logic.");
            return Optional.empty();
        }

        String geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + this.apiKey;
        
        Map<String, Object> requestBody = new HashMap<>();
        Map<String, Object> contents = new HashMap<>();
        Map<String, Object> parts = new HashMap<>();
        
        parts.put("text", prompt);
        contents.put("parts", List.of(parts));
        requestBody.put("contents", List.of(contents));
        
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("maxOutputTokens", maxTokens);
        requestBody.put("generationConfig", generationConfig);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);

        long startTime = System.currentTimeMillis();
        
        int attempts = 0;
        int maxAttempts = 3;
        int backoff = 1000;

        while (attempts < maxAttempts) {
            try {
                ResponseEntity<Map> response = restTemplate.postForEntity(geminiEndpoint, request, Map.class);
                
                long latency = System.currentTimeMillis() - startTime;
                
                if (response.getBody() != null && response.getBody().containsKey("candidates")) {
                    List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
                    if (!candidates.isEmpty()) {
                        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                        List<Map<String, Object>> resParts = (List<Map<String, Object>>) content.get("parts");
                        String generatedText = (String) resParts.get(0).get("text");
                        
                        log.debug("AI Model: gemini-2.0-flash, Prompt length: {}, Response length: {}, Latency: {}ms", 
                                prompt.length(), generatedText.length(), latency);
                        
                        return Optional.of(generatedText);
                    }
                }
                break;
            } catch (HttpClientErrorException.TooManyRequests e) {
                log.warn("API Rate Limit Exceeded (429). Retrying...");
                attempts++;
                sleep(backoff);
                backoff *= 2;
            } catch (HttpServerErrorException | ResourceAccessException e) {
                log.warn("API Server Error or Timeout. Retrying...");
                attempts++;
                sleep(backoff);
                backoff *= 2;
            } catch (Exception e) {
                log.warn("API Call Failed without retry: {}", e.getMessage());
                break;
            }
        }
        
        log.warn("AI generation completely failed after {} attempts.", attempts);
        return Optional.empty();
    }
    
    private void sleep(int millis) {
        try {
            Thread.sleep(millis);
        } catch (InterruptedException ignored) {}
    }
}
