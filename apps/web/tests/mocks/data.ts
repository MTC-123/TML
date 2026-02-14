import type {
  ProjectResponse,
  MilestoneResponse,
  AttestationResponse,
  ComplianceCertificateResponse,
  DisputeResponse,
  QuorumBreakdownResponse,
} from "@tml/types";

let counter = 0;
function uid(): string {
  counter += 1;
  return `00000000-0000-0000-0000-${String(counter).padStart(12, "0")}`;
}

export function mockProject(
  overrides: Partial<ProjectResponse> = {},
): ProjectResponse {
  return {
    id: uid(),
    name: "Route Nationale N1 Extension",
    region: "Rabat-Sale-Kenitra",
    budget: "5000000.00",
    donor: "World Bank",
    status: "active",
    boundary: null,
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
    deletedAt: null,
    ...overrides,
  } as ProjectResponse;
}

export function mockMilestone(
  overrides: Partial<MilestoneResponse> = {},
): MilestoneResponse {
  return {
    id: uid(),
    projectId: uid(),
    sequenceNumber: 1,
    description: "Foundation pouring completed",
    deadline: "2026-06-30T00:00:00Z",
    status: "pending",
    requiredInspectorCount: 2,
    requiredAuditorCount: 1,
    requiredCitizenCount: 3,
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-01-15T10:00:00Z",
    deletedAt: null,
    ...overrides,
  } as MilestoneResponse;
}

export function mockAttestation(
  overrides: Partial<AttestationResponse> = {},
): AttestationResponse {
  return {
    id: uid(),
    milestoneId: uid(),
    actorId: uid(),
    type: "inspector_verification",
    evidenceHash:
      "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    gpsLatitude: "33.971590",
    gpsLongitude: "-6.849813",
    deviceAttestationToken: "mock-token",
    digitalSignature: "mock-sig-" + "ab".repeat(60),
    status: "submitted",
    submittedAt: "2026-02-10T14:30:00Z",
    revokedAt: null,
    ...overrides,
  } as AttestationResponse;
}

export function mockCertificate(
  overrides: Partial<ComplianceCertificateResponse> = {},
): ComplianceCertificateResponse {
  return {
    id: uid(),
    milestoneId: uid(),
    certificateHash:
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    digitalSignature: "mock-signature-" + "cd".repeat(56),
    status: "issued",
    tgrReference: "TGR-2026-00142",
    revocationReason: null,
    issuedAt: "2026-02-12T16:00:00Z",
    revokedAt: null,
    ...overrides,
  } as ComplianceCertificateResponse;
}

export function mockUser() {
  return {
    id: uid(),
    did: "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
    roles: ["contractor_engineer" as const],
  };
}

export function mockDispute(
  overrides: Partial<DisputeResponse> = {},
): DisputeResponse {
  return {
    id: uid(),
    milestoneId: uid(),
    raisedById: uid(),
    reassignedAuditorId: null,
    reason: "Concrete quality does not meet specifications",
    status: "open",
    resolutionNotes: null,
    raisedAt: "2026-02-10T09:00:00Z",
    resolvedAt: null,
    updatedAt: "2026-02-10T09:00:00Z",
    ...overrides,
  } as DisputeResponse;
}

export function mockQuorum(
  overrides: Partial<QuorumBreakdownResponse> = {},
): QuorumBreakdownResponse {
  return {
    milestoneId: uid(),
    inspector: { required: 2, current: 1, met: false },
    auditor: { required: 1, current: 0, met: false },
    citizen: {
      required: 3,
      weightedScore: 1.5,
      met: false,
      breakdown: [],
    },
    overallMet: false,
    ...overrides,
  } as QuorumBreakdownResponse;
}
