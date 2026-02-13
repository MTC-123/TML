import { ExpiredCredentialError, InvalidSignatureError, MalformedDIDError } from "./errors.js";
import { extractPublicKey, resolveDID } from "./did.js";
import { sha256Hex } from "./hashing.js";
import { signPayload, verifyPayload } from "./signing.js";

// ─── Credential Subject Types ───────────────────────────────────────────────

export interface ProfessionalEngineerSubject {
  id: string;
  licenseNumber: string;
  specialization: string;
  issuingAuthority: string;
}

export interface CNIEIdentitySubject {
  id: string;
  cnieHash: string;
  verificationLevel: "in_person" | "remote";
}

export interface DelegatedAuthoritySubject {
  id: string;
  delegatedBy: string;
  scope: string;
  projectId: string;
}

export interface AuditorAccreditationSubject {
  id: string;
  accreditationBody: string;
  accreditationType: string;
  validRegions: string[];
}

export type CredentialSubject =
  | ProfessionalEngineerSubject
  | CNIEIdentitySubject
  | DelegatedAuthoritySubject
  | AuditorAccreditationSubject;

export type CredentialType =
  | "ProfessionalEngineerCredential"
  | "CNIEIdentityCredential"
  | "DelegatedAuthorityCredential"
  | "AuditorAccreditationCredential";

// ─── VC Structure ───────────────────────────────────────────────────────────

export interface CredentialProof {
  type: "Ed25519Signature2020";
  created: string;
  verificationMethod: string;
  proofPurpose: "assertionMethod";
  proofValue: string;
}

export interface VerifiableCredential {
  "@context": ["https://www.w3.org/2018/credentials/v1"];
  type: ["VerifiableCredential", CredentialType];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: CredentialSubject;
  proof: CredentialProof;
}

// ─── Function Input/Output Types ────────────────────────────────────────────

export interface IssueCredentialInput {
  type: CredentialType;
  issuerDid: string;
  issuerPrivateKey: Uint8Array;
  subject: CredentialSubject;
  expirationDate?: string;
}

export interface VerifyCredentialOptions {
  currentTime?: Date;
  checkExpiration?: boolean;
}

export interface CredentialVerificationResult {
  valid: boolean;
  errors: string[];
}

// ─── Functions ──────────────────────────────────────────────────────────────

export function issueCredential(input: IssueCredentialInput): VerifiableCredential {
  const { type, issuerDid, issuerPrivateKey, subject, expirationDate } = input;

  // Validate issuer DID
  extractPublicKey(issuerDid);

  const now = new Date().toISOString();
  const didDoc = resolveDID(issuerDid);
  const verificationMethodId = didDoc.assertionMethod[0]!;

  // Build credential without proof
  const credentialWithoutProof: Omit<VerifiableCredential, "proof"> = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", type],
    issuer: issuerDid,
    issuanceDate: now,
    credentialSubject: subject,
  };

  if (expirationDate) {
    (credentialWithoutProof as Record<string, unknown>)["expirationDate"] = expirationDate;
  }

  // Sign the credential
  const serialized = deterministicSerialize(credentialWithoutProof);
  const hash = sha256Hex(serialized);
  const hashBytes = new TextEncoder().encode(hash);
  const proofValue = signPayload(hashBytes, issuerPrivateKey);

  const proof: CredentialProof = {
    type: "Ed25519Signature2020",
    created: now,
    verificationMethod: verificationMethodId,
    proofPurpose: "assertionMethod",
    proofValue,
  };

  return {
    ...credentialWithoutProof,
    ...(expirationDate ? { expirationDate } : {}),
    proof,
  } as VerifiableCredential;
}

export function verifyCredential(
  credential: VerifiableCredential,
  options?: VerifyCredentialOptions,
): CredentialVerificationResult {
  const errors: string[] = [];
  const checkExpiration = options?.checkExpiration ?? true;
  const currentTime = options?.currentTime ?? new Date();

  // 1. Check expiration
  if (checkExpiration && credential.expirationDate) {
    const expirationDate = new Date(credential.expirationDate);
    if (currentTime > expirationDate) {
      errors.push(`Credential expired on ${credential.expirationDate}`);
    }
  }

  // 2. Extract issuer public key
  let issuerPublicKey: Uint8Array;
  try {
    issuerPublicKey = extractPublicKey(credential.issuer);
  } catch {
    errors.push(`Invalid issuer DID: ${credential.issuer}`);
    return { valid: false, errors };
  }

  // 3. Reconstruct credential without proof and verify signature
  const { proof, ...credentialWithoutProof } = credential;

  const serialized = deterministicSerialize(credentialWithoutProof);
  const hash = sha256Hex(serialized);
  const hashBytes = new TextEncoder().encode(hash);

  const signatureValid = verifyPayload(hashBytes, proof.proofValue, issuerPublicKey);
  if (!signatureValid) {
    errors.push("Credential signature is invalid");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
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
