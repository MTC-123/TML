import { describe, it, expect } from "vitest";
import {
  CryptoError,
  InvalidSignatureError,
  ExpiredCredentialError,
  RevokedCredentialError,
  TamperedDataError,
  MalformedDIDError,
  KeyGenerationError,
} from "./errors.js";

describe("CryptoError", () => {
  it("should create a base CryptoError with all fields", () => {
    const error = new CryptoError("INVALID_SIGNATURE", "test message", 400, { key: "value" });
    expect(error.message).toBe("test message");
    expect(error.code).toBe("INVALID_SIGNATURE");
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({ key: "value" });
    expect(error.name).toBe("CryptoError");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(CryptoError);
  });

  it("should work without details", () => {
    const error = new CryptoError("TAMPERED_DATA", "no details", 400);
    expect(error.details).toBeUndefined();
  });
});

describe("InvalidSignatureError", () => {
  it("should have correct defaults", () => {
    const error = new InvalidSignatureError();
    expect(error.code).toBe("INVALID_SIGNATURE");
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Invalid cryptographic signature");
    expect(error.name).toBe("InvalidSignatureError");
    expect(error).toBeInstanceOf(CryptoError);
  });

  it("should accept custom message and details", () => {
    const error = new InvalidSignatureError("custom msg", { sig: "abc" });
    expect(error.message).toBe("custom msg");
    expect(error.details).toEqual({ sig: "abc" });
  });
});

describe("ExpiredCredentialError", () => {
  it("should have correct defaults", () => {
    const error = new ExpiredCredentialError();
    expect(error.code).toBe("EXPIRED_CREDENTIAL");
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Credential has expired");
    expect(error.name).toBe("ExpiredCredentialError");
    expect(error).toBeInstanceOf(CryptoError);
  });
});

describe("RevokedCredentialError", () => {
  it("should have correct defaults", () => {
    const error = new RevokedCredentialError();
    expect(error.code).toBe("REVOKED_CREDENTIAL");
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Credential has been revoked");
    expect(error.name).toBe("RevokedCredentialError");
    expect(error).toBeInstanceOf(CryptoError);
  });
});

describe("TamperedDataError", () => {
  it("should have correct defaults", () => {
    const error = new TamperedDataError();
    expect(error.code).toBe("TAMPERED_DATA");
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Data integrity check failed");
    expect(error.name).toBe("TamperedDataError");
    expect(error).toBeInstanceOf(CryptoError);
  });
});

describe("MalformedDIDError", () => {
  it("should have correct defaults", () => {
    const error = new MalformedDIDError();
    expect(error.code).toBe("MALFORMED_DID");
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe("Malformed DID identifier");
    expect(error.name).toBe("MalformedDIDError");
    expect(error).toBeInstanceOf(CryptoError);
  });
});

describe("KeyGenerationError", () => {
  it("should have correct defaults", () => {
    const error = new KeyGenerationError();
    expect(error.code).toBe("KEY_GENERATION_FAILED");
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe("Key generation failed");
    expect(error.name).toBe("KeyGenerationError");
    expect(error).toBeInstanceOf(CryptoError);
  });

  it("should accept custom message and details", () => {
    const error = new KeyGenerationError("entropy exhausted", { source: "rng" });
    expect(error.message).toBe("entropy exhausted");
    expect(error.details).toEqual({ source: "rng" });
  });
});
