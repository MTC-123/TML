import { describe, expect, it } from "vitest";
import {
  uuidSchema,
  didSchema,
  sha256HashSchema,
  geoPointSchema,
  paginationSchema,
  createActorSchema,
  actorResponseSchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  organizationResponseSchema,
  createActorOrganizationSchema,
  createProjectSchema,
  updateProjectSchema,
  projectResponseSchema,
  createMilestoneSchema,
  updateMilestoneSchema,
  milestoneResponseSchema,
  createAttestationSchema,
  attestationResponseSchema,
  createAuditorAssignmentSchema,
  updateAuditorAssignmentSchema,
  createCitizenPoolSchema,
  updateCitizenPoolSchema,
  complianceCertificateResponseSchema,
  revokeCertificateSchema,
  createDisputeSchema,
  resolveDisputeSchema,
  disputeResponseSchema,
  createTrustedIssuerSchema,
  trustedIssuerResponseSchema,
  createWebhookSubscriptionSchema,
  webhookSubscriptionResponseSchema,
  auditLogResponseSchema,
  auditLogQuerySchema,
} from "./validators.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const VALID_DID = "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK";
const VALID_HASH = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
const VALID_SIG = "MEUCIQDxN2Rkz8eS1bvFnk8AJ3P9t3CrklcjKp5y1g0TQv6a7gIgVP8sx";
const NOW = new Date();

// ─── Shared Primitives ──────────────────────────────────────────────────────

describe("uuidSchema", () => {
  it("accepts a valid UUID", () => {
    expect(uuidSchema.parse(VALID_UUID)).toBe(VALID_UUID);
  });

  it("rejects an invalid UUID", () => {
    expect(() => uuidSchema.parse("not-a-uuid")).toThrow();
  });
});

describe("didSchema", () => {
  it("accepts a valid did:key", () => {
    expect(didSchema.parse(VALID_DID)).toBe(VALID_DID);
  });

  it("rejects invalid DID formats", () => {
    expect(() => didSchema.parse("did:web:example.com")).toThrow();
    expect(() => didSchema.parse("not-a-did")).toThrow();
    expect(() => didSchema.parse("did:key:invalid!chars")).toThrow();
  });
});

describe("sha256HashSchema", () => {
  it("accepts a valid 64-char hex string", () => {
    expect(sha256HashSchema.parse(VALID_HASH)).toBe(VALID_HASH);
  });

  it("rejects wrong length", () => {
    expect(() => sha256HashSchema.parse("abcdef")).toThrow();
  });

  it("rejects uppercase hex", () => {
    expect(() => sha256HashSchema.parse(VALID_HASH.toUpperCase())).toThrow();
  });
});

describe("geoPointSchema", () => {
  it("accepts valid coordinates", () => {
    expect(geoPointSchema.parse({ lat: 33.5, lng: -5.1 })).toEqual({ lat: 33.5, lng: -5.1 });
  });

  it("rejects latitude out of range", () => {
    expect(() => geoPointSchema.parse({ lat: 91, lng: 0 })).toThrow();
    expect(() => geoPointSchema.parse({ lat: -91, lng: 0 })).toThrow();
  });

  it("rejects longitude out of range", () => {
    expect(() => geoPointSchema.parse({ lat: 0, lng: 181 })).toThrow();
    expect(() => geoPointSchema.parse({ lat: 0, lng: -181 })).toThrow();
  });
});

describe("paginationSchema", () => {
  it("provides defaults", () => {
    const result = paginationSchema.parse({});
    expect(result).toEqual({ page: 1, limit: 20 });
  });

  it("coerces string numbers", () => {
    const result = paginationSchema.parse({ page: "3", limit: "50" });
    expect(result).toEqual({ page: 3, limit: 50 });
  });

  it("rejects page < 1", () => {
    expect(() => paginationSchema.parse({ page: 0 })).toThrow();
  });

  it("rejects limit > 100", () => {
    expect(() => paginationSchema.parse({ limit: 101 })).toThrow();
  });
});

// ─── Actor Schemas ───────────────────────────────────────────────────────────

