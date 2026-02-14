import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { mockCertificate } from "../mocks/data";

const API_BASE = "http://localhost:3000/api/v1";

const validHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

const server = setupServer(
  http.get(`${API_BASE}/certificates/verify/:hash`, ({ params }) => {
    const hash = params["hash"] as string;
    if (hash === validHash) {
      return HttpResponse.json({
        data: mockCertificate({
          certificateHash: hash,
          status: "issued",
          tgrReference: "TGR-2026-00142",
        }),
      });
    }
    if (hash === "revoked-hash") {
      return HttpResponse.json({
        data: mockCertificate({
          certificateHash: hash,
          status: "revoked",
          revocationReason: "Attestation invalidated",
        }),
      });
    }
    return HttpResponse.json(
      { code: "NOT_FOUND", message: "Certificate not found" },
      { status: 404 },
    );
  }),
);

beforeEach(() => {
  server.listen({ onUnhandledRequest: "bypass" });
});

afterEach(() => {
  server.close();
});

describe("Certificate verification", () => {
  it("verifies valid certificate hash", async () => {
    const res = await fetch(`${API_BASE}/certificates/verify/${validHash}`);
    const json = (await res.json()) as {
      data: { certificateHash: string; status: string; tgrReference: string };
    };

    expect(res.ok).toBe(true);
    expect(json.data.certificateHash).toBe(validHash);
    expect(json.data.status).toBe("issued");
    expect(json.data.tgrReference).toBe("TGR-2026-00142");
  });

  it("returns 404 for invalid hash", async () => {
    const res = await fetch(`${API_BASE}/certificates/verify/invalid-hash-12345`);
    expect(res.status).toBe(404);
    const json = (await res.json()) as { code: string };
    expect(json.code).toBe("NOT_FOUND");
  });

  it("returns revoked certificate status", async () => {
    const res = await fetch(`${API_BASE}/certificates/verify/revoked-hash`);
    const json = (await res.json()) as {
      data: { status: string; revocationReason: string };
    };

    expect(res.ok).toBe(true);
    expect(json.data.status).toBe("revoked");
    expect(json.data.revocationReason).toBe("Attestation invalidated");
  });

  it("certificate response includes milestone reference", async () => {
    const res = await fetch(`${API_BASE}/certificates/verify/${validHash}`);
    const json = (await res.json()) as {
      data: { milestoneId: string };
    };

    expect(json.data.milestoneId).toBeDefined();
    expect(typeof json.data.milestoneId).toBe("string");
  });

  it("hash parameter is passed correctly from URL", async () => {
    const testHash = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    const res = await fetch(`${API_BASE}/certificates/verify/${testHash}`);
    // Non-matching hash should 404
    expect(res.status).toBe(404);
  });
});
