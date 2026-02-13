import { ed25519 } from "@noble/curves/ed25519";
import { KeyGenerationError } from "./errors.js";

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface SerializedKeyPair {
  publicKeyHex: string;
  privateKeyHex: string;
}

export function generateKeyPair(): KeyPair {
  try {
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = ed25519.getPublicKey(privateKey);
    return { publicKey, privateKey };
  } catch (error) {
    throw new KeyGenerationError(
      `Failed to generate Ed25519 key pair: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

export function keyPairFromPrivateKey(privateKey: Uint8Array): KeyPair {
  if (privateKey.length !== 32) {
    throw new KeyGenerationError(
      `Invalid private key length: expected 32 bytes, got ${privateKey.length}`,
      { length: privateKey.length },
    );
  }
  const publicKey = ed25519.getPublicKey(privateKey);
  return { publicKey, privateKey };
}

export function serializeKeyPair(keyPair: KeyPair): SerializedKeyPair {
  return {
    publicKeyHex: bytesToHex(keyPair.publicKey),
    privateKeyHex: bytesToHex(keyPair.privateKey),
  };
}

export function deserializeKeyPair(serialized: SerializedKeyPair): KeyPair {
  const privateKey = hexToBytes(serialized.privateKeyHex);
  const publicKey = hexToBytes(serialized.publicKeyHex);

  if (privateKey.length !== 32) {
    throw new KeyGenerationError(
      `Invalid private key hex: expected 64 hex chars, got ${serialized.privateKeyHex.length}`,
    );
  }
  if (publicKey.length !== 32) {
    throw new KeyGenerationError(
      `Invalid public key hex: expected 64 hex chars, got ${serialized.publicKeyHex.length}`,
    );
  }

  return { publicKey, privateKey };
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new KeyGenerationError(`Invalid hex string: odd length ${hex.length}`);
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    const byte = parseInt(hex.substring(i, i + 2), 16);
    if (Number.isNaN(byte)) {
      throw new KeyGenerationError(`Invalid hex character at position ${i}`);
    }
    bytes[i / 2] = byte;
  }
  return bytes;
}
