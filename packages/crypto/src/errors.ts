export type CryptoErrorCode =
  | "INVALID_SIGNATURE"
  | "EXPIRED_CREDENTIAL"
  | "REVOKED_CREDENTIAL"
  | "TAMPERED_DATA"
  | "MALFORMED_DID"
  | "KEY_GENERATION_FAILED";

export class CryptoError extends Error {
  readonly code: CryptoErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: CryptoErrorCode,
    message: string,
    statusCode: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class InvalidSignatureError extends CryptoError {
  constructor(message = "Invalid cryptographic signature", details?: Record<string, unknown>) {
    super("INVALID_SIGNATURE", message, 400, details);
    this.name = "InvalidSignatureError";
  }
}

export class ExpiredCredentialError extends CryptoError {
  constructor(message = "Credential has expired", details?: Record<string, unknown>) {
    super("EXPIRED_CREDENTIAL", message, 400, details);
    this.name = "ExpiredCredentialError";
  }
}

export class RevokedCredentialError extends CryptoError {
  constructor(message = "Credential has been revoked", details?: Record<string, unknown>) {
    super("REVOKED_CREDENTIAL", message, 400, details);
    this.name = "RevokedCredentialError";
  }
}

export class TamperedDataError extends CryptoError {
  constructor(message = "Data integrity check failed", details?: Record<string, unknown>) {
    super("TAMPERED_DATA", message, 400, details);
    this.name = "TamperedDataError";
  }
}

export class MalformedDIDError extends CryptoError {
  constructor(message = "Malformed DID identifier", details?: Record<string, unknown>) {
    super("MALFORMED_DID", message, 400, details);
    this.name = "MalformedDIDError";
  }
}

export class KeyGenerationError extends CryptoError {
  constructor(message = "Key generation failed", details?: Record<string, unknown>) {
    super("KEY_GENERATION_FAILED", message, 500, details);
    this.name = "KeyGenerationError";
  }
}
