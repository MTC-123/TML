import { describe, it, expect } from "vitest";
import { createStubVerifier } from "./zkp.js";
import type { GeoPoint } from "@tml/types";

describe("createStubVerifier", () => {
  const verifier = createStubVerifier();

  const location: GeoPoint = { lat: 33.5731, lng: -7.5898 };
  const boundary: GeoPoint[] = [
    { lat: 33.57, lng: -7.59 },
    { lat: 33.58, lng: -7.59 },
    { lat: 33.58, lng: -7.58 },
    { lat: 33.57, lng: -7.58 },
  ];

  it("should generate a proof with expected shape", async () => {
    const proof = await verifier.generateProof(location, boundary);
    expect(proof.proofHash).toMatch(/^[0-9a-f]{64}$/);
    expect(proof.timestamp).toBeTruthy();
    expect(proof.verified).toBe(true);
  });

  it("should verify a proof (stub always returns true)", async () => {
    const proof = await verifier.generateProof(location, boundary);
    const result = await verifier.verifyProof(proof);
    expect(result).toBe(true);
  });

  it("should return false for proof with verified=false", async () => {
    const result = await verifier.verifyProof({
      proofHash: "abc",
      timestamp: new Date().toISOString(),
      verified: false,
    });
    expect(result).toBe(false);
  });

  it("should generate different hashes for different inputs", async () => {
    const proof1 = await verifier.generateProof(location, boundary);
    const proof2 = await verifier.generateProof(
      { lat: 34.0, lng: -6.0 },
      boundary,
    );
    expect(proof1.proofHash).not.toBe(proof2.proofHash);
  });
});
