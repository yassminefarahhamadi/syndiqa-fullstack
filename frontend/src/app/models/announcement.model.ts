import { AnnouncementTargetScope, AnnouncementType, Priority } from './enums.model';

export interface Announcement {
  id?: string;
  organizationId: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: Priority;
  accountId: string;
  targetScope: AnnouncementTargetScope;
  buildingId: string | null;
  requiresAcknowledgement: boolean;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  acknowledgementCount: number;
  pinned: boolean;
  pinActive: boolean;
  pinnedUntil: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AnnouncementAcknowledgement {
  id?: string;
  announcementId?: string;
  accountId: string;
  acknowledgedAt: string;
}

export interface AnnouncementAiDraftRequest {
  prompt: string;
  language?: 'EN' | 'FR' | 'AR';
  tone?: 'PROFESSIONAL' | 'FRIENDLY' | 'URGENT' | 'FORMAL';
  targetScope?: AnnouncementTargetScope;
  buildingName?: string;
}

export interface AnnouncementAiDraftResponse {
  title: string;
  content: string;
  type: AnnouncementType;
  priority: Priority;
  suggestedTargetScope: AnnouncementTargetScope;
  suggestedBuildingName: string | null;
}