describe("createActorSchema", () => {
  const valid = { did: VALID_DID, cnieHash: VALID_HASH, roles: ["citizen"] };

  it("accepts valid input", () => {
    expect(createActorSchema.parse(valid)).toEqual(valid);
  });

  it("requires at least one role", () => {
    expect(() => createActorSchema.parse({ ...valid, roles: [] })).toThrow();
  });

  it("rejects invalid role", () => {
    expect(() => createActorSchema.parse({ ...valid, roles: ["superadmin"] })).toThrow();
  });

  it("accepts multiple roles", () => {
    const multi = { ...valid, roles: ["admin", "citizen"] };
    expect(createActorSchema.parse(multi).roles).toEqual(["admin", "citizen"]);
  });
});

describe("actorResponseSchema", () => {
  it("accepts valid response with date coercion", () => {
    const data = {
      id: VALID_UUID,
      did: VALID_DID,
      cnieHash: VALID_HASH,
      roles: ["independent_auditor"],
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    };
    const result = actorResponseSchema.parse(data);
    expect(result.createdAt).toBeInstanceOf(Date);
  });
});

// ─── Organization Schemas ────────────────────────────────────────────────────

describe("createOrganizationSchema", () => {
  const valid = { name: "Atlas BTP", registrationHash: VALID_HASH, type: "engineering_firm" };

  it("accepts valid input", () => {
    expect(createOrganizationSchema.parse(valid)).toEqual(valid);
  });

  it("rejects empty name", () => {
    expect(() => createOrganizationSchema.parse({ ...valid, name: "" })).toThrow();
  });

  it("rejects invalid type", () => {
    expect(() => createOrganizationSchema.parse({ ...valid, type: "ngo" })).toThrow();
  });
});

describe("updateOrganizationSchema", () => {
  it("accepts partial update", () => {
    expect(updateOrganizationSchema.parse({ status: "suspended" })).toEqual({ status: "suspended" });
  });

  it("accepts empty object", () => {
    expect(updateOrganizationSchema.parse({})).toEqual({});
  });
});

describe("organizationResponseSchema", () => {
  it("accepts valid response with nullable deletedAt", () => {
    const data = {
      id: VALID_UUID,
      name: "Test Org",
      registrationHash: VALID_HASH,
      type: "cso",
      status: "active",
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
    };
    expect(organizationResponseSchema.parse(data).deletedAt).toBeNull();
  });
});

// ─── ActorOrganization Schemas ───────────────────────────────────────────────

describe("createActorOrganizationSchema", () => {
  it("accepts valid input", () => {
    const valid = {
      actorId: VALID_UUID,
      organizationId: VALID_UUID,
      role: "Engineer",
      validFrom: "2025-01-01",
    };
    const result = createActorOrganizationSchema.parse(valid);
    expect(result.validFrom).toBeInstanceOf(Date);
  });

  it("accepts optional validUntil", () => {
    const valid = {
      actorId: VALID_UUID,
      organizationId: VALID_UUID,
      role: "Engineer",
      validFrom: "2025-01-01",
      validUntil: "2026-01-01",
    };
    const result = createActorOrganizationSchema.parse(valid);
    expect(result.validUntil).toBeInstanceOf(Date);
  });
});

// ─── Project Schemas ─────────────────────────────────────────────────────────

describe("createProjectSchema", () => {
  const valid = {
    name: "Route N8",
    region: "Fes-Meknes",
    budget: "45000000.00",
  };

  it("accepts valid input", () => {
    expect(createProjectSchema.parse(valid)).toEqual(valid);
  });

  it("rejects non-decimal budget", () => {
    expect(() => createProjectSchema.parse({ ...valid, budget: "abc" })).toThrow();
  });

  it("rejects budget with 3 decimal places", () => {
    expect(() => createProjectSchema.parse({ ...valid, budget: "100.123" })).toThrow();
  });

  it("accepts boundary as array of geopoints", () => {
    const withBoundary = {
      ...valid,
      boundary: [
        { lat: 33.5, lng: -5.1 },
        { lat: 33.6, lng: -5.1 },
        { lat: 33.6, lng: -5.0 },
      ],
    };
    expect(createProjectSchema.parse(withBoundary).boundary).toHaveLength(3);
  });

  it("rejects boundary with fewer than 3 points", () => {
    expect(() =>
      createProjectSchema.parse({
        ...valid,
        boundary: [{ lat: 33.5, lng: -5.1 }, { lat: 33.6, lng: -5.1 }],
      })
    ).toThrow();
  });
});

describe("updateProjectSchema", () => {
  it("accepts all optional fields", () => {
    expect(updateProjectSchema.parse({})).toEqual({});
  });

  it("accepts status update", () => {
    expect(updateProjectSchema.parse({ status: "suspended" })).toEqual({ status: "suspended" });
  });

  it("accepts nullable boundary", () => {
    expect(updateProjectSchema.parse({ boundary: null })).toEqual({ boundary: null });
  });
});

