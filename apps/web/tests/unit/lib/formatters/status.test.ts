import { describe, it, expect } from "vitest";
import {
  getProjectStatusDisplay,
  getMilestoneStatusDisplay,
  getAttestationStatusDisplay,
  getCertificateStatusDisplay,
  getDisputeStatusDisplay,
  getAuditorAssignmentStatusDisplay,
} from "@/lib/formatters/status";

describe("getProjectStatusDisplay", () => {
  it("returns correct display for all statuses", () => {
    expect(getProjectStatusDisplay("active")).toEqual({
      label: "Active",
      variant: "success",
    });
    expect(getProjectStatusDisplay("draft")).toEqual({
      label: "Draft",
      variant: "secondary",
    });
    expect(getProjectStatusDisplay("suspended")).toEqual({
      label: "Suspended",
      variant: "warning",
    });
    expect(getProjectStatusDisplay("completed")).toEqual({
      label: "Completed",
      variant: "default",
    });
    expect(getProjectStatusDisplay("archived")).toEqual({
      label: "Archived",
      variant: "secondary",
    });
  });
});

describe("getMilestoneStatusDisplay", () => {
  it("returns correct display for all statuses", () => {
    expect(getMilestoneStatusDisplay("pending").label).toBe("Pending");
    expect(getMilestoneStatusDisplay("in_progress").variant).toBe("warning");
    expect(getMilestoneStatusDisplay("completed").variant).toBe("success");
    expect(getMilestoneStatusDisplay("failed").variant).toBe("destructive");
  });
});

describe("getAttestationStatusDisplay", () => {
  it("returns correct display for all statuses", () => {
    expect(getAttestationStatusDisplay("submitted").label).toBe("Submitted");
    expect(getAttestationStatusDisplay("verified").variant).toBe("success");
    expect(getAttestationStatusDisplay("rejected").variant).toBe("destructive");
    expect(getAttestationStatusDisplay("revoked").variant).toBe("destructive");
  });
});

describe("getCertificateStatusDisplay", () => {
  it("returns correct display for all statuses", () => {
    expect(getCertificateStatusDisplay("issued").label).toBe("Issued");
    expect(getCertificateStatusDisplay("delivered_to_tgr").label).toBe(
      "Delivered to TGR",
    );
    expect(getCertificateStatusDisplay("acknowledged").variant).toBe("success");
    expect(getCertificateStatusDisplay("revoked").variant).toBe("destructive");
  });
});

describe("getDisputeStatusDisplay", () => {
  it("returns correct display for all statuses", () => {
    expect(getDisputeStatusDisplay("open").label).toBe("Open");
    expect(getDisputeStatusDisplay("under_review").variant).toBe("warning");
    expect(getDisputeStatusDisplay("resolved").variant).toBe("success");
    expect(getDisputeStatusDisplay("dismissed").variant).toBe("secondary");
  });
});

describe("getAuditorAssignmentStatusDisplay", () => {
  it("returns correct display for all statuses", () => {
    expect(getAuditorAssignmentStatusDisplay("assigned").label).toBe(
      "Assigned",
    );
    expect(getAuditorAssignmentStatusDisplay("accepted").variant).toBe(
      "success",
    );
    expect(getAuditorAssignmentStatusDisplay("completed").variant).toBe(
      "success",
    );
    expect(getAuditorAssignmentStatusDisplay("recused").variant).toBe(
      "warning",
    );
    expect(getAuditorAssignmentStatusDisplay("replaced").variant).toBe(
      "secondary",
    );
  });
});
