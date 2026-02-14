import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MilestoneTimeline } from "@/components/milestones/milestone-timeline";
import { mockMilestone } from "../../../mocks/data";

describe("MilestoneTimeline", () => {
  it("renders milestones in order", () => {
    const milestones = [
      mockMilestone({ sequenceNumber: 2, description: "Roof construction" }),
      mockMilestone({ sequenceNumber: 1, description: "Foundation pouring" }),
      mockMilestone({ sequenceNumber: 3, description: "Electrical wiring" }),
    ];

    render(<MilestoneTimeline milestones={milestones} projectId="p1" />);

    const items = screen.getAllByText(/Milestone \d/);
    expect(items[0]).toHaveTextContent("Milestone 1");
    expect(items[1]).toHaveTextContent("Milestone 2");
    expect(items[2]).toHaveTextContent("Milestone 3");
  });

  it("shows correct status indicators", () => {
    const milestones = [
      mockMilestone({
        sequenceNumber: 1,
        description: "Done",
        status: "completed",
      }),
      mockMilestone({
        sequenceNumber: 2,
        description: "Working",
        status: "in_progress",
      }),
      mockMilestone({
        sequenceNumber: 3,
        description: "Waiting",
        status: "pending",
      }),
      mockMilestone({
        sequenceNumber: 4,
        description: "Broken",
        status: "failed",
      }),
    ];

    render(<MilestoneTimeline milestones={milestones} projectId="p1" />);

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("shows empty message when no milestones", () => {
    render(<MilestoneTimeline milestones={[]} projectId="p1" />);
    expect(
      screen.getByText("No milestones have been created yet."),
    ).toBeInTheDocument();
  });

  it("renders description and deadline", () => {
    const milestones = [
      mockMilestone({
        sequenceNumber: 1,
        description: "Foundation pouring",
        deadline: "2026-06-30T00:00:00Z",
      }),
    ];

    render(<MilestoneTimeline milestones={milestones} projectId="p1" />);

    expect(screen.getByText("Foundation pouring")).toBeInTheDocument();
    expect(screen.getByText(/Deadline:/)).toBeInTheDocument();
  });
});
