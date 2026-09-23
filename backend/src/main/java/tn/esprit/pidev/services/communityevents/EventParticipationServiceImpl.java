package tn.esprit.pidev.services.communityevents;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.communityevents.CommunityEvent;
import tn.esprit.pidev.entities.communityevents.EventParticipation;
import tn.esprit.pidev.enums.EventStatus;
import tn.esprit.pidev.enums.ParticipationStatus;
import tn.esprit.pidev.exception.*;
import tn.esprit.pidev.repositories.communityevents.CommunityEventRepository;
import tn.esprit.pidev.repositories.communityevents.EventParticipationRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventParticipationServiceImpl implements EventParticipationService {

    private final EventParticipationRepository repository;
    private final CommunityEventRepository CommunityEventRepository;

    @Override
    public EventParticipation register(EventParticipation participation) {
        LocalDateTime now = LocalDateTime.now();

        EventParticipation existingParticipation = repository.findByEventIdAndAccountId(
            participation.getEventId(),
            participation.getAccountId()
        ).orElse(null);

        if (existingParticipation != null && existingParticipation.getStatus() != ParticipationStatus.CANCELLED) {
            throw new ConflictException("User already registered for this event");
        }

        CommunityEvent event = CommunityEventRepository
            .findById(participation.getEventId())
            .orElseThrow(() -> new NotFoundException("Event not found"));
        validateEventAccess(event, participation.getOrganizationId());
        validateRegistrationWindow(event, now);

        long currentCount = repository.countByEventIdAndStatus(
            participation.getEventId(),
            ParticipationStatus.REGISTERED
        );

        if (event.getMaxCapacity() != null && currentCount >= event.getMaxCapacity()) {
            throw new ConflictException("Event is full");
        }

        if (existingParticipation != null) {
            existingParticipation.setOrganizationId(participation.getOrganizationId());
            existingParticipation.setStatus(ParticipationStatus.REGISTERED);
            existingParticipation.setRegisteredAt(now);
            existingParticipation.setUpdatedAt(now);
            return repository.save(existingParticipation);
        }

        participation.setStatus(ParticipationStatus.REGISTERED);
        participation.setRegisteredAt(now);
        participation.setUpdatedAt(now);

        return repository.save(participation);
    }

    @Override
    public List<EventParticipation> getByEvent(String eventId) {
        return repository.findByEventId(eventId);
    }

    @Override
    public List<EventParticipation> getByAccount(String accountId) {
        return repository.findByAccountId(accountId);
    }

    @Override
    public void unregister(String eventId, String accountId, String organizationId) {
        LocalDateTime now = LocalDateTime.now();
        CommunityEvent event = CommunityEventRepository
            .findById(eventId)
            .orElseThrow(() -> new NotFoundException("Event not found"));
        validateEventAccess(event, organizationId);
        if (event.getStartDate() != null && !event.getStartDate().isAfter(now)) {
            throw new BadRequestException("Cannot unregister after the event has started");
        }

        EventParticipation participation = repository.findByEventIdAndAccountId(eventId, accountId)
            .orElseThrow(() -> new NotFoundException("Participation not found for this event and user"));
        if (participation.getStatus() != ParticipationStatus.REGISTERED) {
            throw new BadRequestException("Participation is not active");
        }

        participation.setStatus(ParticipationStatus.CANCELLED);
        participation.setUpdatedAt(now);
        repository.save(participation);
    }

    private void validateEventAccess(CommunityEvent event, String organizationId) {
        if (!event.getOrganizationId().equals(organizationId)) {
            throw new NotFoundException("Event not found");
        }
    }

    private void validateRegistrationWindow(CommunityEvent event, LocalDateTime now) {
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new BadRequestException("Only published events accept registrations");
        }
        if (event.getStartDate() != null && !event.getStartDate().isAfter(now)) {
            throw new BadRequestException("Cannot register for an event that already started");
        }
    }
}
