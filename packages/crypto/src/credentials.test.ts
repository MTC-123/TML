import { describe, it, expect } from "vitest";
import { issueCredential, verifyCredential } from "./credentials.js";
import type {
  IssueCredentialInput,
  VerifiableCredential,
  ProfessionalEngineerSubject,
  CNIEIdentitySubject,
  DelegatedAuthoritySubject,
  AuditorAccreditationSubject,
} from "./credentials.js";
import { generateKeyPair } from "./keys.js";
import { createDID } from "./did.js";

function makeIssuer(): { did: string; privateKey: Uint8Array } {
  const kp = generateKeyPair();
  return { did: createDID(kp.publicKey), privateKey: kp.privateKey };
}

describe("issueCredential", () => {
  it("should issue a ProfessionalEngineerCredential", () => {
    const issuer = makeIssuer();
    const subject: ProfessionalEngineerSubject = {
      id: "did:key:zHolder1",
      licenseNumber: "ENG-2024-001",
      specialization: "Civil Engineering",
      issuingAuthority: "Moroccan Engineering Board",
    };
    const vc = issueCredential({
      type: "ProfessionalEngineerCredential",
      issuerDid: issuer.did,
      issuerPrivateKey: issuer.privateKey,
      subject,
    });

    expect(vc["@context"]).toEqual(["https://www.w3.org/2018/credentials/v1"]);
    expect(vc.type).toEqual(["VerifiableCredential", "ProfessionalEngineerCredential"]);
    expect(vc.issuer).toBe(issuer.did);
    expect(vc.credentialSubject).toEqual(subject);
    expect(vc.proof.type).toBe("Ed25519Signature2020");
    expect(vc.proof.proofPurpose).toBe("assertionMethod");
    expect(vc.proof.proofValue).toBeTruthy();
    expect(vc.issuanceDate).toBeTruthy();
  });

  it("should issue a CNIEIdentityCredential", () => {
    const issuer = makeIssuer();
    const subject: CNIEIdentitySubject = {
      id: "did:key:zHolder2",
      cnieHash: "a".repeat(64),
      verificationLevel: "in_person",
    };
    const vc = issueCredential({
      type: "CNIEIdentityCredential",
      issuerDid: issuer.did,
      issuerPrivateKey: issuer.privateKey,
      subject,
    });
    expect(vc.type[1]).toBe("CNIEIdentityCredential");
  });

  it("should issue a DelegatedAuthorityCredential", () => {
    const issuer = makeIssuer();
    const subject: DelegatedAuthoritySubject = {
      id: "did:key:zHolder3",
      delegatedBy: issuer.did,
      scope: "milestone-attestation",
      projectId: "project-001",
    };
    const vc = issueCredential({
      type: "DelegatedAuthorityCredential",
      issuerDid: issuer.did,
      issuerPrivateKey: issuer.privateKey,
      subject,
    });
    expect(vc.type[1]).toBe("DelegatedAuthorityCredential");
  });

  it("should issue an AuditorAccreditationCredential", () => {
    const issuer = makeIssuer();
    const subject: AuditorAccreditationSubject = {
      id: "did:key:zHolder4",
      accreditationBody: "National Audit Authority",
      accreditationType: "Financial Audit",
      validRegions: ["Casablanca-Settat", "Rabat-Salé-Kénitra"],
    };
    const vc = issueCredential({
      type: "AuditorAccreditationCredential",
      issuerDid: issuer.did,
      issuerPrivateKey: issuer.privateKey,
      subject,
    });
    expect(vc.type[1]).toBe("AuditorAccreditationCredential");
  });

  it("should include expirationDate when provided", () => {
    const issuer = makeIssuer();
    const expiration = "2030-12-31T23:59:59.000Z";
    const vc = issueCredential({
      type: "ProfessionalEngineerCredential",
      issuerDid: issuer.did,
      issuerPrivateKey: issuer.privateKey,
      subject: {
        id: "did:key:zHolder",
        licenseNumber: "ENG-001",
        specialization: "Civil",
        issuingAuthority: "Board",
      },
      expirationDate: expiration,
    });
    expect(vc.expirationDate).toBe(expiration);
  });

  it("should not include expirationDate when not provided", () => {
    const issuer = makeIssuer();
    const vc = issueCredential({
      type: "ProfessionalEngineerCredential",
      issuerDid: issuer.did,
      issuerPrivateKey: issuer.privateKey,
      subject: {
        id: "did:key:zHolder",
        licenseNumber: "ENG-001",
        specialization: "Civil",
        issuingAuthority: "Board",
      },
    });
    expect(vc.expirationDate).toBeUndefined();
  });
});

