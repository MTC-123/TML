import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CertificateViewer } from "@/components/certificates/certificate-viewer";

const defaultProps = {
  id: "cert-001",
  hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  signature: "abcdef" + "01".repeat(58),
  status: "issued" as const,
  issuedAt: "2026-02-12T16:00:00Z",
  milestoneId: "ms-001",
  milestoneTitle: "Foundation Pour",
  projectTitle: "Route N1",
};

describe("CertificateViewer", () => {
  it("shows issued state", () => {
    render(<CertificateViewer {...defaultProps} />);

    expect(
      screen.getByText("Payment Clearance Certificate"),
    ).toBeInTheDocument();
    expect(screen.getByText("Issued")).toBeInTheDocument();
    expect(screen.getByText(/e3b0c4/)).toBeInTheDocument();
  });

  it("shows revoked state", () => {
    render(<CertificateViewer {...defaultProps} status="revoked" />);
    expect(screen.getByText("Revoked")).toBeInTheDocument();
  });

  it("displays attestation chain hash and signature", () => {
    render(<CertificateViewer {...defaultProps} />);

    expect(screen.getByText("Certificate Hash (SHA-256)")).toBeInTheDocument();
    expect(screen.getByText("Ed25519 Signature")).toBeInTheDocument();
  });

  it("shows TGR reference when provided", () => {
    render(
      <CertificateViewer {...defaultProps} tgrReference="TGR-2026-00142" />,
    );
    expect(screen.getByText("TGR Reference")).toBeInTheDocument();
    expect(screen.getByText("TGR-2026-00142")).toBeInTheDocument();
  });

  it("shows issuer DID when provided", () => {
    render(
      <CertificateViewer
        {...defaultProps}
        issuerDid="did:key:z6MkhaXgBZDv..."
      />,
    );
    expect(screen.getByText("Issuer DID")).toBeInTheDocument();
    expect(screen.getByText("did:key:z6MkhaXgBZDv...")).toBeInTheDocument();
  });

  it("shows project and milestone info", () => {
    render(<CertificateViewer {...defaultProps} />);
    expect(screen.getByText(/Route N1/)).toBeInTheDocument();
    expect(screen.getByText(/Foundation Pour/)).toBeInTheDocument();
  });

  it("shows QR code placeholder", () => {
    render(<CertificateViewer {...defaultProps} />);
    expect(screen.getByText("QR Code")).toBeInTheDocument();
  });
});
