import type { VerifiableCredential, CredentialSubject } from "./credentials.js";
import { sha256Hex } from "./hashing.js";

export interface SelectiveDisclosureInput {
  credential: VerifiableCredential;
  disclosedFields: string[];
  salt?: string;
}

export interface DerivedCredential {
  original: VerifiableCredential;
  disclosed: Partial<CredentialSubject>;
  redactedHashes: Record<string, string>;
  disclosureProof: string;
}

export function deriveSelectiveCredential(input: SelectiveDisclosureInput): DerivedCredential {
  const { credential, disclosedFields, salt = "" } = input;
  const subject = credential.credentialSubject;

  const disclosed: Record<string, unknown> = {};
  const redactedHashes: Record<string, string> = {};

  for (const [key, value] of Object.entries(subject)) {
    if (key === "id") {
      disclosed[key] = value;
    } else if (disclosedFields.includes(key)) {
      disclosed[key] = value;
    } else {
      redactedHashes[key] = sha256Hex(`${salt}:${key}:${JSON.stringify(value)}`);
    }
  }

  const originalHash = sha256Hex(JSON.stringify(credential));
  const disclosureProof = sha256Hex(`${originalHash}:${disclosedFields.sort().join(",")}`);

  return {
    original: credential,
    disclosed: disclosed as Partial<CredentialSubject>,
    redactedHashes,
    disclosureProof,
  };
}

export function verifySelectiveDisclosure(
  derived: DerivedCredential,
  disclosedFields: string[],
): boolean {
  const originalHash = sha256Hex(JSON.stringify(derived.original));
  const expectedProof = sha256Hex(`${originalHash}:${disclosedFields.sort().join(",")}`);
  return expectedProof === derived.disclosureProof;
}

export function verifyRedactedField(
  fieldName: string,
  fieldValue: unknown,
  expectedHash: string,
  salt: string = "",
): boolean {
  const computed = sha256Hex(`${salt}:${fieldName}:${JSON.stringify(fieldValue)}`);
  return computed === expectedHash;
}
