import { z } from "zod";

// ─── Shared Primitives ──────────────────────────────────────────────────────

export const uuidSchema = z.string().uuid();

export const didSchema = z
  .string()
  .regex(/^did:key:z[1-9A-HJ-NP-Za-km-z]+$/, "Invalid did:key format");

export const sha256HashSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/, "Invalid SHA-256 hash");

export const ed25519SignatureSchema = z
  .string()
  .min(1, "Digital signature is required");

export const geoPointSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Enum Schemas ────────────────────────────────────────────────────────────

export const projectStatusSchema = z.enum([
  "draft",
  "active",
  "suspended",
  "completed",
  "archived",
]);

export const milestoneStatusSchema = z.enum([
  "pending",
  "in_progress",
  "attestation_in_progress",
  "completed",
  "failed",
]);

export const actorRoleSchema = z.enum([
  "contractor_engineer",
  "independent_auditor",
  "citizen",
  "admin",
  "cso_aggregator",
]);

export const organizationTypeSchema = z.enum([
  "engineering_firm",
  "construction_company",
  "cso",
  "government_body",
  "donor_agency",
]);

export const organizationStatusSchema = z.enum([
  "active",
  "suspended",
  "dissolved",
]);

export const attestationTypeSchema = z.enum([
  "inspector_verification",
  "auditor_review",
  "citizen_approval",
]);

export const attestationStatusSchema = z.enum([
  "submitted",
  "verified",
  "rejected",
  "revoked",
]);

export const certificateStatusSchema = z.enum([
  "issued",
  "delivered_to_tgr",
  "acknowledged",
  "revoked",
]);

export const assuranceTierSchema = z.enum([
  "biometric",
  "ussd",
  "cso_mediated",
]);

export const disputeStatusSchema = z.enum([
  "open",
  "under_review",
  "resolved",
  "dismissed",
]);

export const auditorAssignmentStatusSchema = z.enum([
  "assigned",
  "accepted",
  "completed",
  "recused",
  "replaced",
]);

export const citizenPoolStatusSchema = z.enum([
  "enrolled",
  "attested",
  "withdrawn",
  "excluded",
]);

export const auditActionSchema = z.enum([
  "create",
  "update",
  "delete",
  "revoke",
  "submit",
  "approve",
  "reject",
  "assign",
]);

export const webhookEventTypeSchema = z.enum([
  "certificate_issued",
  "certificate_revoked",
  "milestone_completed",
  "dispute_opened",
  "dispute_resolved",
]);

// ─── Actor Schemas ───────────────────────────────────────────────────────────

export const createActorSchema = z.object({
  did: didSchema,
  cnieHash: sha256HashSchema,
  roles: z.array(actorRoleSchema).min(1),
});
export type CreateActorInput = z.infer<typeof createActorSchema>;

export const actorResponseSchema = z.object({
  id: uuidSchema,
  did: didSchema,
  cnieHash: sha256HashSchema,
  roles: z.array(actorRoleSchema),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type ActorResponse = z.infer<typeof actorResponseSchema>;

// ─── Organization Schemas ────────────────────────────────────────────────────

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(255),
  registrationHash: sha256HashSchema,
  type: organizationTypeSchema,
});
export type CreateOrganizationInput = z.infer<
  typeof createOrganizationSchema
>;

export const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: organizationStatusSchema.optional(),
});
export type UpdateOrganizationInput = z.infer<
  typeof updateOrganizationSchema
>;

export const organizationResponseSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  registrationHash: z.string(),
  type: organizationTypeSchema,
  status: organizationStatusSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});
export type OrganizationResponse = z.infer<typeof organizationResponseSchema>;

// ─── ActorOrganization Schemas ───────────────────────────────────────────────

export const createActorOrganizationSchema = z.object({
  actorId: uuidSchema,
  organizationId: uuidSchema,
  role: z.string().min(1).max(100),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date().optional(),
});
export type CreateActorOrganizationInput = z.infer<
  typeof createActorOrganizationSchema
>;

// ─── Project Schemas ─────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  region: z.string().min(1).max(100),
  budget: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Budget must be a decimal string with up to 2 decimal places"),
  donor: z.string().max(255).optional(),
  boundary: z.array(geoPointSchema).min(3).optional(),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  region: z.string().min(1).max(100).optional(),
  budget: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Budget must be a decimal string with up to 2 decimal places")
    .optional(),
  donor: z.string().max(255).nullable().optional(),
  status: projectStatusSchema.optional(),
  boundary: z.array(geoPointSchema).min(3).nullable().optional(),
});
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const projectResponseSchema = z.object({
  id: uuidSchema,
  name: z.string(),
  region: z.string(),
  budget: z.string(),
  donor: z.string().nullable(),
  status: projectStatusSchema,
  boundary: z.array(geoPointSchema).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});
