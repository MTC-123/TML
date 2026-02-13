import { base58 } from "@scure/base";
import { MalformedDIDError } from "./errors.js";

const DID_KEY_PREFIX = "did:key:";
const ED25519_MULTICODEC_PREFIX = new Uint8Array([0xed, 0x01]);

export interface VerificationMethod {
  id: string;
  type: "Ed25519VerificationKey2020";
  controller: string;
  publicKeyMultibase: string;
}

export interface DIDDocument {
  "@context": string[];
  id: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod: string[];
}

export function createDID(publicKey: Uint8Array): string {
  if (publicKey.length !== 32) {
    throw new MalformedDIDError(
      `Invalid public key length: expected 32 bytes, got ${publicKey.length}`,
    );
  }
  const multicodecKey = new Uint8Array(2 + publicKey.length);
  multicodecKey.set(ED25519_MULTICODEC_PREFIX);
  multicodecKey.set(publicKey, 2);
  const encoded = base58.encode(multicodecKey);
  return `${DID_KEY_PREFIX}z${encoded}`;
}

export function resolveDID(did: string): DIDDocument {
  const publicKey = extractPublicKey(did);
  const multicodecKey = new Uint8Array(2 + publicKey.length);
  multicodecKey.set(ED25519_MULTICODEC_PREFIX);
  multicodecKey.set(publicKey, 2);
  const multibaseKey = `z${base58.encode(multicodecKey)}`;
  const keyId = `${did}#${multibaseKey}`;

  return {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/suites/ed25519-2020/v1",
    ],
    id: did,
    verificationMethod: [
      {
        id: keyId,
        type: "Ed25519VerificationKey2020",
        controller: did,
        publicKeyMultibase: multibaseKey,
      },
    ],
    authentication: [keyId],
    assertionMethod: [keyId],
  };
}

export function extractPublicKey(did: string): Uint8Array {
  if (!did.startsWith(DID_KEY_PREFIX)) {
    throw new MalformedDIDError(`DID must start with '${DID_KEY_PREFIX}', got: ${did}`);
  }

  const multibaseValue = did.slice(DID_KEY_PREFIX.length);
  if (!multibaseValue.startsWith("z")) {
    throw new MalformedDIDError("DID multibase value must start with 'z' (base58)");
  }

  let decoded: Uint8Array;
  try {
    decoded = base58.decode(multibaseValue.slice(1));
  } catch {
    throw new MalformedDIDError("Failed to decode base58 value from DID");
  }

  if (decoded.length < 2) {
    throw new MalformedDIDError("Decoded DID value too short to contain multicodec prefix");
  }

  if (decoded[0] !== 0xed || decoded[1] !== 0x01) {
    throw new MalformedDIDError(
      `Invalid multicodec prefix: expected [0xed, 0x01], got [0x${decoded[0]?.toString(16)}, 0x${decoded[1]?.toString(16)}]`,
    );
  }

  const publicKey = decoded.slice(2);
  if (publicKey.length !== 32) {
    throw new MalformedDIDError(
      `Invalid public key length: expected 32 bytes, got ${publicKey.length}`,
    );
  }

  return publicKey;
}

export function isValidDID(did: string): boolean {
  try {
    extractPublicKey(did);
    return true;
  } catch {
    return false;
  }
}
