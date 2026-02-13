// ─── Enum Types ──────────────────────────────────────────────────────────────
// Mirror Prisma enums as const string unions for use outside the Prisma client.

export const ProjectStatus = {
  draft: "draft",
  active: "active",
  suspended: "suspended",
  completed: "completed",
  archived: "archived",
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];

export const MilestoneStatus = {
  pending: "pending",
  in_progress: "in_progress",
  attestation_in_progress: "attestation_in_progress",
  completed: "completed",
  failed: "failed",
} as const;
export type MilestoneStatus =
  (typeof MilestoneStatus)[keyof typeof MilestoneStatus];

export const ActorRole = {
  contractor_engineer: "contractor_engineer",
  independent_auditor: "independent_auditor",
  citizen: "citizen",
  admin: "admin",
  cso_aggregator: "cso_aggregator",
} as const;
export type ActorRole = (typeof ActorRole)[keyof typeof ActorRole];

export const OrganizationType = {
  engineering_firm: "engineering_firm",
  construction_company: "construction_company",
  cso: "cso",
  government_body: "government_body",
  donor_agency: "donor_agency",
} as const;
export type OrganizationType =
  (typeof OrganizationType)[keyof typeof OrganizationType];

export const OrganizationStatus = {
  active: "active",
  suspended: "suspended",
  dissolved: "dissolved",
} as const;
export type OrganizationStatus =
  (typeof OrganizationStatus)[keyof typeof OrganizationStatus];

export const AttestationType = {
  inspector_verification: "inspector_verification",
  auditor_review: "auditor_review",
  citizen_approval: "citizen_approval",
} as const;
export type AttestationType =
  (typeof AttestationType)[keyof typeof AttestationType];

export const AttestationStatus = {
  submitted: "submitted",
  verified: "verified",
  rejected: "rejected",
  revoked: "revoked",
} as const;
export type AttestationStatus =
  (typeof AttestationStatus)[keyof typeof AttestationStatus];

export const CertificateStatus = {
  issued: "issued",
  delivered_to_tgr: "delivered_to_tgr",
  acknowledged: "acknowledged",
  revoked: "revoked",
} as const;
export type CertificateStatus =
  (typeof CertificateStatus)[keyof typeof CertificateStatus];

export const AssuranceTier = {
  biometric: "biometric",
  ussd: "ussd",
  cso_mediated: "cso_mediated",
} as const;
export type AssuranceTier = (typeof AssuranceTier)[keyof typeof AssuranceTier];

export const DisputeStatus = {
  open: "open",
  under_review: "under_review",
  resolved: "resolved",
  dismissed: "dismissed",
} as const;
export type DisputeStatus =
  (typeof DisputeStatus)[keyof typeof DisputeStatus];

export const AuditorAssignmentStatus = {
  assigned: "assigned",
  accepted: "accepted",
  completed: "completed",
  recused: "recused",
  replaced: "replaced",
} as const;
export type AuditorAssignmentStatus =
  (typeof AuditorAssignmentStatus)[keyof typeof AuditorAssignmentStatus];

export const CitizenPoolStatus = {
  enrolled: "enrolled",
  attested: "attested",
  withdrawn: "withdrawn",
  excluded: "excluded",
} as const;
export type CitizenPoolStatus =
  (typeof CitizenPoolStatus)[keyof typeof CitizenPoolStatus];

