package tn.esprit.pidev.services.communityevents;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tn.esprit.pidev.dto.AnnouncementAiDraftRequest;
import tn.esprit.pidev.dto.AnnouncementAiDraftResponse;
import tn.esprit.pidev.enums.AnnouncementType;
import tn.esprit.pidev.enums.Priority;
import tn.esprit.pidev.enums.TargetScope;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class AnnouncementAiAssistantService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:}")
    private String apiUrl;

    public AnnouncementAiDraftResponse generateDraft(AnnouncementAiDraftRequest request) {
        if (!isGeminiConfigured()) {
            return fallbackDraft(request);
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(buildGeminiRequest(request), headers);

            String response = restTemplate.postForObject(apiUrl + "?key=" + apiKey, entity, String.class);
            return parseDraft(response, request);
        } catch (Exception ex) {
            log.warn("Announcement AI draft failed: {}", ex.getMessage());
            return fallbackDraft(request);
        }
    }

    private boolean isGeminiConfigured() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.equals("mock-only") && apiUrl != null && !apiUrl.isBlank();
    }

    private Map<String, Object> buildGeminiRequest(AnnouncementAiDraftRequest request) {
        return Map.of(
            "contents", List.of(Map.of(
                "parts", List.of(Map.of("text", buildPrompt(request)))
            )),
            "generationConfig", Map.of(
                "temperature", 0.45,
                "responseMimeType", "application/json"
            )
        );
    }

    private String buildPrompt(AnnouncementAiDraftRequest request) {
        return """
            You are an assistant for condominium and residential community management.
            Convert rough admin notes into a clear resident announcement draft.

            Admin notes:
            %s

            Requested language: %s
            Requested tone: %s
            Target scope hint: %s
            Building name hint: %s

            Rules:
            - Return STRICT JSON only.
            - Do not publish anything.
            - Do not invent critical facts such as dates, times, buildings, or safety instructions.
            - If details are missing, write neutral wording and avoid fake specifics.
            - Make the result professional, concise, and easy for residents to understand.
            - If the announcement is urgent or service-impacting, choose HIGH or URGENT priority.
            - Pick the closest type from: GENERAL, EVENT_RELATED, MAINTENANCE, EMERGENCY, NOTICE.
            - Pick priority from: LOW, MEDIUM, HIGH, URGENT.
            - Pick suggestedTargetScope from: ORGANIZATION, BUILDING.

            JSON shape:
            {
              "title": "max 120 characters",
              "content": "max 1500 characters",
              "type": "GENERAL",
              "priority": "MEDIUM",
              "suggestedTargetScope": "ORGANIZATION",
              "suggestedBuildingName": null
            }
            """.formatted(
            nullToFallback(request.getPrompt(), ""),
            normalizeLanguage(request.getLanguage()),
            normalizeTone(request.getTone()),
            request.getTargetScope() != null ? request.getTargetScope().name() : "not provided",
            nullToFallback(request.getBuildingName(), "not provided")
        );
    }

    private AnnouncementAiDraftResponse parseDraft(String response, AnnouncementAiDraftRequest request) throws Exception {
        JsonNode root = objectMapper.readTree(response);
        String text = root
            .path("candidates").path(0)
            .path("content")
            .path("parts").path(0)
            .path("text")
            .asText("");

        JsonNode draft = objectMapper.readTree(extractJson(text));
        return AnnouncementAiDraftResponse.builder()
            .title(limit(sanitizeText(draft.path("title").asText("Community Announcement")), 120))
            .content(limit(sanitizeText(draft.path("content").asText(request.getPrompt())), 1500))
            .type(parseEnum(AnnouncementType.class, draft.path("type").asText(), AnnouncementType.GENERAL))
            .priority(parseEnum(Priority.class, draft.path("priority").asText(), Priority.MEDIUM))
            .suggestedTargetScope(parseTargetScope(draft.path("suggestedTargetScope").asText(), request.getTargetScope()))
            .suggestedBuildingName(limit(sanitizeNullableText(draft.path("suggestedBuildingName").asText(null)), 120))
            .build();
    }

    private AnnouncementAiDraftResponse fallbackDraft(AnnouncementAiDraftRequest request) {
        TargetScope fallbackScope = request.getTargetScope() != null ? request.getTargetScope() : TargetScope.ORGANIZATION;
        return AnnouncementAiDraftResponse.builder()
            .title("Community Announcement")
            .content(limit(sanitizeText(request.getPrompt()), 1500))
            .type(AnnouncementType.GENERAL)
            .priority(Priority.MEDIUM)
            .suggestedTargetScope(fallbackScope)
            .suggestedBuildingName(limit(sanitizeNullableText(request.getBuildingName()), 120))
            .build();
    }

    private TargetScope parseTargetScope(String value, TargetScope fallback) {
        return parseEnum(TargetScope.class, value, fallback != null ? fallback : TargetScope.ORGANIZATION);
    }

    private <T extends Enum<T>> T parseEnum(Class<T> enumType, String value, T fallback) {
        try {
            return Enum.valueOf(enumType, value.toUpperCase());
        } catch (Exception ex) {
            return fallback;
        }
    }

    private String extractJson(String text) {
        String cleaned = nullToFallback(text, "")
            .replace("```json", "")
            .replace("```", "")
            .trim();
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return cleaned.substring(start, end + 1);
        }
        return cleaned;
    }

    private String normalizeLanguage(String language) {
        String normalized = nullToFallback(language, "EN").trim().toUpperCase();
        return switch (normalized) {
            case "FR", "FRENCH" -> "FR";
            case "AR", "ARABIC" -> "AR";
            default -> "EN";
        };
    }

    private String normalizeTone(String tone) {
        String normalized = nullToFallback(tone, "PROFESSIONAL").trim().toUpperCase();
        return switch (normalized) {
            case "FRIENDLY", "URGENT", "FORMAL" -> normalized;
            default -> "PROFESSIONAL";
        };
    }

    private String sanitizeText(String value) {
        return nullToFallback(value, "")
            .replaceAll("[\\r\\n\\t]+", " ")
            .replaceAll("\\s+", " ")
            .trim();
    }

    private String sanitizeNullableText(String value) {
        String sanitized = sanitizeText(value);
        return sanitized.isBlank() || sanitized.equalsIgnoreCase("null") ? null : sanitized;
    }

    private String limit(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, Math.max(0, maxLength - 1)).trim() + "...";
    }

    private String nullToFallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
