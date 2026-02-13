import { describe, it, expect } from "vitest";
import { sha256Hex, hashEvidence, hashAttestationChain, verifyHash } from "./hashing.js";
import type { AttestationHashInput } from "./hashing.js";

describe("sha256Hex", () => {
  it("should hash an empty string to the known SHA-256 value", () => {
    // SHA-256("") = e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
    expect(sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("should hash 'hello' to the known SHA-256 value", () => {
    // SHA-256("hello") = 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
    expect(sha256Hex("hello")).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });

  it("should accept Uint8Array input", () => {
    const bytes = new TextEncoder().encode("hello");
    expect(sha256Hex(bytes)).toBe(sha256Hex("hello"));
  });

  it("should return a 64-character lowercase hex string", () => {
    const hash = sha256Hex("test data");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("hashEvidence", () => {
  it("should hash raw evidence bytes", () => {
    const evidence = new Uint8Array([1, 2, 3, 4, 5]);
    const hash = hashEvidence(evidence);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should return different hashes for different evidence", () => {
    const hash1 = hashEvidence(new Uint8Array([1, 2, 3]));
    const hash2 = hashEvidence(new Uint8Array([4, 5, 6]));
    expect(hash1).not.toBe(hash2);
  });
});

describe("hashAttestationChain", () => {
  const makeAttestation = (
    milestoneId: string,
    actorId: string,
    type: "inspector_verification" | "auditor_review" | "citizen_approval",
  ): AttestationHashInput => ({
    milestoneId,
    actorId,
    type,
    evidenceHash: sha256Hex(`evidence-${milestoneId}-${actorId}`),
    digitalSignature: `sig-${milestoneId}-${actorId}`,
  });

  it("should produce a deterministic hash", () => {
    const attestations = [
      makeAttestation("m1", "actor1", "inspector_verification"),
      makeAttestation("m1", "actor2", "auditor_review"),
    ];
    const hash1 = hashAttestationChain(attestations);
    const hash2 = hashAttestationChain(attestations);
    expect(hash1).toBe(hash2);
  });

  it("should produce the same hash regardless of input order", () => {
    const a1 = makeAttestation("m1", "actor1", "inspector_verification");
    const a2 = makeAttestation("m1", "actor2", "auditor_review");
    const hash1 = hashAttestationChain([a1, a2]);
    const hash2 = hashAttestationChain([a2, a1]);
    expect(hash1).toBe(hash2);
  });

  it("should produce different hashes for different attestations", () => {
    const hash1 = hashAttestationChain([
      makeAttestation("m1", "actor1", "inspector_verification"),
    ]);
    const hash2 = hashAttestationChain([
      makeAttestation("m2", "actor1", "inspector_verification"),
    ]);
    expect(hash1).not.toBe(hash2);
  });

  it("should handle empty attestation array", () => {
    const hash = hashAttestationChain([]);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("verifyHash", () => {
  it("should return true for matching hash", () => {
    const data = "test data";
    const hash = sha256Hex(data);
    expect(verifyHash(data, hash)).toBe(true);
  });

  it("should return false for non-matching hash", () => {
    expect(verifyHash("test data", "0".repeat(64))).toBe(false);
  });

  it("should return false for wrong-length hash", () => {
    expect(verifyHash("test data", "abc")).toBe(false);
  });

  it("should accept Uint8Array input", () => {
    const data = new Uint8Array([1, 2, 3]);
    const hash = sha256Hex(data);
    expect(verifyHash(data, hash)).toBe(true);
  });
});
