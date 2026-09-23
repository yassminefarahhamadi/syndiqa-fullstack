import { ParticipationStatus } from './enums.model';

export interface EventParticipation {
  id?: string;
  eventId: string;
  accountId: string;
  organizationId: string;
  status: ParticipationStatus;
  registeredAt?: string;
  updatedAt?: string;
}
