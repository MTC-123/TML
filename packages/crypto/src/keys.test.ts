import { describe, it, expect } from "vitest";
import {
  generateKeyPair,
  keyPairFromPrivateKey,
  serializeKeyPair,
  deserializeKeyPair,
} from "./keys.js";
import { KeyGenerationError } from "./errors.js";

describe("generateKeyPair", () => {
  it("should generate a valid keypair with 32-byte keys", () => {
    const kp = generateKeyPair();
    expect(kp.publicKey).toBeInstanceOf(Uint8Array);
    expect(kp.privateKey).toBeInstanceOf(Uint8Array);
    expect(kp.publicKey.length).toBe(32);
    expect(kp.privateKey.length).toBe(32);
  });

  it("should generate unique keypairs each time", () => {
    const kp1 = generateKeyPair();
    const kp2 = generateKeyPair();
    expect(kp1.privateKey).not.toEqual(kp2.privateKey);
    expect(kp1.publicKey).not.toEqual(kp2.publicKey);
  });
});

describe("keyPairFromPrivateKey", () => {
  it("should derive the same public key from a private key", () => {
    const original = generateKeyPair();
    const derived = keyPairFromPrivateKey(original.privateKey);
    expect(derived.publicKey).toEqual(original.publicKey);
    expect(derived.privateKey).toEqual(original.privateKey);
  });

  it("should reject private keys that are not 32 bytes", () => {
    expect(() => keyPairFromPrivateKey(new Uint8Array(16))).toThrow(KeyGenerationError);
    expect(() => keyPairFromPrivateKey(new Uint8Array(64))).toThrow(KeyGenerationError);
    expect(() => keyPairFromPrivateKey(new Uint8Array(0))).toThrow(KeyGenerationError);
  });
});

describe("serializeKeyPair / deserializeKeyPair", () => {
  it("should roundtrip serialize and deserialize", () => {
    const original = generateKeyPair();
    const serialized = serializeKeyPair(original);
    expect(typeof serialized.publicKeyHex).toBe("string");
    expect(typeof serialized.privateKeyHex).toBe("string");
    expect(serialized.publicKeyHex.length).toBe(64);
    expect(serialized.privateKeyHex.length).toBe(64);

    const deserialized = deserializeKeyPair(serialized);
    expect(deserialized.publicKey).toEqual(original.publicKey);
    expect(deserialized.privateKey).toEqual(original.privateKey);
  });

  it("should produce lowercase hex strings", () => {
    const kp = generateKeyPair();
    const serialized = serializeKeyPair(kp);
    expect(serialized.publicKeyHex).toMatch(/^[0-9a-f]{64}$/);
    expect(serialized.privateKeyHex).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should reject invalid hex in deserialization", () => {
    expect(() =>
      deserializeKeyPair({ publicKeyHex: "zz".repeat(32), privateKeyHex: "aa".repeat(32) }),
    ).toThrow(KeyGenerationError);
  });

  it("should reject wrong-length hex in deserialization", () => {
    expect(() =>
      deserializeKeyPair({ publicKeyHex: "aabb", privateKeyHex: "aa".repeat(32) }),
    ).toThrow(KeyGenerationError);
  });
});
