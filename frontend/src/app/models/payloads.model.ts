import { AnnouncementTargetScope, EventCategory, AnnouncementType, Priority } from './enums.model';

export interface CreateCommunityEventRequest {
  title: string;
  description: string;
  category: EventCategory;
  startDate: string;
  endDate: string;
  location: string;
  maxCapacity?: number;
  buildingId?: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  type: AnnouncementType;
  priority: Priority;
  targetScope: AnnouncementTargetScope;
  buildingId?: string | null;
  requiresAcknowledgement: boolean;
  pinned: boolean;
  pinnedUntil?: string | null;
}

export interface CreateEventParticipationRequest {
  eventId: string;
}
