package tn.esprit.pidev.services.communityevents;

import tn.esprit.pidev.dto.EventFeedbackRequest;
import tn.esprit.pidev.dto.EventFeedbackSummaryResponse;
import tn.esprit.pidev.entities.communityevents.EventFeedback;

import java.util.List;

public interface EventFeedbackService {
    EventFeedback createOrUpdateFeedback(String eventId, String accountId, String organizationId, EventFeedbackRequest request);
    List<EventFeedback> getFeedbackForEvent(String eventId, String organizationId);
    EventFeedbackSummaryResponse getFeedbackSummary(String eventId, String organizationId);
    boolean isFeedbackOpen(String eventId, String organizationId);
    boolean canAccountFeedback(String eventId, String accountId, String organizationId);
    boolean hasAccountReviewed(String eventId, String accountId);
}
