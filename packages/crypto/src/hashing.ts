import { sha256 } from "@noble/hashes/sha256";
import type { AttestationType } from "@tml/types";

export interface AttestationHashInput {
  milestoneId: string;
  actorId: string;
  type: AttestationType;
  evidenceHash: string;
  digitalSignature: string;
}

export function sha256Hex(data: Uint8Array | string): string {
  const input = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const hash = sha256(input);
  return Array.from(hash)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function hashEvidence(evidence: Uint8Array): string {
  return sha256Hex(evidence);
}

export function hashAttestationChain(attestations: AttestationHashInput[]): string {
  const sorted = [...attestations].sort((a, b) => {
    const milestoneCompare = a.milestoneId.localeCompare(b.milestoneId);
    if (milestoneCompare !== 0) return milestoneCompare;
    const actorCompare = a.actorId.localeCompare(b.actorId);
    if (actorCompare !== 0) return actorCompare;
    return a.type.localeCompare(b.type);
  });

  const concatenated = sorted.map((a) => a.evidenceHash + a.digitalSignature).join("");
  return sha256Hex(concatenated);
}

export function verifyHash(data: Uint8Array | string, expectedHash: string): boolean {
  const actualHash = sha256Hex(data);
  return constantTimeEqual(actualHash, expectedHash);
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
