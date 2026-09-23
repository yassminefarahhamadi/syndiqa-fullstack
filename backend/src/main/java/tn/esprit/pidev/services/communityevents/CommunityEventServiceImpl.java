package tn.esprit.pidev.services.communityevents;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tn.esprit.pidev.entities.communityevents.CommunityEvent;
import tn.esprit.pidev.enums.EventStatus;
import tn.esprit.pidev.exception.BadRequestException;
import tn.esprit.pidev.exception.NotFoundException;
import tn.esprit.pidev.repositories.communityevents.CommunityEventRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CommunityEventServiceImpl implements CommunityEventService {

    private final CommunityEventRepository communityEventRepository;
    private final EventPosterAiService eventPosterAiService;

    @Override
    public CommunityEvent createEvent(CommunityEvent event) {
        validateEventDates(event.getStartDate(), event.getEndDate());
        event.setStatus(EventStatus.DRAFT);
        event.setCreatedAt(LocalDateTime.now());
        event.setUpdatedAt(LocalDateTime.now());
        eventPosterAiService.generatePosterSvg(event).ifPresent(svg -> {
            event.setAiPosterSvg(svg);
            event.setAiPosterGeneratedAt(LocalDateTime.now());
        });
        return communityEventRepository.save(event);
    }

    @Override
    public List<CommunityEvent> getAllEvents(String organizationId) {
        return communityEventRepository.findByOrganizationId(organizationId);
    }

    @Override
    public CommunityEvent getEventById(String id, String organizationId) {
        CommunityEvent event = communityEventRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Event not found with id: " + id));
        if (!organizationId.equals(event.getOrganizationId())) {
            throw new NotFoundException("Event not found with id: " + id);
        }
        return event;
    }

    @Override
    public CommunityEvent updateEvent(String id, CommunityEvent eventDetails, String organizationId) {
        CommunityEvent event = getEventById(id, organizationId);

        event.setTitle(eventDetails.getTitle());
        event.setDescription(eventDetails.getDescription());
        event.setCategory(eventDetails.getCategory());
        event.setStartDate(eventDetails.getStartDate());
        event.setEndDate(eventDetails.getEndDate());
        event.setLocation(eventDetails.getLocation());
        event.setMaxCapacity(eventDetails.getMaxCapacity());
        event.setBuildingId(eventDetails.getBuildingId());
        validateEventDates(event.getStartDate(), event.getEndDate());
        event.setUpdatedAt(LocalDateTime.now());

        return communityEventRepository.save(event);
    }

    @Override
    public CommunityEvent publishEvent(String id, String organizationId) {
        CommunityEvent event = getEventById(id, organizationId);
        if (event.getStatus() != EventStatus.DRAFT) {
            throw new BadRequestException("Only draft events can be published");
        }
        if (event.getStartDate() != null && !event.getStartDate().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("Cannot publish an event that already started");
        }
        event.setStatus(EventStatus.PUBLISHED);
        event.setUpdatedAt(LocalDateTime.now());
        return communityEventRepository.save(event);
    }

    @Override
    public CommunityEvent cancelEvent(String id, String organizationId) {
        CommunityEvent event = getEventById(id, organizationId);
        if (event.getStatus() == EventStatus.COMPLETED) {
            throw new BadRequestException("Completed events cannot be cancelled");
        }
        if (event.getStatus() == EventStatus.CANCELLED) {
            throw new BadRequestException("Event is already cancelled");
        }
        event.setStatus(EventStatus.CANCELLED);
        event.setUpdatedAt(LocalDateTime.now());
        return communityEventRepository.save(event);
    }

    @Override
    public CommunityEvent completeEvent(String id, String organizationId) {
        CommunityEvent event = getEventById(id, organizationId);
        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new BadRequestException("Only published events can be completed");
        }
        event.setStatus(EventStatus.COMPLETED);
        event.setUpdatedAt(LocalDateTime.now());
        return communityEventRepository.save(event);
    }

    @Override
    public void deleteEvent(String id, String organizationId) {
        CommunityEvent event = getEventById(id, organizationId);
        communityEventRepository.delete(event);
    }

    private void validateEventDates(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate != null && endDate != null && !endDate.isAfter(startDate)) {
            throw new BadRequestException("endDate must be after startDate");
        }
    }
}
