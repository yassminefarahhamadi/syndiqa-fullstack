package tn.esprit.pidev.services.communityevents;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.EventFeedbackRequest;
import tn.esprit.pidev.dto.EventFeedbackSummaryResponse;
import tn.esprit.pidev.entities.communityevents.CommunityEvent;
import tn.esprit.pidev.entities.communityevents.EventFeedback;
import tn.esprit.pidev.entities.communityevents.EventParticipation;
import tn.esprit.pidev.enums.EventStatus;
import tn.esprit.pidev.enums.ParticipationStatus;
import tn.esprit.pidev.exception.BadRequestException;
import tn.esprit.pidev.exception.NotFoundException;
import tn.esprit.pidev.repositories.communityevents.CommunityEventRepository;
import tn.esprit.pidev.repositories.communityevents.EventFeedbackRepository;
import tn.esprit.pidev.repositories.communityevents.EventParticipationRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class EventFeedbackServiceImpl implements EventFeedbackService {

    private final EventFeedbackRepository eventFeedbackRepository;
    private final CommunityEventRepository communityEventRepository;
    private final EventParticipationRepository eventParticipationRepository;

    @Override
    public EventFeedback createOrUpdateFeedback(String eventId, String accountId, String organizationId, EventFeedbackRequest request) {
        CommunityEvent event = getEventForOrganization(eventId, organizationId);
        validateFeedbackOpen(event);
        validateParticipant(eventId, accountId);

        LocalDateTime now = LocalDateTime.now();
        EventFeedback feedback = eventFeedbackRepository.findByEventIdAndAccountId(eventId, accountId)
            .orElseGet(() -> EventFeedback.builder()
                .eventId(eventId)
                .accountId(accountId)
                .organizationId(organizationId)
                .createdAt(now)
                .build());

        feedback.setRating(request.getRating());
        feedback.setComment(request.getComment());
        feedback.setUpdatedAt(now);
        return eventFeedbackRepository.save(feedback);
    }

    @Override
    public List<EventFeedback> getFeedbackForEvent(String eventId, String organizationId) {
        getEventForOrganization(eventId, organizationId);
        return eventFeedbackRepository.findByEventId(eventId);
    }

    @Override
    public EventFeedbackSummaryResponse getFeedbackSummary(String eventId, String organizationId) {
        getEventForOrganization(eventId, organizationId);
        List<EventFeedback> feedback = eventFeedbackRepository.findByEventId(eventId);
        long feedbackCount = feedback.size();
        double averageRating = feedback.stream()
            .mapToInt(EventFeedback::getRating)
            .average()
            .orElse(0.0);

        return EventFeedbackSummaryResponse.builder()
            .eventId(eventId)
            .averageRating(roundOneDecimal(averageRating))
            .feedbackCount(feedbackCount)
            .positiveCount(feedback.stream().filter(item -> item.getRating() >= 4).count())
            .neutralCount(feedback.stream().filter(item -> item.getRating() == 3).count())
            .negativeCount(feedback.stream().filter(item -> item.getRating() <= 2).count())
            .build();
    }

    @Override
    public boolean isFeedbackOpen(String eventId, String organizationId) {
        CommunityEvent event = getEventForOrganization(eventId, organizationId);
        return isFeedbackOpen(event);
    }

    @Override
    public boolean canAccountFeedback(String eventId, String accountId, String organizationId) {
        CommunityEvent event = getEventForOrganization(eventId, organizationId);
        return isFeedbackOpen(event) && isParticipant(eventId, accountId);
    }

    @Override
    public boolean hasAccountReviewed(String eventId, String accountId) {
        return eventFeedbackRepository.findByEventIdAndAccountId(eventId, accountId).isPresent();
    }

    private CommunityEvent getEventForOrganization(String eventId, String organizationId) {
        CommunityEvent event = communityEventRepository.findById(eventId)
            .orElseThrow(() -> new NotFoundException("Event not found with id: " + eventId));
        if (!organizationId.equals(event.getOrganizationId())) {
            throw new NotFoundException("Event not found with id: " + eventId);
        }
        return event;
    }

    private void validateFeedbackOpen(CommunityEvent event) {
        if (!isFeedbackOpen(event)) {
            throw new BadRequestException("Feedback opens when the event is finished");
        }
    }

    private boolean isFeedbackOpen(CommunityEvent event) {
        return event.getStatus() != EventStatus.CANCELLED
            && event.getEndDate() != null
            && event.getEndDate().isBefore(LocalDateTime.now());
    }

    private void validateParticipant(String eventId, String accountId) {
        if (!isParticipant(eventId, accountId)) {
            throw new BadRequestException("Only event participants can leave feedback");
        }
    }

    private boolean isParticipant(String eventId, String accountId) {
        Optional<EventParticipation> participation = eventParticipationRepository.findByEventIdAndAccountId(eventId, accountId);
        return participation
            .map(EventParticipation::getStatus)
            .filter(status -> status == ParticipationStatus.REGISTERED || status == ParticipationStatus.ATTENDED)
            .isPresent();
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }
}
