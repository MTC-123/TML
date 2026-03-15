import { describe, it, expect } from 'vitest';
import { USSD_STRINGS, getStrings, type UssdLocale } from './ussd-locales.js';

describe('USSD Locales', () => {
  const locales: UssdLocale[] = ['fr', 'ar', 'amz'];

  it('all locales have all required string keys', () => {
    const requiredKeys = [
      'welcome', 'verifyProject', 'help', 'enterProjectCode', 'invalidCode',
      'projectNotFound', 'noActiveMilestone', 'votePrompt', 'voteYes', 'voteNo', 'voteUnsure',
      'enterOtp', 'invalidOtp', 'expiredOtp', 'usedOtp', 'smsFailed', 'notRegistered',
      'alreadyAttested', 'notEnrolled', 'notReady', 'thankYouNegative', 'thankYouUnsure',
      'attestationSuccess', 'systemError', 'invalidInput', 'helpText', 'languagePrompt',
    ];

    for (const locale of locales) {
      const strings = getStrings(locale);
      for (const key of requiredKeys) {
        expect(strings).toHaveProperty(key);
      }
    }
  });

  it('getStrings returns Arabic strings', () => {
    const strings = getStrings('ar');
    expect(strings.welcome).toContain('مرحبا');
  });

  it('getStrings returns Amazigh strings', () => {
    const strings = getStrings('amz');
    expect(strings.welcome).toContain('ⴰⵣⵓⵍ');
  });

  it('votePrompt functions return correct format', () => {
    for (const locale of locales) {
      const strings = getStrings(locale);
      const result = strings.votePrompt('Test Project', 'Phase 1');
      expect(result).toContain('Test Project');
      expect(result).toContain('CON');
    }
  });

  it('USSD_STRINGS contains all three locales', () => {
    expect(Object.keys(USSD_STRINGS)).toEqual(['fr', 'ar', 'amz']);
  });

  it('attestationSuccess functions return reference code', () => {
    for (const locale of locales) {
      const strings = getStrings(locale);
      const result = strings.attestationSuccess('ATT-ABC123');
      expect(result).toContain('ATT-ABC123');
      expect(result.startsWith('END')).toBe(true);
    }
  });
});
