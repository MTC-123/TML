import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DisputeCard } from "@/components/disputes/dispute-card";

const defaultProps = {
  id: "disp-001",
  reason: "Concrete quality does not meet specifications",
  status: "open" as const,
  createdAt: "2026-02-10T09:00:00Z",
};

describe("DisputeCard", () => {
  it("renders dispute reason", () => {
    render(<DisputeCard {...defaultProps} />);
    expect(
      screen.getByText("Concrete quality does not meet specifications"),
    ).toBeInTheDocument();
  });

  it("shows status badge", () => {
    render(<DisputeCard {...defaultProps} />);
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("shows resolved badge", () => {
    render(<DisputeCard {...defaultProps} status="resolved" />);
    expect(screen.getByText("Resolved")).toBeInTheDocument();
  });

  it("shows milestone title when provided", () => {
    render(
      <DisputeCard {...defaultProps} milestoneTitle="Foundation Pour" />,
    );
    expect(screen.getByText("Foundation Pour")).toBeInTheDocument();
  });

  it("shows filed by when provided", () => {
    render(<DisputeCard {...defaultProps} filedBy="Inspector A" />);
    expect(screen.getByText("by Inspector A")).toBeInTheDocument();
  });

  it("links to dispute detail page", () => {
    render(<DisputeCard {...defaultProps} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "disputes/disp-001");
  });
});
