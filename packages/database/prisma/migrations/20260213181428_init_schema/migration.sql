-- CreateEnum
CREATE TYPE "project_status" AS ENUM ('draft', 'active', 'suspended', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "milestone_status" AS ENUM ('pending', 'in_progress', 'attestation_in_progress', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "actor_role" AS ENUM ('contractor_engineer', 'independent_auditor', 'citizen', 'admin', 'cso_aggregator');

-- CreateEnum
CREATE TYPE "organization_type" AS ENUM ('engineering_firm', 'construction_company', 'cso', 'government_body', 'donor_agency');

-- CreateEnum
CREATE TYPE "organization_status" AS ENUM ('active', 'suspended', 'dissolved');

-- CreateEnum
CREATE TYPE "attestation_type" AS ENUM ('inspector_verification', 'auditor_review', 'citizen_approval');

-- CreateEnum
CREATE TYPE "attestation_status" AS ENUM ('submitted', 'verified', 'rejected', 'revoked');

-- CreateEnum
CREATE TYPE "certificate_status" AS ENUM ('issued', 'delivered_to_tgr', 'acknowledged', 'revoked');

-- CreateEnum
CREATE TYPE "assurance_tier" AS ENUM ('biometric', 'ussd', 'cso_mediated');

-- CreateEnum
CREATE TYPE "dispute_status" AS ENUM ('open', 'under_review', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "auditor_assignment_status" AS ENUM ('assigned', 'accepted', 'completed', 'recused', 'replaced');

-- CreateEnum
CREATE TYPE "citizen_pool_status" AS ENUM ('enrolled', 'attested', 'withdrawn', 'excluded');

-- CreateEnum
CREATE TYPE "audit_action" AS ENUM ('create', 'update', 'delete', 'revoke', 'submit', 'approve', 'reject', 'assign');

-- CreateEnum
CREATE TYPE "webhook_event_type" AS ENUM ('certificate_issued', 'certificate_revoked', 'milestone_completed', 'dispute_opened', 'dispute_resolved');

-- CreateTable
CREATE TABLE "actors" (
    "id" UUID NOT NULL,
    "did" TEXT NOT NULL,
    "cnie_hash" TEXT NOT NULL,
    "roles" "actor_role"[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "registration_hash" TEXT NOT NULL,
    "type" "organization_type" NOT NULL,
    "status" "organization_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actor_organizations" (
    "id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "role" TEXT NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actor_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "budget" DECIMAL(15,2) NOT NULL,
    "donor" TEXT,
    "status" "project_status" NOT NULL DEFAULT 'draft',
    "boundary" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "status" "milestone_status" NOT NULL DEFAULT 'pending',
    "required_inspector_count" INTEGER NOT NULL DEFAULT 1,
    "required_auditor_count" INTEGER NOT NULL DEFAULT 1,
    "required_citizen_count" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attestations" (
    "id" UUID NOT NULL,
    "milestone_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "type" "attestation_type" NOT NULL,
    "evidence_hash" TEXT NOT NULL,
    "gps_latitude" DECIMAL(10,7) NOT NULL,
    "gps_longitude" DECIMAL(10,7) NOT NULL,
    "device_attestation_token" TEXT NOT NULL,
    "digital_signature" TEXT NOT NULL,
    "status" "attestation_status" NOT NULL DEFAULT 'submitted',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "attestations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditor_assignments" (
    "id" UUID NOT NULL,
    "milestone_id" UUID NOT NULL,
    "auditor_id" UUID NOT NULL,
    "rotation_round" INTEGER NOT NULL,
    "conflict_declared" BOOLEAN NOT NULL DEFAULT false,
    "conflict_reason" TEXT,
    "status" "auditor_assignment_status" NOT NULL DEFAULT 'assigned',
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auditor_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "citizen_pools" (
    "id" UUID NOT NULL,
    "milestone_id" UUID NOT NULL,
    "citizen_id" UUID NOT NULL,
    "proximity_proof_hash" TEXT NOT NULL,
    "assurance_tier" "assurance_tier" NOT NULL,
    "status" "citizen_pool_status" NOT NULL DEFAULT 'enrolled',
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "citizen_pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_certificates" (
    "id" UUID NOT NULL,
    "milestone_id" UUID NOT NULL,
    "certificate_hash" TEXT NOT NULL,
    "digital_signature" TEXT NOT NULL,
    "status" "certificate_status" NOT NULL DEFAULT 'issued',
    "tgr_reference" TEXT,
    "revocation_reason" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "compliance_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispute_resolutions" (
    "id" UUID NOT NULL,
    "milestone_id" UUID NOT NULL,
    "raised_by_id" UUID NOT NULL,
    "reassigned_auditor_id" UUID,
    "reason" TEXT NOT NULL,
    "status" "dispute_status" NOT NULL DEFAULT 'open',
    "resolution_notes" TEXT,
    "raised_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispute_resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trusted_issuer_registry" (
    "id" UUID NOT NULL,
    "issuer_did" TEXT NOT NULL,
    "issuer_name" TEXT NOT NULL,
    "credential_types" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "revocation_reason" TEXT,
    "activated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trusted_issuer_registry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_subscriptions" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "event_types" "webhook_event_type"[],
    "secret_hash" TEXT NOT NULL,
    "subscriber_name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "webhook_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" "audit_action" NOT NULL,
    "actor_did" TEXT NOT NULL,
    "payload_hash" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "actors_did_key" ON "actors"("did");

-- CreateIndex
CREATE UNIQUE INDEX "actors_cnie_hash_key" ON "actors"("cnie_hash");

-- CreateIndex
CREATE INDEX "actors_did_idx" ON "actors"("did");

-- CreateIndex
CREATE INDEX "actors_cnie_hash_idx" ON "actors"("cnie_hash");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_registration_hash_key" ON "organizations"("registration_hash");

-- CreateIndex
CREATE INDEX "organizations_type_idx" ON "organizations"("type");

-- CreateIndex
CREATE INDEX "organizations_status_idx" ON "organizations"("status");

-- CreateIndex
CREATE INDEX "actor_organizations_actor_id_idx" ON "actor_organizations"("actor_id");

-- CreateIndex
CREATE INDEX "actor_organizations_organization_id_idx" ON "actor_organizations"("organization_id");

-- CreateIndex
CREATE INDEX "actor_organizations_valid_from_valid_until_idx" ON "actor_organizations"("valid_from", "valid_until");

-- CreateIndex
CREATE UNIQUE INDEX "actor_organizations_actor_id_organization_id_role_valid_fro_key" ON "actor_organizations"("actor_id", "organization_id", "role", "valid_from");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_region_idx" ON "projects"("region");

-- CreateIndex
CREATE INDEX "milestones_project_id_idx" ON "milestones"("project_id");

-- CreateIndex
CREATE INDEX "milestones_status_idx" ON "milestones"("status");

-- CreateIndex
CREATE UNIQUE INDEX "milestones_project_id_sequence_number_key" ON "milestones"("project_id", "sequence_number");

-- CreateIndex
CREATE INDEX "attestations_milestone_id_idx" ON "attestations"("milestone_id");

-- CreateIndex
CREATE INDEX "attestations_actor_id_idx" ON "attestations"("actor_id");

-- CreateIndex
CREATE INDEX "attestations_type_idx" ON "attestations"("type");

-- CreateIndex
CREATE INDEX "attestations_status_idx" ON "attestations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "attestations_milestone_id_actor_id_type_key" ON "attestations"("milestone_id", "actor_id", "type");

-- CreateIndex
CREATE INDEX "auditor_assignments_milestone_id_idx" ON "auditor_assignments"("milestone_id");

-- CreateIndex
CREATE INDEX "auditor_assignments_auditor_id_idx" ON "auditor_assignments"("auditor_id");

-- CreateIndex
CREATE INDEX "auditor_assignments_status_idx" ON "auditor_assignments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "auditor_assignments_milestone_id_auditor_id_key" ON "auditor_assignments"("milestone_id", "auditor_id");

-- CreateIndex
CREATE INDEX "citizen_pools_milestone_id_idx" ON "citizen_pools"("milestone_id");

-- CreateIndex
CREATE INDEX "citizen_pools_citizen_id_idx" ON "citizen_pools"("citizen_id");

-- CreateIndex
CREATE INDEX "citizen_pools_assurance_tier_idx" ON "citizen_pools"("assurance_tier");

-- CreateIndex
CREATE UNIQUE INDEX "citizen_pools_milestone_id_citizen_id_key" ON "citizen_pools"("milestone_id", "citizen_id");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_certificates_milestone_id_key" ON "compliance_certificates"("milestone_id");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_certificates_certificate_hash_key" ON "compliance_certificates"("certificate_hash");

-- CreateIndex
CREATE INDEX "compliance_certificates_status_idx" ON "compliance_certificates"("status");

-- CreateIndex
CREATE INDEX "compliance_certificates_certificate_hash_idx" ON "compliance_certificates"("certificate_hash");

-- CreateIndex
CREATE INDEX "dispute_resolutions_milestone_id_idx" ON "dispute_resolutions"("milestone_id");

-- CreateIndex
CREATE INDEX "dispute_resolutions_raised_by_id_idx" ON "dispute_resolutions"("raised_by_id");

-- CreateIndex
CREATE INDEX "dispute_resolutions_status_idx" ON "dispute_resolutions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "trusted_issuer_registry_issuer_did_key" ON "trusted_issuer_registry"("issuer_did");

-- CreateIndex
CREATE INDEX "trusted_issuer_registry_issuer_did_idx" ON "trusted_issuer_registry"("issuer_did");

-- CreateIndex
CREATE INDEX "trusted_issuer_registry_active_idx" ON "trusted_issuer_registry"("active");

-- CreateIndex
CREATE INDEX "webhook_subscriptions_active_idx" ON "webhook_subscriptions"("active");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_did_idx" ON "audit_logs"("actor_did");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- AddForeignKey
ALTER TABLE "actor_organizations" ADD CONSTRAINT "actor_organizations_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "actors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actor_organizations" ADD CONSTRAINT "actor_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "actors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditor_assignments" ADD CONSTRAINT "auditor_assignments_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditor_assignments" ADD CONSTRAINT "auditor_assignments_auditor_id_fkey" FOREIGN KEY ("auditor_id") REFERENCES "actors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_pools" ADD CONSTRAINT "citizen_pools_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "citizen_pools" ADD CONSTRAINT "citizen_pools_citizen_id_fkey" FOREIGN KEY ("citizen_id") REFERENCES "actors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_certificates" ADD CONSTRAINT "compliance_certificates_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_resolutions" ADD CONSTRAINT "dispute_resolutions_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "milestones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispute_resolutions" ADD CONSTRAINT "dispute_resolutions_raised_by_id_fkey" FOREIGN KEY ("raised_by_id") REFERENCES "actors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
