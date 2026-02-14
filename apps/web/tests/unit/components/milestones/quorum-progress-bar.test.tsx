import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { QuorumProgressBar } from "@/components/milestones/quorum-progress-bar";
import { mockQuorum } from "../../../mocks/data";

describe("QuorumProgressBar", () => {
  it("renders three segments (inspectors, auditors, citizens)", () => {
    const quorum = mockQuorum();
    render(<QuorumProgressBar quorum={quorum} />);

    expect(screen.getByText("Inspectors")).toBeInTheDocument();
    expect(screen.getByText("Auditors")).toBeInTheDocument();
    expect(screen.getByText("Citizens")).toBeInTheDocument();
  });

  it("shows correct current/required counts", () => {
    const quorum = mockQuorum({
      inspector: { required: 2, current: 1, met: false },
      auditor: { required: 1, current: 1, met: true },
      citizen: {
        required: 3,
        weightedScore: 2,
        met: false,
        breakdown: [],
      },
    });

    render(<QuorumProgressBar quorum={quorum} />);

    expect(screen.getByText("1/2")).toBeInTheDocument();
    expect(screen.getByText("1/1")).toBeInTheDocument();
    expect(screen.getByText("2/3")).toBeInTheDocument();
  });

  it("shows quorum met message when all requirements met", () => {
    const quorum = mockQuorum({
      inspector: { required: 2, current: 2, met: true },
      auditor: { required: 1, current: 1, met: true },
      citizen: {
        required: 3,
        weightedScore: 3,
        met: true,
        breakdown: [],
      },
      overallMet: true,
    });

    render(<QuorumProgressBar quorum={quorum} />);

    expect(screen.getByText("Quorum requirements met")).toBeInTheDocument();
  });

  it("shows quorum not met message when incomplete", () => {
    const quorum = mockQuorum({ overallMet: false });
    render(<QuorumProgressBar quorum={quorum} />);
    expect(screen.getByText("Quorum not yet met")).toBeInTheDocument();
  });
});
