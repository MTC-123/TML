import type { AttestationType } from "@tml/types";
import { InvalidSignatureError, TamperedDataError } from "./errors.js";
import { hashAttestationChain, sha256Hex } from "./hashing.js";
import { signPayload, verifyPayload } from "./signing.js";

export interface CertificateAttestation {
  attestationId: string;
  actorDid: string;
  type: AttestationType;
  evidenceHash: string;
  digitalSignature: string;
  submittedAt: string;
}

export interface CertificateInput {
  milestoneId: string;
  projectId: string;
  attestations: CertificateAttestation[];
  systemPrivateKey: Uint8Array;
}

export interface CertificateQuorum {
  inspectors: number;
  auditors: number;
  citizens: number;
}

export interface PaymentClearanceCertificate {
  version: "1.0";
  milestoneId: string;
  projectId: string;
  attestationChainHash: string;
  attestations: CertificateAttestation[];
  quorum: CertificateQuorum;
  issuedAt: string;
  certificateHash: string;
  digitalSignature: string;
}

export function generateCertificate(input: CertificateInput): PaymentClearanceCertificate {
  const { milestoneId, projectId, attestations, systemPrivateKey } = input;

  // 1. Build attestation chain hash
  const chainInputs = attestations.map((a) => ({
    milestoneId,
    actorId: a.actorDid,
    type: a.type,
    evidenceHash: a.evidenceHash,
    digitalSignature: a.digitalSignature,
  }));
  const attestationChainHash = hashAttestationChain(chainInputs);

  // 2. Compute quorum counts
  const quorum = countQuorum(attestations);

  // 3. Compose certificate body (everything except hash and signature)
  const issuedAt = new Date().toISOString();
  const body = {
    version: "1.0" as const,
    milestoneId,
    projectId,
    attestationChainHash,
    attestations,
    quorum,
    issuedAt,
  };

  // 4. Hash the body deterministically
  const serialized = deterministicSerialize(body);
  const certificateHash = sha256Hex(serialized);

  // 5. Sign the hash
  const hashBytes = new TextEncoder().encode(certificateHash);
  const digitalSignature = signPayload(hashBytes, systemPrivateKey);

  return {
    ...body,
    certificateHash,
    digitalSignature,
  };
}

export function verifyCertificate(
  certificate: PaymentClearanceCertificate,
  systemPublicKey: Uint8Array,
): boolean {
  // 1. Extract the fields that were hashed
  const { certificateHash, digitalSignature, ...body } = certificate;

  // 2. Recompute the hash from the body
  const serialized = deterministicSerialize(body);
  const recomputedHash = sha256Hex(serialized);

  if (recomputedHash !== certificateHash) {
    throw new TamperedDataError("Certificate hash does not match body content", {
      expected: certificateHash,
      computed: recomputedHash,
    });
  }

  // 3. Verify the signature against the recomputed hash
  const hashBytes = new TextEncoder().encode(recomputedHash);
  const signatureValid = verifyPayload(hashBytes, digitalSignature, systemPublicKey);

  if (!signatureValid) {
    throw new InvalidSignatureError("Certificate signature verification failed");
  }

  return true;
}

function countQuorum(attestations: CertificateAttestation[]): CertificateQuorum {
  let inspectors = 0;
  let auditors = 0;
  let citizens = 0;

  for (const a of attestations) {
    switch (a.type) {
      case "inspector_verification":
        inspectors++;
        break;
      case "auditor_review":
        auditors++;
        break;
      case "citizen_approval":
        citizens++;
        break;
    }
  }

  return { inspectors, auditors, citizens };
}

function deterministicSerialize(obj: unknown): string {
  return JSON.stringify(obj, (_key: string, value: unknown) => {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const record = value as Record<string, unknown>;
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(record).sort()) {
        sorted[k] = record[k];
      }
      return sorted;
    }
    return value;
  });
}