describe("verifyCredential", () => {
  function issueValidCredential(): VerifiableCredential {
    const issuer = makeIssuer();
    return issueCredential({
      type: "ProfessionalEngineerCredential",
      issuerDid: issuer.did,
      issuerPrivateKey: issuer.privateKey,
      subject: {
        id: "did:key:zHolder",
        licenseNumber: "ENG-001",
        specialization: "Civil",
        issuingAuthority: "Board",
      },
      expirationDate: "2030-12-31T23:59:59.000Z",
    });
  }

  it("should verify a valid credential", () => {
    const vc = issueValidCredential();
    const result = verifyCredential(vc);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should reject a credential with tampered subject", () => {
    const vc = issueValidCredential();
    (vc.credentialSubject as ProfessionalEngineerSubject).licenseNumber = "TAMPERED";
    const result = verifyCredential(vc);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Credential signature is invalid");
  });

  it("should reject a credential with tampered issuer", () => {
    const otherIssuer = makeIssuer();
    const vc = issueValidCredential();
    vc.issuer = otherIssuer.did;
    const result = verifyCredential(vc);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Credential signature is invalid");
  });

  it("should reject an expired credential", () => {
    const issuer = makeIssuer();
    const vc = issueCredential({
      type: "ProfessionalEngineerCredential",
      issuerDid: issuer.did,
      issuerPrivateKey: issuer.privateKey,
      subject: {
        id: "did:key:zHolder",
        licenseNumber: "ENG-001",
        specialization: "Civil",
        issuingAuthority: "Board",
      },
      expirationDate: "2020-01-01T00:00:00.000Z",
    });
    const result = verifyCredential(vc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("expired"))).toBe(true);
  });

  it("should skip expiration check when disabled", () => {
    const issuer = makeIssuer();
    const vc = issueCredential({
      type: "ProfessionalEngineerCredential",
      issuerDid: issuer.did,
      issuerPrivateKey: issuer.privateKey,
      subject: {
        id: "did:key:zHolder",
        licenseNumber: "ENG-001",
        specialization: "Civil",
        issuingAuthority: "Board",
      },
      expirationDate: "2020-01-01T00:00:00.000Z",
    });
    const result = verifyCredential(vc, { checkExpiration: false });
    expect(result.valid).toBe(true);
  });

  it("should accept custom currentTime for testing", () => {
    const issuer = makeIssuer();
    const vc = issueCredential({
      type: "ProfessionalEngineerCredential",
      issuerDid: issuer.did,
      issuerPrivateKey: issuer.privateKey,
      subject: {
        id: "did:key:zHolder",
        licenseNumber: "ENG-001",
        specialization: "Civil",
        issuingAuthority: "Board",
      },
      expirationDate: "2025-06-01T00:00:00.000Z",
    });
    // Before expiration
    const result1 = verifyCredential(vc, { currentTime: new Date("2025-01-01T00:00:00.000Z") });
    expect(result1.valid).toBe(true);

    // After expiration
    const result2 = verifyCredential(vc, { currentTime: new Date("2025-07-01T00:00:00.000Z") });
    expect(result2.valid).toBe(false);
  });

  it("should return error for invalid issuer DID", () => {
    const vc = issueValidCredential();
    vc.issuer = "not-a-did";
    const result = verifyCredential(vc);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Invalid issuer DID"))).toBe(true);
  });

  it("should validate proof structure", () => {
    const vc = issueValidCredential();
    expect(vc.proof.type).toBe("Ed25519Signature2020");
    expect(vc.proof.proofPurpose).toBe("assertionMethod");
    expect(vc.proof.verificationMethod).toMatch(/^did:key:z.+#z.+$/);
    expect(vc.proof.created).toBeTruthy();
    expect(vc.proof.proofValue).toBeTruthy();
  });
});
