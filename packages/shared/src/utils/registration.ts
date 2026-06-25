export type RegistrationMode = 'INDIVIDUAL' | 'OPTIONAL_TEAM' | 'MANDATORY_TEAM';

export function getRegistrationMode(event: {
  eventType: string;
  minTeamSize?: number | null;
  maxTeamSize?: number | null;
}): RegistrationMode {
  if (event.eventType === 'INDIVIDUAL') {
    return 'INDIVIDUAL';
  }

  if (event.eventType === 'TEAM') {
    if (event.maxTeamSize === 1) {
      return 'INDIVIDUAL';
    }
    if (event.minTeamSize === 1 && (event.maxTeamSize && event.maxTeamSize > 1)) {
      return 'OPTIONAL_TEAM';
    }
    return 'MANDATORY_TEAM';
  }

  // Fallback
  return 'INDIVIDUAL';
}