export type ProjectResponse = z.infer<typeof projectResponseSchema>;

// ─── Milestone Schemas ───────────────────────────────────────────────────────

export const createMilestoneSchema = z.object({
  projectId: uuidSchema,
  sequenceNumber: z.number().int().min(1),
  description: z.string().min(1).max(1000),
  deadline: z.coerce.date(),
  requiredInspectorCount: z.number().int().min(1).default(1),
  requiredAuditorCount: z.number().int().min(1).default(1),
  requiredCitizenCount: z.number().int().min(1).default(3),
});
export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;

export const updateMilestoneSchema = z.object({
  description: z.string().min(1).max(1000).optional(),
  deadline: z.coerce.date().optional(),
  status: milestoneStatusSchema.optional(),
  requiredInspectorCount: z.number().int().min(1).optional(),
  requiredAuditorCount: z.number().int().min(1).optional(),
  requiredCitizenCount: z.number().int().min(1).optional(),
});
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>;

export const milestoneResponseSchema = z.object({
  id: uuidSchema,
  projectId: uuidSchema,
  sequenceNumber: z.number().int(),
  description: z.string(),
  deadline: z.coerce.date(),
  status: milestoneStatusSchema,
  requiredInspectorCount: z.number().int(),
  requiredAuditorCount: z.number().int(),
  requiredCitizenCount: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});
export type MilestoneResponse = z.infer<typeof milestoneResponseSchema>;

// ─── Attestation Schemas ─────────────────────────────────────────────────────

export const createAttestationSchema = z.object({
  milestoneId: uuidSchema,
  actorId: uuidSchema,
  type: attestationTypeSchema,
  evidenceHash: sha256HashSchema,
  gpsLatitude: z
    .string()
    .regex(/^-?\d{1,3}\.\d{1,7}$/, "Latitude must have up to 7 decimal places"),
  gpsLongitude: z
    .string()
    .regex(/^-?\d{1,3}\.\d{1,7}$/, "Longitude must have up to 7 decimal places"),
  deviceAttestationToken: z.string().min(1),
  digitalSignature: ed25519SignatureSchema,
});
export type CreateAttestationInput = z.infer<typeof createAttestationSchema>;

export const attestationResponseSchema = z.object({
  id: uuidSchema,
  milestoneId: uuidSchema,
  actorId: uuidSchema,
  type: attestationTypeSchema,
  evidenceHash: z.string(),
  gpsLatitude: z.string(),
  gpsLongitude: z.string(),
  deviceAttestationToken: z.string(),
  digitalSignature: z.string(),
  status: attestationStatusSchema,
  submittedAt: z.coerce.date(),
  revokedAt: z.coerce.date().nullable(),
});
export type AttestationResponse = z.infer<typeof attestationResponseSchema>;

// ─── AuditorAssignment Schemas ───────────────────────────────────────────────

export const createAuditorAssignmentSchema = z.object({
  milestoneId: uuidSchema,
  auditorId: uuidSchema,
  rotationRound: z.number().int().min(1),
});
export type CreateAuditorAssignmentInput = z.infer<
  typeof createAuditorAssignmentSchema
>;

export const updateAuditorAssignmentSchema = z.object({
  status: auditorAssignmentStatusSchema,
  conflictDeclared: z.boolean().optional(),
  conflictReason: z.string().max(1000).optional(),
});
export type UpdateAuditorAssignmentInput = z.infer<
  typeof updateAuditorAssignmentSchema
>;

// ─── CitizenPool Schemas ─────────────────────────────────────────────────────

export const createCitizenPoolSchema = z.object({
  milestoneId: uuidSchema,
  citizenId: uuidSchema,
  proximityProofHash: sha256HashSchema,
  assuranceTier: assuranceTierSchema,
});
export type CreateCitizenPoolInput = z.infer<typeof createCitizenPoolSchema>;

export const updateCitizenPoolSchema = z.object({
  status: citizenPoolStatusSchema,
});
export type UpdateCitizenPoolInput = z.infer<typeof updateCitizenPoolSchema>;

// ─── ComplianceCertificate Schemas ───────────────────────────────────────────

export const complianceCertificateResponseSchema = z.object({
  id: uuidSchema,
  milestoneId: uuidSchema,
  certificateHash: z.string(),
  digitalSignature: z.string(),
  status: certificateStatusSchema,
  tgrReference: z.string().nullable(),
  revocationReason: z.string().nullable(),
  issuedAt: z.coerce.date(),
  revokedAt: z.coerce.date().nullable(),
});
export type ComplianceCertificateResponse = z.infer<
  typeof complianceCertificateResponseSchema
>;

export const revokeCertificateSchema = z.object({
  revocationReason: z.string().min(1).max(1000),
});
export type RevokeCertificateInput = z.infer<typeof revokeCertificateSchema>;

