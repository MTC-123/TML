import { describe, it, expect } from "vitest";
import { createDID, resolveDID, extractPublicKey, isValidDID } from "./did.js";
import { generateKeyPair } from "./keys.js";
import { MalformedDIDError } from "./errors.js";

describe("createDID", () => {
  it("should create a did:key from a 32-byte public key", () => {
    const kp = generateKeyPair();
    const did = createDID(kp.publicKey);
    expect(did).toMatch(/^did:key:z[1-9A-HJ-NP-Za-km-z]+$/);
  });

  it("should produce deterministic DIDs for the same key", () => {
    const kp = generateKeyPair();
    const did1 = createDID(kp.publicKey);
    const did2 = createDID(kp.publicKey);
    expect(did1).toBe(did2);
  });

  it("should produce unique DIDs for different keys", () => {
    const kp1 = generateKeyPair();
    const kp2 = generateKeyPair();
    expect(createDID(kp1.publicKey)).not.toBe(createDID(kp2.publicKey));
  });

  it("should reject non-32-byte public keys", () => {
    expect(() => createDID(new Uint8Array(16))).toThrow(MalformedDIDError);
    expect(() => createDID(new Uint8Array(64))).toThrow(MalformedDIDError);
  });
});

describe("extractPublicKey", () => {
  it("should roundtrip: create DID then extract key", () => {
    const kp = generateKeyPair();
    const did = createDID(kp.publicKey);
    const extracted = extractPublicKey(did);
    expect(extracted).toEqual(kp.publicKey);
  });

  it("should throw MalformedDIDError for non-did:key prefix", () => {
    expect(() => extractPublicKey("did:web:example.com")).toThrow(MalformedDIDError);
  });

  it("should throw MalformedDIDError for missing z prefix", () => {
    expect(() => extractPublicKey("did:key:abc123")).toThrow(MalformedDIDError);
  });

  it("should throw MalformedDIDError for invalid base58btc", () => {
    expect(() => extractPublicKey("did:key:z!!!invalid!!!")).toThrow(MalformedDIDError);
  });

  it("should throw MalformedDIDError for wrong multicodec prefix", () => {
    // Encode a key with wrong prefix bytes
    expect(() => extractPublicKey("did:key:z" + "1".repeat(5))).toThrow(MalformedDIDError);
  });
});

describe("resolveDID", () => {
  it("should return a valid DID document", () => {
    const kp = generateKeyPair();
    const did = createDID(kp.publicKey);
    const doc = resolveDID(did);

    expect(doc["@context"]).toContain("https://www.w3.org/ns/did/v1");
    expect(doc.id).toBe(did);
    expect(doc.verificationMethod).toHaveLength(1);
    expect(doc.verificationMethod[0]!.type).toBe("Ed25519VerificationKey2020");
    expect(doc.verificationMethod[0]!.controller).toBe(did);
    expect(doc.authentication).toHaveLength(1);
    expect(doc.assertionMethod).toHaveLength(1);
  });

  it("should have verification method ID matching did#multibase", () => {
    const kp = generateKeyPair();
    const did = createDID(kp.publicKey);
    const doc = resolveDID(did);
    const vmId = doc.verificationMethod[0]!.id;
    expect(vmId).toMatch(new RegExp(`^${did.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}#z[1-9A-HJ-NP-Za-km-z]+$`));
    expect(doc.authentication[0]).toBe(vmId);
    expect(doc.assertionMethod[0]).toBe(vmId);
  });

  it("should throw MalformedDIDError for invalid DID", () => {
    expect(() => resolveDID("not-a-did")).toThrow(MalformedDIDError);
  });
});

describe("isValidDID", () => {
  it("should return true for valid DIDs", () => {
    const kp = generateKeyPair();
    const did = createDID(kp.publicKey);
    expect(isValidDID(did)).toBe(true);
  });

  it("should return false for invalid DIDs", () => {
    expect(isValidDID("")).toBe(false);
    expect(isValidDID("did:web:example.com")).toBe(false);
    expect(isValidDID("did:key:zINVALID")).toBe(false);
    expect(isValidDID("not-a-did")).toBe(false);
  });
});