describe("projectResponseSchema", () => {
  it("accepts valid response", () => {
    const data = {
      id: VALID_UUID,
      name: "Route N8",
      region: "Fes-Meknes",
      budget: "45000000.00",
      donor: null,
      status: "active",
      boundary: null,
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
    };
    expect(projectResponseSchema.parse(data)).toBeDefined();
  });
});

// ─── Milestone Schemas ───────────────────────────────────────────────────────

describe("createMilestoneSchema", () => {
  const valid = {
    projectId: VALID_UUID,
    sequenceNumber: 1,
    description: "Terrain clearing",
    deadline: "2025-06-30",
  };

  it("accepts valid input with defaults", () => {
    const result = createMilestoneSchema.parse(valid);
    expect(result.requiredInspectorCount).toBe(1);
    expect(result.requiredAuditorCount).toBe(1);
    expect(result.requiredCitizenCount).toBe(3);
  });

  it("accepts custom quorum counts", () => {
    const custom = { ...valid, requiredCitizenCount: 5 };
    expect(createMilestoneSchema.parse(custom).requiredCitizenCount).toBe(5);
  });

  it("rejects sequenceNumber < 1", () => {
    expect(() => createMilestoneSchema.parse({ ...valid, sequenceNumber: 0 })).toThrow();
  });
});

describe("updateMilestoneSchema", () => {
  it("accepts partial update", () => {
    expect(updateMilestoneSchema.parse({ status: "in_progress" })).toEqual({ status: "in_progress" });
  });

  it("rejects invalid status", () => {
    expect(() => updateMilestoneSchema.parse({ status: "unknown" })).toThrow();
  });
});

describe("milestoneResponseSchema", () => {
  it("accepts valid response", () => {
    const data = {
      id: VALID_UUID,
      projectId: VALID_UUID,
      sequenceNumber: 1,
      description: "Test",
      deadline: NOW,
      status: "pending",
      requiredInspectorCount: 1,
      requiredAuditorCount: 1,
      requiredCitizenCount: 3,
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
    };
    expect(milestoneResponseSchema.parse(data)).toBeDefined();
  });
});

// ─── Attestation Schemas ─────────────────────────────────────────────────────

describe("createAttestationSchema", () => {
  const valid = {
    milestoneId: VALID_UUID,
    actorId: VALID_UUID,
    type: "inspector_verification",
    evidenceHash: VALID_HASH,
    gpsLatitude: "33.5289000",
    gpsLongitude: "-5.1025000",
    deviceAttestationToken: "android-key-att-v3",
    digitalSignature: VALID_SIG,
  };

  it("accepts valid input", () => {
    expect(createAttestationSchema.parse(valid)).toEqual(valid);
  });

  it("rejects invalid attestation type", () => {
    expect(() => createAttestationSchema.parse({ ...valid, type: "peer_review" })).toThrow();
  });

  it("rejects empty signature", () => {
    expect(() => createAttestationSchema.parse({ ...valid, digitalSignature: "" })).toThrow();
  });

  it("rejects latitude with 8 decimal places", () => {
    expect(() => createAttestationSchema.parse({ ...valid, gpsLatitude: "33.52890001" })).toThrow();
  });

  it("accepts all three attestation types", () => {
    for (const type of ["inspector_verification", "auditor_review", "citizen_approval"]) {
      expect(createAttestationSchema.parse({ ...valid, type })).toBeDefined();
    }
  });
});

describe("attestationResponseSchema", () => {
  it("accepts valid response", () => {
    const data = {
      id: VALID_UUID,
      milestoneId: VALID_UUID,
      actorId: VALID_UUID,
      type: "citizen_approval",
      evidenceHash: VALID_HASH,
      gpsLatitude: "33.5289000",
      gpsLongitude: "-5.1025000",
      deviceAttestationToken: "token",
      digitalSignature: VALID_SIG,
      status: "submitted",
      submittedAt: NOW,
      revokedAt: null,
    };
    expect(attestationResponseSchema.parse(data)).toBeDefined();
  });
});

// ─── AuditorAssignment Schemas ───────────────────────────────────────────────

