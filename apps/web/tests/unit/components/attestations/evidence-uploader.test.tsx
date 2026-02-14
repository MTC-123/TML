import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { EvidenceUploader } from "@/components/attestations/evidence-uploader";
import { useAttestationStore } from "@/store/attestation-store";

describe("EvidenceUploader", () => {
  beforeEach(() => {
    useAttestationStore.getState().reset();
  });

  it("renders dropzone with instructions", () => {
    render(<EvidenceUploader />);

    expect(
      screen.getByText("Drag and drop images, or click to browse"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("PNG, JPG, JPEG or WEBP up to 10MB each"),
    ).toBeInTheDocument();
  });

  it("shows previews when files are in store", () => {
    const file1 = new File(["photo1"], "photo1.jpg", { type: "image/jpeg" });
    const file2 = new File(["photo2"], "photo2.jpg", { type: "image/jpeg" });
    useAttestationStore.getState().setEvidenceFiles([file1, file2]);

    render(<EvidenceUploader />);

    expect(screen.getByText("photo1.jpg")).toBeInTheDocument();
    expect(screen.getByText("photo2.jpg")).toBeInTheDocument();
  });

  it("shows no previews when store is empty", () => {
    render(<EvidenceUploader />);

    expect(screen.queryByAltText(/photo/)).not.toBeInTheDocument();
  });
});
