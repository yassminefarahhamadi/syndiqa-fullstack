package tn.esprit.pidev.services.maintenance;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tn.esprit.pidev.dto.maintenance.MaintenanceAiComparisonResult;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

@Slf4j
@Service
public class MaintenanceAiService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    private static final double APPROVAL_THRESHOLD = 90.0;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Compares before/after images using Gemini Vision API.
     * Returns a score (0-100) and a conclusion about the repair quality.
     */
    public MaintenanceAiComparisonResult compareBeforeAfter(
            String taskId,
            String beforeImageUrl,
            String afterImageUrl,
            String issueDescription
    ) {
        try {
            String beforeBase64 = loadImageAsBase64(beforeImageUrl);
            String afterBase64 = loadImageAsBase64(afterImageUrl);

            if (beforeBase64 == null || afterBase64 == null) {
                log.error("Could not load one or both images for comparison");
                return buildErrorResult(taskId, beforeImageUrl, afterImageUrl,
                        "Could not load images for comparison.");
            }

            String beforeMime = guessMimeType(beforeImageUrl);
            String afterMime = guessMimeType(afterImageUrl);

            String prompt = buildPrompt(issueDescription);

            Map<String, Object> requestBody = buildGeminiRequest(
                    beforeBase64, beforeMime,
                    afterBase64, afterMime,
                    prompt
            );

            String url = geminiApiUrl + "?key=" + geminiApiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return parseGeminiResponse(taskId, beforeImageUrl, afterImageUrl, response.getBody());
            }

            log.error("Gemini API returned non-2xx status: {}", response.getStatusCode());
            return buildErrorResult(taskId, beforeImageUrl, afterImageUrl,
                    "AI service returned an error. Please try again.");

        } catch (Exception e) {
            log.error("Error calling Gemini Vision API", e);
            return buildErrorResult(taskId, beforeImageUrl, afterImageUrl,
                    "AI comparison failed: " + e.getMessage());
        }
    }

    private String buildPrompt(String issueDescription) {
        return """
                You are a professional maintenance quality inspector for a residential building management system.

                You are given two images:
                - Image 1 (BEFORE): Shows the state of the issue BEFORE repair/maintenance work.
                - Image 2 (AFTER): Shows the state AFTER the repair/maintenance work was done.

                The reported maintenance issue was: "%s"

                Your task:
                1. Compare the two images carefully.
                2. Assess whether the maintenance/repair work was completed successfully.
                3. Rate the repair quality from 0 to 100 (100 = perfect repair, 0 = no improvement).
                4. Provide a brief conclusion explaining your assessment.

                You MUST respond with ONLY a valid JSON object (no markdown, no extra text):
                {"score": <number 0-100>, "conclusion": "<brief explanation in 1-2 sentences>"}
                """.formatted(issueDescription != null ? issueDescription : "General maintenance issue");
    }

    private Map<String, Object> buildGeminiRequest(
            String beforeBase64, String beforeMime,
            String afterBase64, String afterMime,
            String prompt
    ) {
        Map<String, Object> beforeImagePart = Map.of(
                "inline_data", Map.of(
                        "mime_type", beforeMime,
                        "data", beforeBase64
                )
        );

        Map<String, Object> afterImagePart = Map.of(
                "inline_data", Map.of(
                        "mime_type", afterMime,
                        "data", afterBase64
                )
        );

        Map<String, Object> textPart = Map.of("text", prompt);

        Map<String, Object> content = Map.of(
                "parts", List.of(textPart, beforeImagePart, afterImagePart)
        );

        return Map.of("contents", List.of(content));
    }

    private MaintenanceAiComparisonResult parseGeminiResponse(
            String taskId, String beforeImageUrl, String afterImageUrl, String responseBody
    ) {
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode candidates = root.path("candidates");

            if (candidates.isEmpty()) {
                return buildErrorResult(taskId, beforeImageUrl, afterImageUrl,
                        "AI returned no candidates.");
            }

            String text = candidates.get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText("");

            // Strip markdown code fences if present
            String cleaned = text.trim();
            if (cleaned.startsWith("```json")) {
                cleaned = cleaned.substring(7);
            } else if (cleaned.startsWith("```")) {
                cleaned = cleaned.substring(3);
            }
            if (cleaned.endsWith("```")) {
                cleaned = cleaned.substring(0, cleaned.length() - 3);
            }
            cleaned = cleaned.trim();

            JsonNode parsed = objectMapper.readTree(cleaned);

            double score = parsed.path("score").asDouble(0);
            String conclusion = parsed.path("conclusion").asText("No conclusion provided.");

            boolean approved = score >= APPROVAL_THRESHOLD;

            MaintenanceAiComparisonResult result = new MaintenanceAiComparisonResult();
            result.setTaskId(taskId);
            result.setScore(score);
            result.setConclusion(conclusion);
            result.setApproved(approved);
            result.setBeforeImageUrl(beforeImageUrl);
            result.setAfterImageUrl(afterImageUrl);
            return result;

        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", responseBody, e);
            return buildErrorResult(taskId, beforeImageUrl, afterImageUrl,
                    "Failed to parse AI response.");
        }
    }

    private String loadImageAsBase64(String imageUrl) {
        try {
            // imageUrl is like "http://localhost:8089/uploads/maintenance/xxx.jpg"
            // We need to extract the relative path and read from disk
            String relativePath;
            if (imageUrl.contains("/uploads/")) {
                relativePath = imageUrl.substring(imageUrl.indexOf("/uploads/") + "/uploads/".length());
            } else {
                relativePath = imageUrl;
            }

            Path filePath = Paths.get(uploadDir, relativePath);

            if (!Files.exists(filePath)) {
                log.error("Image file not found: {}", filePath);
                return null;
            }

            byte[] bytes = Files.readAllBytes(filePath);
            return Base64.getEncoder().encodeToString(bytes);

        } catch (IOException e) {
            log.error("Error reading image file: {}", imageUrl, e);
            return null;
        }
    }

    private String guessMimeType(String url) {
        String lower = url.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    private MaintenanceAiComparisonResult buildErrorResult(
            String taskId, String beforeImageUrl, String afterImageUrl, String errorMessage
    ) {
        MaintenanceAiComparisonResult result = new MaintenanceAiComparisonResult();
        result.setTaskId(taskId);
        result.setScore(0);
        result.setConclusion(errorMessage);
        result.setApproved(false);
        result.setBeforeImageUrl(beforeImageUrl);
        result.setAfterImageUrl(afterImageUrl);
        return result;
    }
}
