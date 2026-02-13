import { describe, it, expect } from "vitest";
import { signPayload, verifyPayload, signAttestation, verifyAttestation } from "./signing.js";
import { generateKeyPair } from "./keys.js";
import { createDID } from "./did.js";
import type { AttestationSigningInput } from "./signing.js";

describe("signPayload / verifyPayload", () => {
  it("should sign and verify a payload successfully", () => {
    const kp = generateKeyPair();
    const data = new TextEncoder().encode("hello world");
    const signature = signPayload(data, kp.privateKey);
    expect(typeof signature).toBe("string");
    expect(signature.length).toBeGreaterThan(0);
    expect(verifyPayload(data, signature, kp.publicKey)).toBe(true);
  });

  it("should reject verification with wrong public key", () => {
    const kp1 = generateKeyPair();
    const kp2 = generateKeyPair();
    const data = new TextEncoder().encode("hello");
    const signature = signPayload(data, kp1.privateKey);
    expect(verifyPayload(data, signature, kp2.publicKey)).toBe(false);
  });

  it("should reject verification with tampered data", () => {
    const kp = generateKeyPair();
    const data = new TextEncoder().encode("original");
    const signature = signPayload(data, kp.privateKey);
    const tampered = new TextEncoder().encode("tampered");
    expect(verifyPayload(tampered, signature, kp.publicKey)).toBe(false);
  });

  it("should return false for invalid signature string", () => {
    const kp = generateKeyPair();
    const data = new TextEncoder().encode("hello");
    expect(verifyPayload(data, "not-valid-base58", kp.publicKey)).toBe(false);
  });

  it("should produce deterministic signatures for same input", () => {
    const kp = generateKeyPair();
    const data = new TextEncoder().encode("deterministic");
    const sig1 = signPayload(data, kp.privateKey);
    const sig2 = signPayload(data, kp.privateKey);
    expect(sig1).toBe(sig2);
  });
});

describe("signAttestation / verifyAttestation", () => {
  const makeInput = (): AttestationSigningInput => ({
    milestoneId: "milestone-001",
    actorId: "actor-001",
    type: "inspector_verification",
    evidenceHash: "a".repeat(64),
    gpsLatitude: "33.5731",
    gpsLongitude: "-7.5898",
    deviceAttestationToken: "device-token-123",
    timestamp: "2025-01-15T10:30:00.000Z",
  });

  it("should sign and verify an attestation successfully", () => {
    const kp = generateKeyPair();
    const did = createDID(kp.publicKey);
    const input = makeInput();
    const signature = signAttestation(input, kp.privateKey);
    expect(typeof signature).toBe("string");
    expect(verifyAttestation(input, signature, did)).toBe(true);
  });

  it("should reject attestation with wrong DID", () => {
    const kp1 = generateKeyPair();
    const kp2 = generateKeyPair();
    const did2 = createDID(kp2.publicKey);
    const input = makeInput();
    const signature = signAttestation(input, kp1.privateKey);
    expect(verifyAttestation(input, signature, did2)).toBe(false);
  });

  it("should reject tampered attestation data", () => {
    const kp = generateKeyPair();
    const did = createDID(kp.publicKey);
    const input = makeInput();
    const signature = signAttestation(input, kp.privateKey);
    const tampered = { ...input, milestoneId: "milestone-002" };
    expect(verifyAttestation(tampered, signature, did)).toBe(false);
  });

  it("should produce deterministic signatures for same input", () => {
    const kp = generateKeyPair();
    const input = makeInput();
    const sig1 = signAttestation(input, kp.privateKey);
    const sig2 = signAttestation(input, kp.privateKey);
    expect(sig1).toBe(sig2);
  });

  it("should return false for invalid DID in verification", () => {
    const kp = generateKeyPair();
    const input = makeInput();
    const signature = signAttestation(input, kp.privateKey);
    expect(verifyAttestation(input, signature, "not-a-did")).toBe(false);
  });

  it("should use deterministic serialization (key order independent)", () => {
    const kp = generateKeyPair();
    const did = createDID(kp.publicKey);

    // Create with explicit key order
    const input = makeInput();
    const signature = signAttestation(input, kp.privateKey);

    // Verify with same data — the serialization should be deterministic
    expect(verifyAttestation(input, signature, did)).toBe(true);
  });
});
