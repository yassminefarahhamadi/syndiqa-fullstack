package tn.esprit.pidev.controllers.property;

import jakarta.annotation.security.PermitAll;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;
import java.util.*;

@RestController
@RequestMapping("/api/buildings")
@CrossOrigin(origins = "http://localhost:4200")
public class BuildingAnalysisController {

    private static final Logger logger = LoggerFactory.getLogger(BuildingAnalysisController.class);
    private static final String GEMINI_API_KEY = "AIzaSyA4Hde3tldt6Xa-eEeXVTc3OsjrsxWV4js";

    @PostMapping("/analyze")
    @PermitAll
    public ResponseEntity<?> analyzeBuilding(@RequestBody Map<String, String> body) {
        try {
            logger.info("🔍 Received building analysis request");

            String base64Image = body.get("image");
            String mimeType = body.get("mimeType");

            if (base64Image == null || base64Image.isEmpty()) {
                logger.error("❌ Missing 'image' field in request body");
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Missing 'image' field",
                    "message", "Request body must contain 'image' (base64 encoded)"
                ));
            }

            if (mimeType == null || mimeType.isEmpty()) {
                logger.error("❌ Missing 'mimeType' field in request body");
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Missing 'mimeType' field",
                    "message", "Request body must contain 'mimeType' (e.g., 'image/jpeg')"
                ));
            }

            logger.info("📸 Image size: {} bytes", base64Image.length());
            logger.info("🎯 Mime type: {}", mimeType);

            // Remove the "data:image/jpeg;base64," prefix if present
            String imageData = base64Image.contains(",")
                ? base64Image.split(",")[1]
                : base64Image;

            // VERSION 13.0 - STABLE (2026 Models)
            String[] modelsToTry = {
                "gemini-2.5-flash",
                "gemini-2.5-pro",
                "gemini-2.0-flash",
                "gemini-flash-latest"
            };

            ResponseEntity<Map> response = null;
            String lastUsedModel = "";
            Exception lastException = null;
            String baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/";

            String requestBody = """
            {
              "contents": [{
                "parts": [
                  {
                    "inline_data": {
                      "mime_type": "%s",
                      "data": "%s"
                    }
                  },
                  {
                    "text": "Analyze this building photo. Return ONLY valid JSON, no markdown, no explanation: {\\"buildings\\": <number>, \\"floors\\": <number>, \\"apartments_per_floor\\": <number>, \\"confidence\\": \\"low|medium|high\\"}"
                  }
                ]
              }]
            }
            """.formatted(mimeType, imageData);

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

            logger.info("📤 Calling Gemini API (2026 Stable)...");
            for (String modelName : modelsToTry) {
                try {
                    String currentUrl = baseUrl + modelName + ":generateContent?key=" + GEMINI_API_KEY;
                    logger.info("🚀 Trying model: {}", modelName);
                    response = restTemplate.postForEntity(currentUrl, request, Map.class);
                    lastUsedModel = modelName;
                    break; // SUCCESS!
                } catch (Exception e) {
                    logger.warn("⚠️ Model {} failed, trying next...", modelName);
                    lastException = e;
                }
            }

            if (response == null) {
                throw lastException != null ? lastException : new Exception("All models failed");
            }

            logger.info("✅ Success! Using model: {}", lastUsedModel);

            // Extract the JSON text from Gemini's response
            Map responseBody = response.getBody();
            if (responseBody == null) {
                logger.error("❌ Gemini API returned null response body");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "API Error",
                    "message", "Gemini API returned empty response"
                ));
            }

            List<Map> candidates = (List<Map>) responseBody.get("candidates");
            if (candidates == null || candidates.isEmpty()) {
                logger.error("❌ No candidates in Gemini response");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "API Error",
                    "message", "Gemini API returned no analysis results"
                ));
            }

            Map content = (Map) candidates.get(0).get("content");
            if (content == null) {
                logger.error("❌ No content in first candidate");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "API Error",
                    "message", "Gemini API response missing content"
                ));
            }

            List<Map> parts = (List<Map>) content.get("parts");
            if (parts == null || parts.isEmpty()) {
                logger.error("❌ No parts in content");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "API Error",
                    "message", "Gemini API response missing parts"
                ));
            }

            String text = (String) parts.get(0).get("text");
            if (text == null || text.isEmpty()) {
                logger.error("❌ No text in first part");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "error", "API Error",
                    "message", "Gemini API response missing text"
                ));
            }

            logger.info("✨ Analysis complete: {}", text);
            return ResponseEntity.ok(Map.of("result", text));

        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            logger.error("❌ Gemini API returned error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            return ResponseEntity.status(e.getStatusCode()).body(Map.of(
                "error", "Gemini API Error",
                "message", "Gemini said: " + e.getResponseBodyAsString()
            ));
        } catch (Exception e) {
            logger.error("❌ Unexpected error in building analysis", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                "error", "Internal Server Error",
                "message", e.getMessage()
            ));
        }
    }
}
