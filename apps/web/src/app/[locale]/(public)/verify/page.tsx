"use client";

import { useState } from "react";
import { CertificateViewer } from "@/components/certificates/certificate-viewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { API_URL } from "@/lib/config";

// Dummy certificate database (fallback when API is unavailable)
const DEMO_CERTIFICATES: Record<
  string,
  {
    id: string;
    hash: string;
    signature: string;
    status: "issued" | "revoked";
    issuedAt: string;
    milestoneId: string;
    milestoneTitle: string;
    projectTitle: string;
    tgrReference?: string;
    issuerDid?: string;
  }
> = {
  e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855: {
    id: "cert-001",
    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    signature:
      "f4a8e21b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d",
    status: "issued",
    issuedAt: "2025-12-22T16:00:00Z",
    milestoneId: "ms-001",
    milestoneTitle: "Land acquisition and environmental impact assessment",
    projectTitle: "Route Nationale N8 — Tronçon Rabat-Kénitra",
    tgrReference: "TGR-2025-00142",
    issuerDid: "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  },
  a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2: {
    id: "cert-002",
    hash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    signature:
      "01234567890abcdef01234567890abcdef01234567890abcdef01234567890abcdef01234567890abcdef01234567890abcdef01234567890abcdef0123456789",
    status: "revoked",
    issuedAt: "2026-01-15T10:00:00Z",
    milestoneId: "ms-002",
    milestoneTitle: "Foundation pouring and road base preparation",
    projectTitle: "Route Nationale N8 — Tronçon Rabat-Kénitra",
    issuerDid: "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  },
};

export default function VerifyPage() {
  const [hashInput, setHashInput] = useState("");
  const [result, setResult] = useState<
    | { type: "found"; cert: (typeof DEMO_CERTIFICATES)[string]; isLive: boolean }
    | { type: "not_found" }
    | null
  >(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify() {
    if (!hashInput.trim()) return;
    setLoading(true);
    setResult(null);

    const hash = hashInput.trim().toLowerCase();

    try {
      // Try real API first (public endpoint, no auth required)
      const res = await fetch(
        `${API_URL()}/api/v1/certificates/verify/${hash}`,
        { signal: AbortSignal.timeout(3000) },
      );

      if (res.ok) {
        const data = await res.json();
        setResult({
          type: "found",
          cert: {
            id: data.id,
            hash: data.hash,
            signature: data.metadata?.signature ?? "—",
            status: data.status === "revoked" ? "revoked" : "issued",
            issuedAt: data.issuedAt,
            milestoneId: data.milestoneId,
            milestoneTitle: data.milestone?.title ?? "Milestone",
            projectTitle: data.milestone?.project?.name ?? "Project",
            tgrReference: data.metadata?.tgrReference,
            issuerDid: data.metadata?.issuerDid,
          },
          isLive: true,
        });
        setLoading(false);
        return;
      }

      if (res.status === 404) {
        // API is up but cert not found — check demo fallback too
        const demoCert = DEMO_CERTIFICATES[hash];
        if (demoCert) {
          setResult({ type: "found", cert: demoCert, isLive: false });
        } else {
          setResult({ type: "not_found" });
        }
        setLoading(false);
        return;
      }
    } catch {
      // API unavailable — fall through to demo lookup
    }

    // Demo fallback
    const demoCert = DEMO_CERTIFICATES[hash];
    if (demoCert) {
      setResult({ type: "found", cert: demoCert, isLive: false });
    } else {
      setResult({ type: "not_found" });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="container mx-auto px-4 pt-12 pb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="h-10 w-10 text-accent" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Certificate Verification
          </h1>
        </div>
        <p className="mx-auto max-w-lg text-muted-foreground">
          Verify the authenticity of a Payment Clearance Certificate by entering its
          SHA-256 hash. This is a public, trustless verification endpoint.
        </p>
      </div>

      {/* Search Box */}
      <div className="container mx-auto max-w-2xl px-4">
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Enter certificate SHA-256 hash..."
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                className="font-mono text-sm"
              />
              <Button
                onClick={handleVerify}
                disabled={loading || !hashInput.trim()}
                className="bg-accent hover:bg-accent/90 gap-2 min-w-[120px]"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Verify
                  </>
                )}
              </Button>
            </div>

            {/* Demo hint */}
            <div className="mt-4 rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                <strong>Demo:</strong> Try one of these hashes:
              </p>
              <div className="mt-2 space-y-1">
                {Object.keys(DEMO_CERTIFICATES).map((h) => (
                  <button
                    key={h}
                    onClick={() => setHashInput(h)}
                    className="block w-full truncate text-left font-mono text-xs text-accent hover:underline"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Result */}
      <div className="container mx-auto max-w-2xl px-4 py-8">
        {result?.type === "found" && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              {result.cert.status === "issued" ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-accent" />
                  <span className="text-lg font-semibold text-accent">
                    Certificate Verified
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                  <span className="text-lg font-semibold text-destructive">
                    Certificate Revoked
                  </span>
                </>
              )}
              {result.isLive ? (
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-accent border-accent/20 bg-accent/5 ml-2">
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-amber-600 border-amber-200 bg-amber-50 ml-2">
                  Demo
                </Badge>
              )}
            </div>
            <CertificateViewer {...result.cert} />
          </div>
        )}

        {result?.type === "not_found" && (
          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center gap-3 py-8">
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-lg font-semibold">Certificate Not Found</p>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                No certificate matching this hash exists in the TML registry.
                Please verify you have the correct SHA-256 hash.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
