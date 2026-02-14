import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CertificateCard } from "@/components/certificates/certificate-card";

const defaultProps = {
  id: "cert-001",
  hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  status: "issued" as const,
  issuedAt: "2026-02-12T16:00:00Z",
};

describe("CertificateCard", () => {
  it("renders truncated hash", () => {
    render(<CertificateCard {...defaultProps} />);
    expect(screen.getByText("e3b0c442...7852b855")).toBeInTheDocument();
  });

  it("shows status badge", () => {
    render(<CertificateCard {...defaultProps} />);
    expect(screen.getByText("Issued")).toBeInTheDocument();
  });

  it("shows revoked badge when revoked", () => {
    render(<CertificateCard {...defaultProps} status="revoked" />);
    expect(screen.getByText("Revoked")).toBeInTheDocument();
  });

  it("shows milestone title when provided", () => {
    render(
      <CertificateCard {...defaultProps} milestoneTitle="Foundation Pour" />,
    );
    expect(screen.getByText("Foundation Pour")).toBeInTheDocument();
  });

  it("links to certificate detail page", () => {
    render(<CertificateCard {...defaultProps} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "certificates/cert-001");
  });

  it("shows formatted issue date", () => {
    render(<CertificateCard {...defaultProps} />);
    expect(screen.getByText(/Feb 12, 2026/)).toBeInTheDocument();
  });
});