// ─── DisputeResolution Schemas ───────────────────────────────────────────────

export const createDisputeSchema = z.object({
  milestoneId: uuidSchema,
  raisedById: uuidSchema,
  reason: z.string().min(1).max(2000),
});
export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;

export const resolveDisputeSchema = z.object({
  status: z.enum(["resolved", "dismissed"]),
  resolutionNotes: z.string().min(1).max(2000),
  reassignedAuditorId: uuidSchema.optional(),
});
export type ResolveDisputeInput = z.infer<typeof resolveDisputeSchema>;

export const disputeResponseSchema = z.object({
  id: uuidSchema,
  milestoneId: uuidSchema,
  raisedById: uuidSchema,
  reassignedAuditorId: uuidSchema.nullable(),
  reason: z.string(),
  status: disputeStatusSchema,
  resolutionNotes: z.string().nullable(),
  raisedAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date(),
});
export type DisputeResponse = z.infer<typeof disputeResponseSchema>;

// ─── TrustedIssuerRegistry Schemas ───────────────────────────────────────────

export const createTrustedIssuerSchema = z.object({
  issuerDid: didSchema,
  issuerName: z.string().min(1).max(255),
  credentialTypes: z.array(z.string().min(1)).min(1),
});
export type CreateTrustedIssuerInput = z.infer<
  typeof createTrustedIssuerSchema
>;

export const trustedIssuerResponseSchema = z.object({
  id: uuidSchema,
  issuerDid: z.string(),
  issuerName: z.string(),
  credentialTypes: z.array(z.string()),
  active: z.boolean(),
  revocationReason: z.string().nullable(),
  activatedAt: z.coerce.date(),
  revokedAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date(),
});
export type TrustedIssuerResponse = z.infer<typeof trustedIssuerResponseSchema>;

// ─── WebhookSubscription Schemas ─────────────────────────────────────────────

export const createWebhookSubscriptionSchema = z.object({
  url: z.string().url(),
  eventTypes: z.array(webhookEventTypeSchema).min(1),
  secret: z.string().min(16).max(256),
  subscriberName: z.string().min(1).max(255),
});
export type CreateWebhookSubscriptionInput = z.infer<
  typeof createWebhookSubscriptionSchema
>;

export const webhookSubscriptionResponseSchema = z.object({
  id: uuidSchema,
  url: z.string(),
  eventTypes: z.array(webhookEventTypeSchema),
  subscriberName: z.string(),
  active: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type WebhookSubscriptionResponse = z.infer<
  typeof webhookSubscriptionResponseSchema
>;

// ─── AuditLog Schemas ────────────────────────────────────────────────────────

export const auditLogResponseSchema = z.object({
  id: uuidSchema,
  entityType: z.string(),
  entityId: uuidSchema,
  action: auditActionSchema,
  actorDid: z.string(),
  payloadHash: z.string(),
  metadata: z.record(z.unknown()).nullable(),
  timestamp: z.coerce.date(),
});
export type AuditLogResponse = z.infer<typeof auditLogResponseSchema>;

export const auditLogQuerySchema = z
  .object({
    entityType: z.string().optional(),
    entityId: uuidSchema.optional(),
    actorDid: z.string().optional(),
    action: auditActionSchema.optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .merge(paginationSchema);
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;

// ─── Milestone Attestation Body Schema ──────────────────────────────────────

export const createMilestoneAttestationBodySchema = z.object({
  actorId: uuidSchema,
  type: attestationTypeSchema,
  evidenceHash: sha256HashSchema,
  gpsLatitude: z
    .string()
    .regex(/^-?\d{1,3}\.\d{1,7}$/, "Latitude must have up to 7 decimal places"),
  gpsLongitude: z
    .string()
    .regex(/^-?\d{1,3}\.\d{1,7}$/, "Longitude must have up to 7 decimal places"),
  deviceAttestationToken: z.string().min(1),
  digitalSignature: ed25519SignatureSchema,
});
export type CreateMilestoneAttestationBody = z.infer<typeof createMilestoneAttestationBodySchema>;

// ─── Quorum Breakdown Response Schema ───────────────────────────────────────

export const quorumBreakdownResponseSchema = z.object({
  milestoneId: uuidSchema,
  inspector: z.object({
    required: z.number(),
    current: z.number(),
    met: z.boolean(),
  }),
  auditor: z.object({
    required: z.number(),
    current: z.number(),
    met: z.boolean(),
  }),
  citizen: z.object({
    required: z.number(),
    weightedScore: z.number(),
    met: z.boolean(),
    breakdown: z.array(
      z.object({
        actorId: uuidSchema,
        assuranceTier: assuranceTierSchema,
        weight: z.number(),
      }),
    ),
  }),
  overallMet: z.boolean(),
});
export type QuorumBreakdownResponse = z.infer<typeof quorumBreakdownResponseSchema>;
