import { describe, it, expect } from 'vitest';
import {
  deriveSelectiveCredential,
  verifySelectiveDisclosure,
  verifyRedactedField,
} from './selective-disclosure.js';
import type { VerifiableCredential } from './credentials.js';

function createTestCredential(): VerifiableCredential {
  return {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'ProfessionalEngineerCredential'],
    issuer: 'did:key:z6MkTestIssuer',
    issuanceDate: '2025-01-01T00:00:00Z',
    credentialSubject: {
      id: 'did:key:z6MkTestSubject',
      licenseNumber: 'ENG-12345',
      specialization: 'civil_engineering',
      issuingAuthority: 'Ministry of Equipment',
    },
    proof: {
      type: 'Ed25519Signature2020',
      created: '2025-01-01T00:00:00Z',
      verificationMethod: 'did:key:z6MkTestIssuer#z6MkTestIssuer',
      proofPurpose: 'assertionMethod',
      proofValue: 'test-signature',
    },
  };
}

describe('Selective Disclosure', () => {
  describe('deriveSelectiveCredential()', () => {
    it('only discloses requested fields', () => {
      const credential = createTestCredential();
      const derived = deriveSelectiveCredential({
        credential,
        disclosedFields: ['licenseNumber'],
      });

      expect(derived.disclosed).toHaveProperty('licenseNumber', 'ENG-12345');
      expect(derived.disclosed).not.toHaveProperty('specialization');
      expect(derived.disclosed).not.toHaveProperty('issuingAuthority');

      // Redacted fields should have hashes
      expect(derived.redactedHashes).toHaveProperty('specialization');
      expect(derived.redactedHashes).toHaveProperty('issuingAuthority');
      expect(derived.redactedHashes).not.toHaveProperty('licenseNumber');
    });

    it('always includes the id field', () => {
      const credential = createTestCredential();
      const derived = deriveSelectiveCredential({
        credential,
        disclosedFields: ['licenseNumber'],
      });

      expect(derived.disclosed).toHaveProperty('id', 'did:key:z6MkTestSubject');
      expect(derived.redactedHashes).not.toHaveProperty('id');
    });
  });

  describe('verifySelectiveDisclosure()', () => {
    it('returns true for correctly derived credential', () => {
      const credential = createTestCredential();
      const disclosedFields = ['licenseNumber'];
      const derived = deriveSelectiveCredential({
        credential,
        disclosedFields,
      });

      const valid = verifySelectiveDisclosure(derived, disclosedFields);
      expect(valid).toBe(true);
    });

    it('returns false for tampered proof', () => {
      const credential = createTestCredential();
      const disclosedFields = ['licenseNumber'];
      const derived = deriveSelectiveCredential({
        credential,
        disclosedFields,
      });

      // Tamper with the disclosure proof
      derived.disclosureProof = 'tampered-proof-value';

      const valid = verifySelectiveDisclosure(derived, disclosedFields);
      expect(valid).toBe(false);
    });
  });

  describe('verifyRedactedField()', () => {
    it('correctly verifies revealed field hash', () => {
      const credential = createTestCredential();
      const salt = 'test-salt';
      const derived = deriveSelectiveCredential({
        credential,
        disclosedFields: ['licenseNumber'],
        salt,
      });

      // The 'specialization' field was redacted — verify it with the correct value
      const hash = derived.redactedHashes['specialization']!;
      const valid = verifyRedactedField('specialization', 'civil_engineering', hash, salt);
      expect(valid).toBe(true);

      // Wrong value should fail
      const invalid = verifyRedactedField('specialization', 'wrong_value', hash, salt);
      expect(invalid).toBe(false);
    });
  });
});
