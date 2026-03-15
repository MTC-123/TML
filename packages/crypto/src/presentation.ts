import type { VerifiableCredential } from "./credentials.js";
import { verifyCredential } from "./credentials.js";
import { signPayload, verifyPayload } from "./signing.js";
import { extractPublicKey, resolveDID } from "./did.js";
import { sha256Hex } from "./hashing.js";

export interface VerifiablePresentation {
  "@context": ["https://www.w3.org/2018/credentials/v1"];
  type: ["VerifiablePresentation"];
  holder: string;
  verifiableCredential: VerifiableCredential[];
  proof: PresentationProof;
}

export interface PresentationProof {
  type: "Ed25519Signature2020";
  created: string;
  verificationMethod: string;
  proofPurpose: "authentication";
  challenge: string;
  domain?: string;
  proofValue: string;
}

export interface CreatePresentationInput {
  holderDid: string;
  holderPrivateKey: Uint8Array;
  credentials: VerifiableCredential[];
  challenge: string;
  domain?: string;
}

export interface PresentationVerificationResult {
  valid: boolean;
  credentialResults: Array<{ index: number; valid: boolean; errors: string[] }>;
  presentationErrors: string[];
}

export function createPresentation(input: CreatePresentationInput): VerifiablePresentation {
  const { holderDid, holderPrivateKey, credentials, challenge, domain } = input;

  extractPublicKey(holderDid);

  const now = new Date().toISOString();
  const didDoc = resolveDID(holderDid);
  const verificationMethodId = didDoc.assertionMethod[0]!;

  const presentationWithoutProof = {
    "@context": ["https://www.w3.org/2018/credentials/v1"] as ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiablePresentation"] as ["VerifiablePresentation"],
    holder: holderDid,
    verifiableCredential: credentials,
  };

  const serialized = JSON.stringify(presentationWithoutProof) + challenge + (domain ?? "");
  const hash = sha256Hex(serialized);
  const hashBytes = new TextEncoder().encode(hash);
  const proofValue = signPayload(hashBytes, holderPrivateKey);

  const proof: PresentationProof = {
    type: "Ed25519Signature2020",
    created: now,
    verificationMethod: verificationMethodId,
    proofPurpose: "authentication",
    challenge,
    ...(domain ? { domain } : {}),
    proofValue,
  };

  return { ...presentationWithoutProof, proof };
}

export function verifyPresentation(
  presentation: VerifiablePresentation,
  expectedChallenge: string,
  expectedDomain?: string,
): PresentationVerificationResult {
  const presentationErrors: string[] = [];

  if (presentation.proof.challenge !== expectedChallenge) {
    presentationErrors.push("Challenge mismatch — possible replay attack");
  }

  if (expectedDomain && presentation.proof.domain !== expectedDomain) {
    presentationErrors.push("Domain mismatch");
  }

  let holderPublicKey: Uint8Array;
  try {
    holderPublicKey = extractPublicKey(presentation.holder);
  } catch {
    presentationErrors.push(`Invalid holder DID: ${presentation.holder}`);
    return { valid: false, credentialResults: [], presentationErrors };
  }

  const { proof, ...presentationWithoutProof } = presentation;
  const serialized = JSON.stringify(presentationWithoutProof) + proof.challenge + (proof.domain ?? "");
  const hash = sha256Hex(serialized);
  const hashBytes = new TextEncoder().encode(hash);
  const sigValid = verifyPayload(hashBytes, proof.proofValue, holderPublicKey);
  if (!sigValid) {
    presentationErrors.push("Presentation signature is invalid");
  }

  const credentialResults = presentation.verifiableCredential.map((cred, index) => {
    const result = verifyCredential(cred);
    return { index, valid: result.valid, errors: result.errors };
  });

  const allCredsValid = credentialResults.every((r) => r.valid);

  return {
    valid: presentationErrors.length === 0 && allCredsValid,
    credentialResults,
    presentationErrors,
  };
}