describe("createAuditorAssignmentSchema", () => {
  it("accepts valid input", () => {
    const valid = { milestoneId: VALID_UUID, auditorId: VALID_UUID, rotationRound: 1 };
    expect(createAuditorAssignmentSchema.parse(valid)).toEqual(valid);
  });

  it("rejects rotationRound < 1", () => {
    expect(() =>
      createAuditorAssignmentSchema.parse({ milestoneId: VALID_UUID, auditorId: VALID_UUID, rotationRound: 0 })
    ).toThrow();
  });
});

describe("updateAuditorAssignmentSchema", () => {
  it("accepts status with conflict info", () => {
    const data = { status: "recused", conflictDeclared: true, conflictReason: "Financial ties" };
    expect(updateAuditorAssignmentSchema.parse(data)).toEqual(data);
  });

  it("rejects invalid status", () => {
    expect(() => updateAuditorAssignmentSchema.parse({ status: "pending" })).toThrow();
  });
});

// ─── CitizenPool Schemas ─────────────────────────────────────────────────────

describe("createCitizenPoolSchema", () => {
  it("accepts valid input", () => {
    const valid = {
      milestoneId: VALID_UUID,
      citizenId: VALID_UUID,
      proximityProofHash: VALID_HASH,
      assuranceTier: "biometric",
    };
    expect(createCitizenPoolSchema.parse(valid)).toEqual(valid);
  });

  it("rejects invalid assurance tier", () => {
    expect(() =>
      createCitizenPoolSchema.parse({
        milestoneId: VALID_UUID,
        citizenId: VALID_UUID,
        proximityProofHash: VALID_HASH,
        assuranceTier: "sms",
      })
    ).toThrow();
  });
});

describe("updateCitizenPoolSchema", () => {
  it("accepts valid status", () => {
    expect(updateCitizenPoolSchema.parse({ status: "attested" })).toEqual({ status: "attested" });
  });
});

// ─── ComplianceCertificate Schemas ───────────────────────────────────────────

describe("complianceCertificateResponseSchema", () => {
  it("accepts valid response", () => {
    const data = {
      id: VALID_UUID,
      milestoneId: VALID_UUID,
      certificateHash: VALID_HASH,
      digitalSignature: VALID_SIG,
      status: "issued",
      tgrReference: null,
      revocationReason: null,
      issuedAt: NOW,
      revokedAt: null,
    };
    expect(complianceCertificateResponseSchema.parse(data)).toBeDefined();
  });
});

describe("revokeCertificateSchema", () => {
  it("accepts valid reason", () => {
    expect(revokeCertificateSchema.parse({ revocationReason: "Fraud detected" })).toEqual({
      revocationReason: "Fraud detected",
    });
  });

  it("rejects empty reason", () => {
    expect(() => revokeCertificateSchema.parse({ revocationReason: "" })).toThrow();
  });
});

// ─── DisputeResolution Schemas ───────────────────────────────────────────────

describe("createDisputeSchema", () => {
  it("accepts valid input", () => {
    const valid = { milestoneId: VALID_UUID, raisedById: VALID_UUID, reason: "Quality concern" };
    expect(createDisputeSchema.parse(valid)).toEqual(valid);
  });

  it("rejects empty reason", () => {
    expect(() =>
      createDisputeSchema.parse({ milestoneId: VALID_UUID, raisedById: VALID_UUID, reason: "" })
    ).toThrow();
  });
});

describe("resolveDisputeSchema", () => {
  it("accepts resolved with notes", () => {
    const data = { status: "resolved", resolutionNotes: "Re-inspection passed" };
    expect(resolveDisputeSchema.parse(data)).toEqual(data);
  });

  it("accepts dismissed with reassigned auditor", () => {
    const data = {
      status: "dismissed",
      resolutionNotes: "No evidence found",
      reassignedAuditorId: VALID_UUID,
    };
    expect(resolveDisputeSchema.parse(data)).toEqual(data);
  });

  it("rejects status other than resolved/dismissed", () => {
    expect(() =>
      resolveDisputeSchema.parse({ status: "open", resolutionNotes: "note" })
    ).toThrow();
  });
});

describe("disputeResponseSchema", () => {
  it("accepts valid response", () => {
    const data = {
      id: VALID_UUID,
      milestoneId: VALID_UUID,
      raisedById: VALID_UUID,
      reassignedAuditorId: null,
      reason: "Quality concern",
      status: "open",
      resolutionNotes: null,
      raisedAt: NOW,
      resolvedAt: null,
      updatedAt: NOW,
    };
    expect(disputeResponseSchema.parse(data)).toBeDefined();
  });
});

