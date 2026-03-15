/**
 * Status label and color formatters for all TML entity statuses.
 */

import type {
  ProjectStatus,
  MilestoneStatus,
  AttestationStatus,
  CertificateStatus,
  DisputeStatus,
  AuditorAssignmentStatus,
} from "@tml/types";

interface StatusDisplay {
  label: string;
  variant: "default" | "success" | "warning" | "destructive" | "secondary";
}

const projectStatusMap: Record<ProjectStatus, StatusDisplay> = {
  draft: { label: "Draft", variant: "secondary" },
  active: { label: "Active", variant: "success" },
  suspended: { label: "Suspended", variant: "warning" },
  completed: { label: "Completed", variant: "default" },
  archived: { label: "Archived", variant: "secondary" },
};

const milestoneStatusMap: Record<MilestoneStatus, StatusDisplay> = {
  pending: { label: "Pending", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "warning" },
  attestation_in_progress: { label: "Attestation In Progress", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
};

const attestationStatusMap: Record<AttestationStatus, StatusDisplay> = {
  submitted: { label: "Submitted", variant: "warning" },
  verified: { label: "Verified", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
  revoked: { label: "Revoked", variant: "destructive" },
};

const certificateStatusMap: Record<CertificateStatus, StatusDisplay> = {
  issued: { label: "Issued", variant: "success" },
  delivered_to_tgr: { label: "Delivered to TGR", variant: "default" },
  acknowledged: { label: "Acknowledged", variant: "success" },
  revoked: { label: "Revoked", variant: "destructive" },
};

const disputeStatusMap: Record<DisputeStatus, StatusDisplay> = {
  open: { label: "Open", variant: "warning" },
  under_review: { label: "Under Review", variant: "warning" },
  resolved: { label: "Resolved", variant: "success" },
  dismissed: { label: "Dismissed", variant: "secondary" },
};

const auditorAssignmentStatusMap: Record<AuditorAssignmentStatus, StatusDisplay> = {
  assigned: { label: "Assigned", variant: "secondary" },
  accepted: { label: "Accepted", variant: "success" },
  completed: { label: "Completed", variant: "success" },
  recused: { label: "Recused", variant: "warning" },
  replaced: { label: "Replaced", variant: "secondary" },
};

export function getProjectStatusDisplay(status: ProjectStatus): StatusDisplay {
  return projectStatusMap[status];
}

export function getMilestoneStatusDisplay(status: MilestoneStatus): StatusDisplay {
  return milestoneStatusMap[status];
}

export function getAttestationStatusDisplay(status: AttestationStatus): StatusDisplay {
  return attestationStatusMap[status];
}

export function getCertificateStatusDisplay(status: CertificateStatus): StatusDisplay {
  return certificateStatusMap[status];
}

export function getDisputeStatusDisplay(status: DisputeStatus): StatusDisplay {
  return disputeStatusMap[status];
}

export function getAuditorAssignmentStatusDisplay(status: AuditorAssignmentStatus): StatusDisplay {
  return auditorAssignmentStatusMap[status];
}
