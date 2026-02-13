import type { AssuranceTier } from '@tml/types';

export const ASSURANCE_TIER_WEIGHTS: Record<AssuranceTier, number> = {
  biometric: 1.0,
  ussd: 0.6,
  cso_mediated: 0.4,
};
