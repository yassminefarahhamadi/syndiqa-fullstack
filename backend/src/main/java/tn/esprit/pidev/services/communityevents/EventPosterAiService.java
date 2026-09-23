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
import tn.esprit.pidev.entities.communityevents.CommunityEvent;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
public class EventPosterAiService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("EEE, MMM d, yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:}")
    private String apiUrl;

    public Optional<String> generatePosterSvg(CommunityEvent event) {
        PosterDesign design = defaultDesign(event);

        if (isGeminiConfigured()) {
            try {
                design = requestDesignBrief(event).orElse(design);
            } catch (Exception ex) {
                log.warn("Gemini poster brief failed for event '{}': {}", event.getTitle(), ex.getMessage());
            }
        }

        return Optional.of(buildPosterSvg(event, design));
    }

    private boolean isGeminiConfigured() {
        return apiKey != null && !apiKey.isBlank() && !apiKey.equals("mock-only") && apiUrl != null && !apiUrl.isBlank();
    }

    private Optional<PosterDesign> requestDesignBrief(CommunityEvent event) throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(buildDesignRequest(event), headers);

        String response = restTemplate.postForObject(apiUrl + "?key=" + apiKey, entity, String.class);
        String text = extractText(response);
        if (text.isBlank()) {
            return Optional.empty();
        }

        JsonNode json = objectMapper.readTree(extractJson(text));
        return Optional.of(new PosterDesign(
            sanitizeColor(json.path("primaryColor").asText(), "#165DFF"),
            sanitizeColor(json.path("secondaryColor").asText(), "#12B886"),
            sanitizeColor(json.path("accentColor").asText(), "#FFD166"),
            sanitizeText(json.path("headline").asText(nullToFallback(event.getTitle(), "Community Event")), 52),
            sanitizeText(json.path("tagline").asText(nullToFallback(event.getDescription(), "Join your neighbors for a memorable community moment.")), 110),
            sanitizeText(json.path("callToAction").asText("Reserve your spot"), 32)
        ));
    }

    private Map<String, Object> buildDesignRequest(CommunityEvent event) {
        return Map.of(
            "contents", List.of(Map.of(
                "parts", List.of(Map.of("text", buildDesignPrompt(event)))
            )),
            "generationConfig", Map.of(
                "temperature", 0.65,
                "responseMimeType", "application/json"
            )
        );
    }

    private String buildDesignPrompt(CommunityEvent event) {
        return """
            You are an art director for a premium residential community app.
            Create a concise poster design brief for this event.

            Event:
            Title: %s
            Description: %s
            Start: %s
            End: %s
            Location: %s
            Category: %s

            Return STRICT JSON only:
            {
              "primaryColor": "#RRGGBB",
              "secondaryColor": "#RRGGBB",
              "accentColor": "#RRGGBB",
              "headline": "short premium headline, max 8 words",
              "tagline": "short polished subtitle, max 18 words",
              "callToAction": "short CTA, max 4 words"
            }

            Avoid childish language. Make it refined, modern, elegant, and suitable for adults.
            """.formatted(
            nullToFallback(event.getTitle(), "Community Event"),
            nullToFallback(event.getDescription(), "Join your neighbors for a memorable community moment."),
            formatDateTime(event, true),
            formatDateTime(event, false),
            nullToFallback(event.getLocation(), "Location to be announced"),
            event.getCategory() != null ? event.getCategory().name() : "COMMUNITY"
        );
    }

    private String buildPosterSvg(CommunityEvent event, PosterDesign design) {
        String date = event.getStartDate() != null ? event.getStartDate().format(DATE_FORMATTER) : "Date to be announced";
        String time = event.getStartDate() != null ? event.getStartDate().format(TIME_FORMATTER) : "Time TBA";
        if (event.getEndDate() != null) {
            time += " - " + event.getEndDate().format(TIME_FORMATTER);
        }
        String location = nullToFallback(event.getLocation(), "Location to be announced");
        String category = event.getCategory() != null ? event.getCategory().name().replace("_", " ") : "COMMUNITY";

        StringBuilder svg = new StringBuilder();
        svg.append("""
            <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
              <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%%" stop-color="%s"/>
                  <stop offset="58%%" stop-color="%s"/>
                  <stop offset="100%%" stop-color="#111827"/>
                </linearGradient>
                <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%%" stop-color="%s"/>
                  <stop offset="100%%" stop-color="#FFFFFF"/>
                </linearGradient>
              </defs>
              <rect width="1080" height="1350" fill="url(#bg)"/>
              <circle cx="910" cy="170" r="260" fill="#FFFFFF" opacity="0.10"/>
              <circle cx="140" cy="1160" r="330" fill="#FFFFFF" opacity="0.08"/>
              <path d="M0 860 C230 760 390 900 610 800 C800 714 920 638 1080 712 L1080 1350 L0 1350 Z" fill="#FFFFFF" opacity="0.12"/>
              <path d="M0 950 C220 850 430 960 650 875 C820 810 960 820 1080 900 L1080 1350 L0 1350 Z" fill="#FFFFFF" opacity="0.17"/>
              <rect x="70" y="70" width="940" height="1210" rx="42" fill="#0B1220" opacity="0.26"/>
              <rect x="96" y="96" width="888" height="1158" rx="36" fill="#FFFFFF" opacity="0.10"/>
              <text x="126" y="168" fill="#FFFFFF" opacity="0.88" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" letter-spacing="0">%s</text>
              <rect x="126" y="208" width="250" height="8" rx="4" fill="url(#accent)"/>
            """.formatted(
            design.primaryColor(),
            design.secondaryColor(),
            design.accentColor(),
            escapeXml(category)
        ));

        appendTextLines(svg, design.headline(), 126, 365, 76, 86, 9, "#FFFFFF", "800");
        appendTextLines(svg, design.tagline(), 130, 520, 34, 46, 3, "#E5E7EB", "500");

        svg.append("""
              <rect x="126" y="690" width="828" height="252" rx="28" fill="#FFFFFF" opacity="0.92"/>
              <circle cx="214" cy="780" r="42" fill="%s" opacity="0.16"/>
              <circle cx="214" cy="780" r="18" fill="%s"/>
              <text x="290" y="765" fill="#111827" font-family="Arial, Helvetica, sans-serif" font-size="31" font-weight="800" letter-spacing="0">Date and time</text>
              <text x="290" y="813" fill="#374151" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="600" letter-spacing="0">%s</text>
              <text x="290" y="858" fill="#6B7280" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="500" letter-spacing="0">%s</text>
              <line x1="170" y1="902" x2="910" y2="902" stroke="#D1D5DB" stroke-width="2"/>
              <circle cx="214" cy="1000" r="42" fill="%s" opacity="0.16"/>
              <path d="M214 970 C196 970 182 984 182 1002 C182 1029 214 1058 214 1058 C214 1058 246 1029 246 1002 C246 984 232 970 214 970 Z" fill="%s"/>
              <circle cx="214" cy="1001" r="10" fill="#FFFFFF"/>
              <text x="290" y="988" fill="#111827" font-family="Arial, Helvetica, sans-serif" font-size="31" font-weight="800" letter-spacing="0">Location</text>
            """.formatted(
            design.accentColor(),
            design.accentColor(),
            escapeXml(date),
            escapeXml(time),
            design.secondaryColor(),
            design.secondaryColor()
        ));

        appendTextLines(svg, location, 290, 1038, 32, 42, 2, "#374151", "600");

        svg.append("""
              <rect x="126" y="1115" width="360" height="86" rx="43" fill="%s"/>
              <text x="306" y="1169" text-anchor="middle" fill="#111827" font-family="Arial, Helvetica, sans-serif" font-size="31" font-weight="900" letter-spacing="0">%s</text>
              <text x="126" y="1240" fill="#F9FAFB" opacity="0.82" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="600" letter-spacing="0">Cloud4Saya Community</text>
              <text x="954" y="1240" text-anchor="end" fill="#F9FAFB" opacity="0.72" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="600" letter-spacing="0">AI poster</text>
            </svg>
            """.formatted(
            design.accentColor(),
            escapeXml(design.callToAction())
        ));

        return svg.toString();
    }

    private void appendTextLines(StringBuilder svg, String text, int x, int y, int fontSize, int lineHeight,
                                 int maxLines, String fill, String weight) {
        List<String> lines = wrapText(text, Math.max(11, 860 / Math.max(fontSize / 2, 1)), maxLines);
        svg.append("  <text x=\"").append(x).append("\" y=\"").append(y)
            .append("\" fill=\"").append(fill)
            .append("\" font-family=\"Arial, Helvetica, sans-serif\" font-size=\"").append(fontSize)
            .append("\" font-weight=\"").append(weight)
            .append("\" letter-spacing=\"0\">");
        for (int i = 0; i < lines.size(); i++) {
            svg.append("<tspan x=\"").append(x).append("\" dy=\"")
                .append(i == 0 ? 0 : lineHeight)
                .append("\">").append(escapeXml(lines.get(i))).append("</tspan>");
        }
        svg.append("</text>\n");
    }

    private List<String> wrapText(String text, int maxChars, int maxLines) {
        String[] words = nullToFallback(text, "").trim().split("\\s+");
        List<String> lines = new ArrayList<>();
        StringBuilder current = new StringBuilder();

        for (String word : words) {
            if (word.isBlank()) {
                continue;
            }
            if (current.length() + word.length() + 1 > maxChars && !current.isEmpty()) {
                lines.add(current.toString());
                current = new StringBuilder();
                if (lines.size() == maxLines) {
                    break;
                }
            }
            if (!current.isEmpty()) {
                current.append(' ');
            }
            current.append(word);
        }
        if (!current.isEmpty() && lines.size() < maxLines) {
            lines.add(current.toString());
        }
        return lines.isEmpty() ? List.of("") : lines;
    }

    private String extractText(String response) throws Exception {
        JsonNode root = objectMapper.readTree(response);
        return root
            .path("candidates").path(0)
            .path("content")
            .path("parts").path(0)
            .path("text")
            .asText("");
    }

    private String extractJson(String text) {
        String cleaned = text
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

    private PosterDesign defaultDesign(CommunityEvent event) {
        String category = event.getCategory() != null ? event.getCategory().name() : "";
        return switch (category) {
            case "MEETING" -> new PosterDesign("#1746A2", "#2DD4BF", "#FDE047",
                sanitizeText(nullToFallback(event.getTitle(), "Community Meeting"), 52),
                sanitizeText(nullToFallback(event.getDescription(), "A focused gathering for residents and shared decisions."), 110),
                "Join the meeting");
            case "MAINTENANCE" -> new PosterDesign("#0F766E", "#38BDF8", "#FACC15",
                sanitizeText(nullToFallback(event.getTitle(), "Maintenance Notice"), 52),
                sanitizeText(nullToFallback(event.getDescription(), "Important updates for a safer and better residence."), 110),
                "Stay informed");
            case "EMERGENCY" -> new PosterDesign("#991B1B", "#F97316", "#FDE68A",
                sanitizeText(nullToFallback(event.getTitle(), "Urgent Community Alert"), 52),
                sanitizeText(nullToFallback(event.getDescription(), "Please review the details and act accordingly."), 110),
                "Read details");
            case "SPORTS" -> new PosterDesign("#166534", "#06B6D4", "#BBF7D0",
                sanitizeText(nullToFallback(event.getTitle(), "Community Sports Day"), 52),
                sanitizeText(nullToFallback(event.getDescription(), "Energy, teamwork, and a fresh reason to meet your neighbors."), 110),
                "Take part");
            default -> new PosterDesign("#1D4ED8", "#16A34A", "#FBBF24",
                sanitizeText(nullToFallback(event.getTitle(), "Community Event"), 52),
                sanitizeText(nullToFallback(event.getDescription(), "A polished community moment designed for residents."), 110),
                "Reserve your spot");
        };
    }

    private String formatDateTime(CommunityEvent event, boolean start) {
        if (start && event.getStartDate() != null) {
            return event.getStartDate().format(DATE_FORMATTER) + " " + event.getStartDate().format(TIME_FORMATTER);
        }
        if (!start && event.getEndDate() != null) {
            return event.getEndDate().format(DATE_FORMATTER) + " " + event.getEndDate().format(TIME_FORMATTER);
        }
        return "To be announced";
    }

    private String sanitizeColor(String value, String fallback) {
        if (value != null && value.matches("^#[0-9A-Fa-f]{6}$")) {
            return value;
        }
        return fallback;
    }

    private String sanitizeText(String value, int maxLength) {
        String sanitized = nullToFallback(value, "")
            .replaceAll("[\\r\\n\\t]+", " ")
            .replaceAll("\\s+", " ")
            .trim();
        if (sanitized.length() <= maxLength) {
            return sanitized;
        }
        return sanitized.substring(0, Math.max(0, maxLength - 1)).trim() + "...";
    }

    private String escapeXml(String value) {
        return nullToFallback(value, "")
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&apos;");
    }

    private String nullToFallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private record PosterDesign(
        String primaryColor,
        String secondaryColor,
        String accentColor,
        String headline,
        String tagline,
        String callToAction
    ) {
    }
}
