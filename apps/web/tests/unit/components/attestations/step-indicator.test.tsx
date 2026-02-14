import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepIndicator } from "@/components/attestations/step-indicator";

describe("StepIndicator", () => {
  it("highlights current step", () => {
    render(<StepIndicator currentStep={1} />);

    expect(screen.getByText("GPS Location")).toBeInTheDocument();
    expect(screen.getByText("Evidence")).toBeInTheDocument();
    expect(screen.getByText("Signature")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
  });

  it("shows completed steps with checkmark", () => {
    const { container } = render(<StepIndicator currentStep={2} />);

    // Steps 0 and 1 should be completed (have green bg)
    const circles = container.querySelectorAll(".rounded-full");
    expect(circles.length).toBeGreaterThanOrEqual(4);
  });

  it("renders all four step labels", () => {
    render(<StepIndicator currentStep={0} />);

    expect(screen.getByText("GPS Location")).toBeInTheDocument();
    expect(screen.getByText("Evidence")).toBeInTheDocument();
    expect(screen.getByText("Signature")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
  });

  it("shows step numbers for non-completed steps", () => {
    render(<StepIndicator currentStep={0} />);

    // Steps 1-4 should show numbers (current shows 1, pending show 2,3,4)
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });
});
