import { EventCategory, EventStatus } from './enums.model';

export interface CommunityEvent {
  id?: string;
  organizationId: string;
  title: string;
  description: string;
  category: EventCategory;
  status: EventStatus;
  startDate: string;
  endDate: string;
  location: string;
  maxCapacity?: number | null;
  registeredCount: number;
  availableSpots: number | null;
  accountId: string;
  buildingId?: string | null;
  aiPosterSvg?: string | null;
  aiPosterGeneratedAt?: string | null;
  averageRating: number;
  feedbackCount: number;
  feedbackOpen: boolean;
  currentUserCanFeedback: boolean;
  currentUserReviewed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventFeedback {
  id: string;
  eventId: string;
  accountId: string;
  organizationId: string;
  accountFirstName?: string | null;
  accountLastName?: string | null;
  accountName?: string | null;
  residentName?: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventFeedbackSummary {
  eventId: string;
  averageRating: number;
  feedbackCount: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
}

export interface EventFeedbackRequest {
  rating: number;
  comment?: string;
}
