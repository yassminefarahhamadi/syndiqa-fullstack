package tn.esprit.pidev.services.communityevents;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.dto.CommunityDashboardResponse;
import tn.esprit.pidev.entities.communityevents.Announcement;
import tn.esprit.pidev.entities.communityevents.CommunityEvent;
import tn.esprit.pidev.entities.communityevents.EventFeedback;
import tn.esprit.pidev.enums.EventStatus;
import tn.esprit.pidev.enums.ParticipationStatus;
import tn.esprit.pidev.enums.Priority;
import tn.esprit.pidev.repositories.communityevents.AnnouncementAcknowledgementRepository;
import tn.esprit.pidev.repositories.communityevents.AnnouncementRepository;
import tn.esprit.pidev.repositories.communityevents.CommunityEventRepository;
import tn.esprit.pidev.repositories.communityevents.EventParticipationRepository;
import tn.esprit.pidev.repositories.communityevents.EventFeedbackRepository;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommunityDashboardService {

    private final CommunityEventRepository communityEventRepository;
    private final EventParticipationRepository eventParticipationRepository;
    private final AnnouncementRepository announcementRepository;
    private final AnnouncementAcknowledgementRepository acknowledgementRepository;
    private final AnnouncementService announcementService;
    private final EventFeedbackRepository eventFeedbackRepository;

    public CommunityDashboardResponse getStats(String organizationId) {
        LocalDateTime now = LocalDateTime.now();
        List<CommunityEvent> events = communityEventRepository.findByOrganizationId(organizationId);
        List<Announcement> announcements = announcementRepository.findByOrganizationId(organizationId);
        List<EventFeedback> eventFeedback = eventFeedbackRepository.findByOrganizationId(organizationId);

        long totalRegistrations = events.stream()
            .mapToLong(event -> eventParticipationRepository.countByEventIdAndStatus(
                event.getId(),
                ParticipationStatus.REGISTERED
            ))
            .sum();

        long fullEvents = events.stream()
            .filter(event -> event.getMaxCapacity() != null)
            .filter(event -> eventParticipationRepository.countByEventIdAndStatus(
                event.getId(),
                ParticipationStatus.REGISTERED
            ) >= event.getMaxCapacity())
            .count();

        long totalAcknowledgements = announcements.stream()
            .mapToLong(announcement -> acknowledgementRepository.countByAnnouncementId(announcement.getId()))
            .sum();

        long acknowledgementRequiredAnnouncements = announcements.stream()
            .filter(Announcement::isRequiresAcknowledgement)
            .count();
        long acknowledgedRequiredAnnouncements = announcements.stream()
            .filter(Announcement::isRequiresAcknowledgement)
            .filter(announcement -> acknowledgementRepository.countByAnnouncementId(announcement.getId()) > 0)
            .count();
        Map<String, List<EventFeedback>> feedbackByEvent = eventFeedback.stream()
            .collect(Collectors.groupingBy(EventFeedback::getEventId));
        double averageEventRating = eventFeedback.stream()
            .mapToInt(EventFeedback::getRating)
            .average()
            .orElse(0.0);
        Optional<EventRatingMetric> highestRatedEvent = ratingMetrics(events, feedbackByEvent).stream()
            .max(Comparator.comparingDouble(EventRatingMetric::averageRating));
        Optional<EventRatingMetric> lowestRatedEvent = ratingMetrics(events, feedbackByEvent).stream()
            .min(Comparator.comparingDouble(EventRatingMetric::averageRating));

        return CommunityDashboardResponse.builder()
            .totalEvents(events.size())
            .upcomingEvents(events.stream()
                .filter(event -> event.getStartDate() != null && event.getStartDate().isAfter(now))
                .count())
            .publishedEvents(events.stream()
                .filter(event -> event.getStatus() == EventStatus.PUBLISHED)
                .count())
            .fullEvents(fullEvents)
            .totalRegistrations(totalRegistrations)
            .totalAnnouncements(announcements.size())
            .urgentAnnouncements(announcements.stream()
                .filter(announcement -> announcement.getPriority() == Priority.URGENT)
                .count())
            .pinnedAnnouncements(announcements.stream()
                .filter(announcementService::isPinActive)
                .count())
            .acknowledgementRequiredAnnouncements(acknowledgementRequiredAnnouncements)
            .totalAcknowledgements(totalAcknowledgements)
            .pendingAcknowledgements(acknowledgementRequiredAnnouncements - acknowledgedRequiredAnnouncements)
            .averageEventRating(roundOneDecimal(averageEventRating))
            .totalEventFeedback(eventFeedback.size())
            .highestRatedEventId(highestRatedEvent.map(EventRatingMetric::eventId).orElse(null))
            .highestRatedEventTitle(highestRatedEvent.map(EventRatingMetric::title).orElse(null))
            .highestRatedEventAverage(highestRatedEvent.map(EventRatingMetric::averageRating).orElse(0.0))
            .lowestRatedEventId(lowestRatedEvent.map(EventRatingMetric::eventId).orElse(null))
            .lowestRatedEventTitle(lowestRatedEvent.map(EventRatingMetric::title).orElse(null))
            .lowestRatedEventAverage(lowestRatedEvent.map(EventRatingMetric::averageRating).orElse(0.0))
            .build();
    }

    private List<EventRatingMetric> ratingMetrics(List<CommunityEvent> events, Map<String, List<EventFeedback>> feedbackByEvent) {
        return events.stream()
            .filter(event -> feedbackByEvent.containsKey(event.getId()))
            .map(event -> {
                double average = feedbackByEvent.get(event.getId()).stream()
                    .mapToInt(EventFeedback::getRating)
                    .average()
                    .orElse(0.0);
                return new EventRatingMetric(event.getId(), event.getTitle(), roundOneDecimal(average));
            })
            .toList();
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private record EventRatingMetric(String eventId, String title, double averageRating) {
    }
}
