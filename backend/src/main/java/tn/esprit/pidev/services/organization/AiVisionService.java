package tn.esprit.pidev.services.organization;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import tn.esprit.pidev.dto.AiAnalysisResultDto;
import tn.esprit.pidev.entities.organization.InspectionCondition;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Service
public class AiVisionService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ─── Analyse globale de l'inspection ────────────────────────────────────────

    public AiAnalysisResultDto analyzeInspectionPhotos(List<MultipartFile> photos) {
        if (photos == null || photos.isEmpty()) {
            throw new IllegalArgumentException("Au moins une photo est requise pour l'analyse.");
        }
        log.info("Analyse IA globale de {} photo(s)", photos.size());
        try {
            Map<String, Object> requestBody = buildGeminiRequest(buildGlobalPrompt(), photos);
            return callGemini(requestBody);
        } catch (Exception e) {
            log.error("Erreur analyse IA globale: {}", e.getMessage(), e);
            throw new RuntimeException("L'analyse IA a échoué : " + e.getMessage());
        }
    }

    // ─── Analyse ciblée d'un item spécifique ────────────────────────────────────

    public AiAnalysisResultDto analyzeItemPhoto(String itemName, MultipartFile photo) {
        if (photo == null || photo.isEmpty()) {
            throw new IllegalArgumentException("Une photo est requise pour l'analyse de l'item.");
        }
        log.info("Analyse IA de l'item '{}' ", itemName);
        try {
            Map<String, Object> requestBody = buildGeminiRequest(buildItemPrompt(itemName), List.of(photo));
            return callGemini(requestBody);
        } catch (Exception e) {
            log.error("Erreur analyse IA item '{}': {}", itemName, e.getMessage(), e);
            throw new RuntimeException("L'analyse IA de l'item a échoué : " + e.getMessage());
        }
    }

    // ─── Construction des requêtes Gemini ────────────────────────────────────────

    private Map<String, Object> buildGeminiRequest(String prompt, List<MultipartFile> photos) throws Exception {
        List<Map<String, Object>> parts = new ArrayList<>();
        parts.add(Map.of("text", prompt));

        for (MultipartFile photo : photos) {
            String base64 = Base64.getEncoder().encodeToString(photo.getBytes());
            String mimeType = photo.getContentType() != null ? photo.getContentType() : "image/jpeg";
            parts.add(Map.of(
                "inline_data", Map.of("mime_type", mimeType, "data", base64)
            ));
        }

        return Map.of(
            "contents", List.of(Map.of("parts", parts)),
            "generationConfig", Map.of("temperature", 0.4, "responseMimeType", "application/json")
        );
    }

    private String buildGlobalPrompt() {
        return """
            Tu es un expert en inspection immobilière en Tunisie. Analyse les photos fournies d'un appartement ou d'une pièce.

            Évalue avec précision :
            1. L'état général de ce qui est visible
            2. Les dommages, défauts ou problèmes détectables (fissures, taches, moisissures, usure, peinture écaillée, etc.)
            3. Une estimation réaliste du coût de réparation en Dinars Tunisiens (TND)
            4. Des recommandations claires

            Réponds STRICTEMENT en JSON avec cette structure exacte :
            {
              "condition": "EXCELLENT" | "GOOD" | "ACCEPTABLE" | "POOR" | "DAMAGED",
              "description": "Description détaillée en français de ce que tu vois (2-3 phrases)",
              "damagesDetected": ["dommage 1", "dommage 2"],
              "estimatedCost": nombre en TND (0 si aucun dommage),
              "confidence": nombre entre 0 et 100,
              "recommendations": "Recommandations pratiques en français"
            }

            Échelle des conditions :
            - EXCELLENT : Neuf, aucun défaut visible
            - GOOD : Très bon état, usure normale minime
            - ACCEPTABLE : État correct, quelques signes d'usure
            - POOR : État dégradé, réparations nécessaires
            - DAMAGED : Dommages importants, intervention urgente

            Sois précis, professionnel et objectif.
            """;
    }

    private String buildItemPrompt(String itemName) {
        return String.format("""
            Tu es un expert en inspection immobilière en Tunisie. Analyse cette photo d'un(e) %s dans un appartement.

            Évalue avec précision :
            1. L'état actuel de cet élément spécifique
            2. Les dommages, usures ou défauts visibles sur cet élément
            3. Une estimation réaliste du coût de réparation ou remplacement en Dinars Tunisiens (TND)
            4. Des recommandations pratiques

            Réponds STRICTEMENT en JSON :
            {
              "condition": "EXCELLENT" | "GOOD" | "ACCEPTABLE" | "POOR" | "DAMAGED",
              "description": "Description précise de l'état de cet élément en 1-2 phrases",
              "damagesDetected": ["défaut 1", "défaut 2"],
              "estimatedCost": coût de réparation/remplacement en TND (0 si aucun dommage),
              "confidence": nombre entre 0 et 100,
              "recommendations": "Recommandation courte et pratique"
            }

            Contexte : il s'agit d'un(e) %s dans un logement résidentiel en Tunisie.
            Sois spécifique à cet élément et réaliste sur les coûts locaux.
            """, itemName, itemName);
    }

    // ─── Appel Gemini & parsing ───────────────────────────────────────────────────

    private AiAnalysisResultDto callGemini(Map<String, Object> requestBody) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
        String url = apiUrl + "?key=" + apiKey;

        String response = restTemplate.postForObject(url, entity, String.class);
        log.debug("Réponse Gemini: {}", response);
        return parseGeminiResponse(response);
    }

    private AiAnalysisResultDto parseGeminiResponse(String response) throws Exception {
        JsonNode root = objectMapper.readTree(response);
        String generatedText = root
            .path("candidates").get(0)
            .path("content").path("parts").get(0)
            .path("text").asText();

        log.info("Texte IA généré: {}", generatedText);
        JsonNode aiJson = objectMapper.readTree(generatedText);

        return AiAnalysisResultDto.builder()
            .condition(parseCondition(aiJson.path("condition").asText("ACCEPTABLE")))
            .description(aiJson.path("description").asText(""))
            .damagesDetected(parseDamagesList(aiJson.path("damagesDetected")))
            .estimatedCost(BigDecimal.valueOf(aiJson.path("estimatedCost").asDouble(0)))
            .confidence(aiJson.path("confidence").asInt(0))
            .recommendations(aiJson.path("recommendations").asText(""))
            .build();
    }

    private InspectionCondition parseCondition(String value) {
        try {
            return InspectionCondition.valueOf(value.toUpperCase());
        } catch (Exception e) {
            return InspectionCondition.ACCEPTABLE;
        }
    }

    private List<String> parseDamagesList(JsonNode node) {
        List<String> damages = new ArrayList<>();
        if (node.isArray()) {
            node.forEach(item -> damages.add(item.asText()));
        }
        return damages;
    }
}