// ─── TrustedIssuerRegistry Schemas ───────────────────────────────────────────

describe("createTrustedIssuerSchema", () => {
  it("accepts valid input", () => {
    const valid = {
      issuerDid: VALID_DID,
      issuerName: "MOSIP Morocco",
      credentialTypes: ["IdentityCredential"],
    };
    expect(createTrustedIssuerSchema.parse(valid)).toEqual(valid);
  });

  it("requires at least one credential type", () => {
    expect(() =>
      createTrustedIssuerSchema.parse({
        issuerDid: VALID_DID,
        issuerName: "MOSIP",
        credentialTypes: [],
      })
    ).toThrow();
  });
});

describe("trustedIssuerResponseSchema", () => {
  it("accepts valid response", () => {
    const data = {
      id: VALID_UUID,
      issuerDid: VALID_DID,
      issuerName: "MOSIP Morocco",
      credentialTypes: ["IdentityCredential"],
      active: true,
      revocationReason: null,
      activatedAt: NOW,
      revokedAt: null,
      updatedAt: NOW,
    };
    expect(trustedIssuerResponseSchema.parse(data)).toBeDefined();
  });
});

// ─── WebhookSubscription Schemas ─────────────────────────────────────────────

describe("createWebhookSubscriptionSchema", () => {
  const valid = {
    url: "https://tgr.gov.ma/webhooks",
    eventTypes: ["certificate_issued"],
    secret: "a-very-long-secret-key",
    subscriberName: "TGR",
  };

  it("accepts valid input", () => {
    expect(createWebhookSubscriptionSchema.parse(valid)).toEqual(valid);
  });

  it("rejects invalid URL", () => {
    expect(() => createWebhookSubscriptionSchema.parse({ ...valid, url: "not-a-url" })).toThrow();
  });

  it("rejects empty event types", () => {
    expect(() => createWebhookSubscriptionSchema.parse({ ...valid, eventTypes: [] })).toThrow();
  });

  it("rejects secret shorter than 16 characters", () => {
    expect(() => createWebhookSubscriptionSchema.parse({ ...valid, secret: "short" })).toThrow();
  });

  it("rejects invalid event type", () => {
    expect(() =>
      createWebhookSubscriptionSchema.parse({ ...valid, eventTypes: ["user_created"] })
    ).toThrow();
  });
});

describe("webhookSubscriptionResponseSchema", () => {
  it("accepts valid response (no secretHash exposed)", () => {
    const data = {
      id: VALID_UUID,
      url: "https://tgr.gov.ma/webhooks",
      eventTypes: ["certificate_issued"],
      subscriberName: "TGR",
      active: true,
      createdAt: NOW,
      updatedAt: NOW,
    };
    expect(webhookSubscriptionResponseSchema.parse(data)).toBeDefined();
  });
});

// ─── AuditLog Schemas ────────────────────────────────────────────────────────

describe("auditLogResponseSchema", () => {
  it("accepts valid response", () => {
    const data = {
      id: VALID_UUID,
      entityType: "Project",
      entityId: VALID_UUID,
      action: "create",
      actorDid: VALID_DID,
      payloadHash: VALID_HASH,
      metadata: { source: "api" },
      timestamp: NOW,
    };
    expect(auditLogResponseSchema.parse(data)).toBeDefined();
  });

  it("accepts null metadata", () => {
    const data = {
      id: VALID_UUID,
      entityType: "Project",
      entityId: VALID_UUID,
      action: "create",
      actorDid: VALID_DID,
      payloadHash: VALID_HASH,
      metadata: null,
      timestamp: NOW,
    };
    expect(auditLogResponseSchema.parse(data).metadata).toBeNull();
  });
});

describe("auditLogQuerySchema", () => {
  it("accepts empty query with defaults", () => {
    const result = auditLogQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("accepts filtered query", () => {
    const data = {
      entityType: "Project",
      action: "create",
      page: 2,
      limit: 50,
    };
    const result = auditLogQuerySchema.parse(data);
    expect(result.entityType).toBe("Project");
    expect(result.page).toBe(2);
  });

  it("accepts date range", () => {
    const data = {
      from: "2025-01-01",
      to: "2025-12-31",
    };
    const result = auditLogQuerySchema.parse(data);
    expect(result.from).toBeInstanceOf(Date);
    expect(result.to).toBeInstanceOf(Date);
  });
});
