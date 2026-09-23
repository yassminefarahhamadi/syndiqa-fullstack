package tn.esprit.pidev.services.communityevents;

import tn.esprit.pidev.entities.communityevents.CommunityEvent;

import java.util.List;

public interface CommunityEventService {
    CommunityEvent createEvent(CommunityEvent event);
    List<CommunityEvent> getAllEvents(String organizationId);
    CommunityEvent getEventById(String id, String organizationId);
    CommunityEvent updateEvent(String id, CommunityEvent eventDetails, String organizationId);
    CommunityEvent publishEvent(String id, String organizationId);
    CommunityEvent cancelEvent(String id, String organizationId);
    CommunityEvent completeEvent(String id, String organizationId);
    void deleteEvent(String id, String organizationId);
}
