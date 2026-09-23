package tn.esprit.pidev.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import tn.esprit.pidev.dto.AnnouncementAiDraftRequest;
import tn.esprit.pidev.dto.AnnouncementAiDraftResponse;
import tn.esprit.pidev.enums.AnnouncementType;
import tn.esprit.pidev.enums.Priority;
import tn.esprit.pidev.enums.TargetScope;
import tn.esprit.pidev.services.communityevents.AnnouncementAiAssistantService;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AnnouncementAiAssistantServiceTest {

    @Test
    void generateDraftFallsBackWhenGeminiIsNotConfigured() {
        AnnouncementAiAssistantService service = new AnnouncementAiAssistantService();
        ReflectionTestUtils.setField(service, "apiKey", "");
        ReflectionTestUtils.setField(service, "apiUrl", "");

        AnnouncementAiDraftResponse response = service.generateDraft(AnnouncementAiDraftRequest.builder()
            .prompt("water off building b monday 9 to 12")
            .targetScope(TargetScope.BUILDING)
            .buildingName("Building B")
            .build());

        assertEquals("Community Announcement", response.getTitle());
        assertEquals("water off building b monday 9 to 12", response.getContent());
        assertEquals(AnnouncementType.GENERAL, response.getType());
        assertEquals(Priority.MEDIUM, response.getPriority());
        assertEquals(TargetScope.BUILDING, response.getSuggestedTargetScope());
        assertEquals("Building B", response.getSuggestedBuildingName());
    }

    @Test
    void parseDraftNormalizesGeminiResponse() throws Exception {
        AnnouncementAiAssistantService service = new AnnouncementAiAssistantService();
        Method parseDraft = AnnouncementAiAssistantService.class.getDeclaredMethod(
            "parseDraft",
            String.class,
            AnnouncementAiDraftRequest.class
        );
        parseDraft.setAccessible(true);

        String geminiResponse = """
            {
              "candidates": [
                {
                  "content": {
                    "parts": [
                      {
                        "text": "{\\"title\\":\\"Scheduled Water Interruption - Building B\\",\\"content\\":\\"Please note that water service will be unavailable in Building B on Monday from 9:00 to 12:00.\\",\\"type\\":\\"MAINTENANCE\\",\\"priority\\":\\"HIGH\\",\\"suggestedTargetScope\\":\\"BUILDING\\",\\"suggestedBuildingName\\":\\"Building B\\"}"
                      }
                    ]
                  }
                }
              ]
            }
            """;

        AnnouncementAiDraftResponse response = (AnnouncementAiDraftResponse) parseDraft.invoke(
            service,
            geminiResponse,
            AnnouncementAiDraftRequest.builder().prompt("water off").build()
        );

        assertEquals("Scheduled Water Interruption - Building B", response.getTitle());
        assertEquals(AnnouncementType.MAINTENANCE, response.getType());
        assertEquals(Priority.HIGH, response.getPriority());
        assertEquals(TargetScope.BUILDING, response.getSuggestedTargetScope());
        assertEquals("Building B", response.getSuggestedBuildingName());
    }
}
