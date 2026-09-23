package tn.esprit.pidev.services.communityevents;

import tn.esprit.pidev.entities.communityevents.EventParticipation;

import java.util.List;

public interface EventParticipationService {
    EventParticipation register(EventParticipation participation);
    List<EventParticipation> getByEvent(String eventId);
    List<EventParticipation> getByAccount(String accountId);
    void unregister(String eventId, String accountId, String organizationId);
}
