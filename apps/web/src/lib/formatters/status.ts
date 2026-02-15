const STATUS_DISPLAY: Record<string, Record<string, { label: string; color: string }>> = {
  project: {
    draft: { label: "Draft", color: "text-muted-foreground" },
    active: { label: "Active", color: "text-accent" },
    suspended: { label: "Suspended", color: "text-warning" },
    completed: { label: "Completed", color: "text-primary" },
    archived: { label: "Archived", color: "text-muted-foreground" },
  },
  milestone: {
    pending: { label: "Pending", color: "text-muted-foreground" },
    in_progress: { label: "In Progress", color: "text-chart-4" },
    attestation_in_progress: { label: "Attestation In Progress", color: "text-warning" },
    completed: { label: "Completed", color: "text-accent" },
    failed: { label: "Failed", color: "text-destructive" },
  },
  attestation: {
    submitted: { label: "Submitted", color: "text-chart-4" },
    verified: { label: "Verified", color: "text-accent" },
    rejected: { label: "Rejected", color: "text-destructive" },
    revoked: { label: "Revoked", color: "text-destructive" },
  },
  certificate: {
    issued: { label: "Issued", color: "text-accent" },
    delivered_to_tgr: { label: "Delivered to TGR", color: "text-primary" },
    acknowledged: { label: "Acknowledged", color: "text-chart-4" },
    revoked: { label: "Revoked", color: "text-destructive" },
  },
  dispute: {
    open: { label: "Open", color: "text-warning" },
    under_review: { label: "Under Review", color: "text-chart-4" },
    resolved: { label: "Resolved", color: "text-accent" },
    dismissed: { label: "Dismissed", color: "text-muted-foreground" },
  },
  auditorAssignment: {
    assigned: { label: "Assigned", color: "text-chart-4" },
    accepted: { label: "Accepted", color: "text-accent" },
    completed: { label: "Completed", color: "text-primary" },
    recused: { label: "Recused", color: "text-warning" },
    replaced: { label: "Replaced", color: "text-muted-foreground" },
  },
};

export function getStatusDisplay(
  entity: string,
  status: string,
): { label: string; color: string } {
  return (
    STATUS_DISPLAY[entity]?.[status] ?? {
      label: status,
      color: "text-muted-foreground",
    }
  );
}

export function getStatusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (["completed", "verified", "issued", "resolved", "accepted", "active"].includes(status))
    return "default";
  if (["revoked", "failed", "rejected"].includes(status))
    return "destructive";
  if (["pending", "draft", "archived", "dismissed"].includes(status))
    return "secondary";
  return "outline";
}
