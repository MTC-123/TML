// Errors
export {
  CryptoError,
  InvalidSignatureError,
  ExpiredCredentialError,
  RevokedCredentialError,
  TamperedDataError,
  MalformedDIDError,
  KeyGenerationError,
} from "./errors.js";
export type { CryptoErrorCode } from "./errors.js";

// Keys
export { generateKeyPair, keyPairFromPrivateKey, serializeKeyPair, deserializeKeyPair } from "./keys.js";
export type { KeyPair, SerializedKeyPair } from "./keys.js";

// DID
export { createDID, resolveDID, extractPublicKey, isValidDID } from "./did.js";
export type { DIDDocument, VerificationMethod } from "./did.js";

// Hashing
export { sha256Hex, hashEvidence, hashAttestationChain, verifyHash } from "./hashing.js";
export type { AttestationHashInput } from "./hashing.js";

// Signing
export { signPayload, verifyPayload, signAttestation, verifyAttestation } from "./signing.js";
export type { AttestationSigningInput } from "./signing.js";

// Base encoding (re-export for consumers that need signature format conversion)
export { base58 } from "@scure/base";

// Credentials
export { issueCredential, verifyCredential } from "./credentials.js";
export type {
  ProfessionalEngineerSubject,
  CNIEIdentitySubject,
  DelegatedAuthoritySubject,
  AuditorAccreditationSubject,
  CredentialSubject,
  CredentialType,
  CredentialProof,
  VerifiableCredential,
  IssueCredentialInput,
  VerifyCredentialOptions,
  CredentialVerificationResult,
} from "./credentials.js";

// Certificate
export { generateCertificate, verifyCertificate } from "./certificate.js";
export type {
  CertificateAttestation,
  CertificateInput,
  CertificateQuorum,
  PaymentClearanceCertificate,
} from "./certificate.js";

// ZKP
export { createStubVerifier } from "./zkp.js";
export type { ProximityProof, ZKPProximityVerifier } from "./zkp.js";

// Presentations
export { createPresentation, verifyPresentation } from "./presentation.js";
export type {
  VerifiablePresentation,
  PresentationProof,
  CreatePresentationInput,
  PresentationVerificationResult,
} from "./presentation.js";

// QR Payload
export { encodeQrPayload, decodeQrPayload, validateQrPayloadIntegrity } from "./qr-payload.js";
export type { QrPayloadType, QrPayload, EncodeQrPayloadInput } from "./qr-payload.js";

// Selective Disclosure
export { deriveSelectiveCredential, verifySelectiveDisclosure, verifyRedactedField } from "./selective-disclosure.js";
export type { SelectiveDisclosureInput, DerivedCredential } from "./selective-disclosure.js";