export const AuditAction = {
  create: "create",
  update: "update",
  delete: "delete",
  revoke: "revoke",
  submit: "submit",
  approve: "approve",
  reject: "reject",
  assign: "assign",
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const WebhookEventType = {
  certificate_issued: "certificate_issued",
  certificate_revoked: "certificate_revoked",
  milestone_completed: "milestone_completed",
  dispute_opened: "dispute_opened",
  dispute_resolved: "dispute_resolved",
} as const;
export type WebhookEventType =
  (typeof WebhookEventType)[keyof typeof WebhookEventType];

// ─── Entity Types ────────────────────────────────────────────────────────────

export interface Actor {
  id: string;
  did: string;
  cnieHash: string;
  roles: ActorRole[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  registrationHash: string;
  type: OrganizationType;
  status: OrganizationStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ActorOrganization {
  id: string;
  actorId: string;
  organizationId: string;
  role: string;
  validFrom: Date;
  validUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  region: string;
  budget: string; // Decimal serialized as string
  donor: string | null;
  status: ProjectStatus;
  boundary: GeoPoint[] | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Milestone {
  id: string;
  projectId: string;
  sequenceNumber: number;
  description: string;
  deadline: Date;
  status: MilestoneStatus;
  requiredInspectorCount: number;
  requiredAuditorCount: number;
  requiredCitizenCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface Attestation {
  id: string;
  milestoneId: string;
  actorId: string;
  type: AttestationType;
  evidenceHash: string;
  gpsLatitude: string; // Decimal serialized as string
  gpsLongitude: string; // Decimal serialized as string
  deviceAttestationToken: string;
  digitalSignature: string;
  status: AttestationStatus;
  submittedAt: Date;
  revokedAt: Date | null;
}

export interface AuditorAssignment {
  id: string;
  milestoneId: string;
  auditorId: string;
  rotationRound: number;
  conflictDeclared: boolean;
  conflictReason: string | null;
  status: AuditorAssignmentStatus;
  assignedAt: Date;
  updatedAt: Date;
}

export interface CitizenPool {
  id: string;
  milestoneId: string;
  citizenId: string;
  proximityProofHash: string;
  assuranceTier: AssuranceTier;
  status: CitizenPoolStatus;
  enrolledAt: Date;
  updatedAt: Date;
}

export interface ComplianceCertificate {
  id: string;
  milestoneId: string;
  certificateHash: string;
  digitalSignature: string;
  status: CertificateStatus;
  tgrReference: string | null;
  revocationReason: string | null;
  issuedAt: Date;
  revokedAt: Date | null;
}

export interface DisputeResolution {
  id: string;
  milestoneId: string;
  raisedById: string;
  reassignedAuditorId: string | null;
  reason: string;
  status: DisputeStatus;
  resolutionNotes: string | null;
  raisedAt: Date;
  resolvedAt: Date | null;
  updatedAt: Date;
}

export interface TrustedIssuerRegistry {
  id: string;
  issuerDid: string;
  issuerName: string;
  credentialTypes: string[];
  active: boolean;
  revocationReason: string | null;
  activatedAt: Date;
  revokedAt: Date | null;
  updatedAt: Date;
}

export interface WebhookSubscription {
  id: string;
  url: string;
  eventTypes: WebhookEventType[];
  secretHash: string;
  subscriberName: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  actorDid: string;
  payloadHash: string;
  metadata: Record<string, unknown> | null;
  timestamp: Date;
}

// ─── Quorum Types ─────────────────────────────────────────────────────────────

export interface QuorumTypeStatus {
  required: number;
  current: number;
  met: boolean;
}

export interface CitizenQuorumStatus {
  required: number;
  weightedScore: number;
  met: boolean;
  breakdown: Array<{
    actorId: string;
    assuranceTier: AssuranceTier;
    weight: number;
  }>;
}

export interface QuorumBreakdown {
  milestoneId: string;
  inspector: QuorumTypeStatus;
  auditor: QuorumTypeStatus;
  citizen: CitizenQuorumStatus;
  overallMet: boolean;
}

// ─── Re-exports ──────────────────────────────────────────────────────────────

export type { AppError, AppErrorCode } from "./errors.js";
export {
  NotFoundError,
  ValidationError,
  AuthorizationError,
  ConflictError,
  QuorumNotMetError,
} from "./errors.js";

// ─── Validator Re-exports ───────────────────────────────────────────────────

export {
  // Primitive schemas
  uuidSchema,
  didSchema,
  sha256HashSchema,
  ed25519SignatureSchema,
  geoPointSchema,
  paginationSchema,
  // Enum schemas
  projectStatusSchema,
  milestoneStatusSchema,
  actorRoleSchema,
  organizationTypeSchema,
  organizationStatusSchema,
  attestationTypeSchema,
  attestationStatusSchema,
  certificateStatusSchema,
  assuranceTierSchema,
  disputeStatusSchema,
  auditorAssignmentStatusSchema,
  citizenPoolStatusSchema,
  auditActionSchema,
  webhookEventTypeSchema,
  // Actor
  createActorSchema,
  actorResponseSchema,
  // Organization
  createOrganizationSchema,
  updateOrganizationSchema,
  organizationResponseSchema,
  // ActorOrganization
  createActorOrganizationSchema,
  // Project
  createProjectSchema,
  updateProjectSchema,
  projectResponseSchema,
  // Milestone
  createMilestoneSchema,
  updateMilestoneSchema,
  milestoneResponseSchema,
  // Attestation
  createAttestationSchema,
  attestationResponseSchema,
  // AuditorAssignment
  createAuditorAssignmentSchema,
  updateAuditorAssignmentSchema,
  // CitizenPool
  createCitizenPoolSchema,
  updateCitizenPoolSchema,
  // ComplianceCertificate
  complianceCertificateResponseSchema,
  revokeCertificateSchema,
  // Dispute
  createDisputeSchema,
  resolveDisputeSchema,
  disputeResponseSchema,
  // TrustedIssuer
  createTrustedIssuerSchema,
  trustedIssuerResponseSchema,
  // WebhookSubscription
  createWebhookSubscriptionSchema,
  webhookSubscriptionResponseSchema,
  // AuditLog
  auditLogResponseSchema,
  auditLogQuerySchema,
  // Milestone Attestation
  createMilestoneAttestationBodySchema,
  quorumBreakdownResponseSchema,
} from "./validators.js";

export type {
  CreateActorInput,
  ActorResponse,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationResponse,
  CreateActorOrganizationInput,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectResponse,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  MilestoneResponse,
  CreateAttestationInput,
  AttestationResponse,
  CreateAuditorAssignmentInput,
  UpdateAuditorAssignmentInput,
  CreateCitizenPoolInput,
  UpdateCitizenPoolInput,
  ComplianceCertificateResponse,
  RevokeCertificateInput,
  CreateDisputeInput,
  ResolveDisputeInput,
  DisputeResponse,
  CreateTrustedIssuerInput,
  TrustedIssuerResponse,
  CreateWebhookSubscriptionInput,
  WebhookSubscriptionResponse,
  AuditLogResponse,
  AuditLogQuery,
  CreateMilestoneAttestationBody,
  QuorumBreakdownResponse,
} from "./validators.js";
