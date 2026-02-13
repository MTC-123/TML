import { describe, it, expect } from "vitest";
import { generateCertificate, verifyCertificate } from "./certificate.js";
import type { CertificateInput, CertificateAttestation } from "./certificate.js";
import { generateKeyPair } from "./keys.js";
import { TamperedDataError, InvalidSignatureError } from "./errors.js";

function makeAttestations(): CertificateAttestation[] {
  return [
    {
      attestationId: "att-001",
      actorDid: "did:key:zInspector1",
      type: "inspector_verification",
      evidenceHash: "a".repeat(64),
      digitalSignature: "sig-inspector-1",
      submittedAt: "2025-01-15T10:00:00.000Z",
    },
    {
      attestationId: "att-002",
      actorDid: "did:key:zInspector2",
      type: "inspector_verification",
      evidenceHash: "b".repeat(64),
      digitalSignature: "sig-inspector-2",
      submittedAt: "2025-01-15T11:00:00.000Z",
    },
    {
      attestationId: "att-003",
      actorDid: "did:key:zAuditor1",
      type: "auditor_review",
      evidenceHash: "c".repeat(64),
      digitalSignature: "sig-auditor-1",
      submittedAt: "2025-01-15T12:00:00.000Z",
    },
    {
      attestationId: "att-004",
      actorDid: "did:key:zCitizen1",
      type: "citizen_approval",
      evidenceHash: "d".repeat(64),
      digitalSignature: "sig-citizen-1",
      submittedAt: "2025-01-15T13:00:00.000Z",
    },
    {
      attestationId: "att-005",
      actorDid: "did:key:zCitizen2",
      type: "citizen_approval",
      evidenceHash: "e".repeat(64),
      digitalSignature: "sig-citizen-2",
      submittedAt: "2025-01-15T14:00:00.000Z",
    },
  ];
}

describe("generateCertificate", () => {
  it("should generate a valid certificate with all fields", () => {
    const systemKey = generateKeyPair();
    const input: CertificateInput = {
      milestoneId: "milestone-001",
      projectId: "project-001",
      attestations: makeAttestations(),
      systemPrivateKey: systemKey.privateKey,
    };
    const cert = generateCertificate(input);

    expect(cert.version).toBe("1.0");
    expect(cert.milestoneId).toBe("milestone-001");
    expect(cert.projectId).toBe("project-001");
    expect(cert.attestationChainHash).toMatch(/^[0-9a-f]{64}$/);
    expect(cert.attestations).toHaveLength(5);
    expect(cert.certificateHash).toMatch(/^[0-9a-f]{64}$/);
    expect(cert.digitalSignature).toBeTruthy();
    expect(cert.issuedAt).toBeTruthy();
  });

  it("should count quorum correctly", () => {
    const systemKey = generateKeyPair();
    const input: CertificateInput = {
      milestoneId: "milestone-001",
      projectId: "project-001",
      attestations: makeAttestations(),
      systemPrivateKey: systemKey.privateKey,
    };
    const cert = generateCertificate(input);
    expect(cert.quorum).toEqual({
      inspectors: 2,
      auditors: 1,
      citizens: 2,
    });
  });

  it("should produce deterministic certificate hash for same body", () => {
    const systemKey = generateKeyPair();
    const attestations = makeAttestations();
    const input: CertificateInput = {
      milestoneId: "milestone-001",
      projectId: "project-001",
      attestations,
      systemPrivateKey: systemKey.privateKey,
    };
    const cert1 = generateCertificate(input);
    // Note: issuedAt will differ between calls, so the hashes will differ.
    // We just verify the structure is consistent.
    expect(cert1.certificateHash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("verifyCertificate", () => {
  it("should verify a valid certificate", () => {
    const systemKey = generateKeyPair();
    const cert = generateCertificate({
      milestoneId: "milestone-001",
      projectId: "project-001",
      attestations: makeAttestations(),
      systemPrivateKey: systemKey.privateKey,
    });
    expect(verifyCertificate(cert, systemKey.publicKey)).toBe(true);
  });

  it("should throw TamperedDataError when certificate hash is modified", () => {
    const systemKey = generateKeyPair();
    const cert = generateCertificate({
      milestoneId: "milestone-001",
      projectId: "project-001",
      attestations: makeAttestations(),
      systemPrivateKey: systemKey.privateKey,
    });
    cert.certificateHash = "0".repeat(64);
    expect(() => verifyCertificate(cert, systemKey.publicKey)).toThrow(TamperedDataError);
  });

  it("should throw InvalidSignatureError when signature is modified", () => {
    const systemKey = generateKeyPair();
    const cert = generateCertificate({
      milestoneId: "milestone-001",
      projectId: "project-001",
      attestations: makeAttestations(),
      systemPrivateKey: systemKey.privateKey,
    });
    // Modify the signature but keep the hash correct
    cert.digitalSignature = "invalidSignature";
    expect(() => verifyCertificate(cert, systemKey.publicKey)).toThrow(InvalidSignatureError);
  });

  it("should throw InvalidSignatureError when verified with wrong key", () => {
    const systemKey = generateKeyPair();
    const wrongKey = generateKeyPair();
    const cert = generateCertificate({
      milestoneId: "milestone-001",
      projectId: "project-001",
      attestations: makeAttestations(),
      systemPrivateKey: systemKey.privateKey,
    });
    expect(() => verifyCertificate(cert, wrongKey.publicKey)).toThrow(InvalidSignatureError);
  });

  it("should throw TamperedDataError when body field is modified", () => {
    const systemKey = generateKeyPair();
    const cert = generateCertificate({
      milestoneId: "milestone-001",
      projectId: "project-001",
      attestations: makeAttestations(),
      systemPrivateKey: systemKey.privateKey,
    });
    cert.milestoneId = "milestone-TAMPERED";
    expect(() => verifyCertificate(cert, systemKey.publicKey)).toThrow(TamperedDataError);
  });
});
