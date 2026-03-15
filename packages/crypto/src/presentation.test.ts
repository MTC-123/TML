import { describe, it, expect } from 'vitest';
import { generateKeyPair, createDID, issueCredential } from './index.js';
import { createPresentation, verifyPresentation } from './presentation.js';

function createTestCredential() {
  const keyPair = generateKeyPair();
  const did = createDID(keyPair.publicKey);
  const credential = issueCredential({
    type: 'ProfessionalEngineerCredential',
    issuerDid: did,
    issuerPrivateKey: keyPair.privateKey,
    subject: {
      id: did,
      licenseNumber: 'TEST-001',
      specialization: 'civil',
      issuingAuthority: 'Test',
    },
  });
  return { keyPair, did, credential };
}

describe('Verifiable Presentations', () => {
  it('should create a valid Verifiable Presentation', () => {
    const { keyPair, did, credential } = createTestCredential();

    const presentation = createPresentation({
      holderDid: did,
      holderPrivateKey: keyPair.privateKey,
      credentials: [credential],
      challenge: 'test-challenge-001',
    });

    expect(presentation['@context']).toEqual(['https://www.w3.org/2018/credentials/v1']);
    expect(presentation.type).toEqual(['VerifiablePresentation']);
    expect(presentation.holder).toBe(did);
    expect(presentation.verifiableCredential).toHaveLength(1);
    expect(presentation.verifiableCredential[0]).toEqual(credential);

    // Proof structure
    expect(presentation.proof).toBeDefined();
    expect(presentation.proof.type).toBe('Ed25519Signature2020');
    expect(presentation.proof.proofPurpose).toBe('authentication');
    expect(presentation.proof.challenge).toBe('test-challenge-001');
    expect(presentation.proof.verificationMethod).toBeDefined();
    expect(presentation.proof.proofValue).toBeDefined();
    expect(presentation.proof.created).toBeDefined();
  });

  it('should verify a valid presentation', () => {
    const { keyPair, did, credential } = createTestCredential();
    const challenge = 'verify-challenge-002';

    const presentation = createPresentation({
      holderDid: did,
      holderPrivateKey: keyPair.privateKey,
      credentials: [credential],
      challenge,
    });

    const result = verifyPresentation(presentation, challenge);

    expect(result.valid).toBe(true);
    expect(result.presentationErrors).toHaveLength(0);
  });

  it('should detect challenge mismatch (replay attack)', () => {
    const { keyPair, did, credential } = createTestCredential();

    const presentation = createPresentation({
      holderDid: did,
      holderPrivateKey: keyPair.privateKey,
      credentials: [credential],
      challenge: 'abc',
    });

    const result = verifyPresentation(presentation, 'xyz');

    expect(result.valid).toBe(false);
    expect(result.presentationErrors).toEqual(
      expect.arrayContaining([expect.stringContaining('Challenge mismatch')]),
    );
  });

  it('should detect tampered presentation signature', () => {
    const { keyPair, did, credential } = createTestCredential();
    const challenge = 'tamper-challenge-004';

    const presentation = createPresentation({
      holderDid: did,
      holderPrivateKey: keyPair.privateKey,
      credentials: [credential],
      challenge,
    });

    // Tamper with the proof value
    presentation.proof.proofValue = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';

    const result = verifyPresentation(presentation, challenge);

    expect(result.valid).toBe(false);
    expect(result.presentationErrors).toEqual(
      expect.arrayContaining([expect.stringContaining('signature')]),
    );
  });

  it('should verify embedded credentials', () => {
    const { keyPair, did, credential } = createTestCredential();
    const challenge = 'cred-verify-005';

    const presentation = createPresentation({
      holderDid: did,
      holderPrivateKey: keyPair.privateKey,
      credentials: [credential],
      challenge,
    });

    const result = verifyPresentation(presentation, challenge);

    expect(result.valid).toBe(true);
    expect(result.credentialResults).toHaveLength(1);
    expect(result.credentialResults[0].index).toBe(0);
    expect(result.credentialResults[0].valid).toBe(true);
    expect(result.credentialResults[0].errors).toHaveLength(0);
  });
});
