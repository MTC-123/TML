"use client";

import { use, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CertificateViewer } from "@/components/certificates/certificate-viewer";
import { getCertificate, downloadCertificatePdf } from "@/lib/api/endpoints/certificates";
import Link from "next/link";

export default function CertificateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["certificates", id],
    queryFn: () => getCertificate(id),
  });

  const certificate = data?.data;

  const handleDownloadPdf = useCallback(async () => {
    setIsDownloading(true);
    try {
      const blob = await downloadCertificatePdf(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `TML-Certificate-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      console.error("Failed to download certificate PDF");
    } finally {
      setIsDownloading(false);
    }
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="../certificates">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Certificate Details</h1>
            <p className="text-sm text-muted-foreground font-mono">{id}</p>
          </div>
        </div>

        {certificate && (
          <Button
            onClick={handleDownloadPdf}
            disabled={isDownloading}
            className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90"
          >
            {isDownloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isDownloading ? "Generating..." : "Download PDF"}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load certificate</p>
          <Button variant="outline" className="mt-2" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : certificate ? (
        <CertificateViewer
          id={certificate.id}
          hash={certificate.certificateHash}
          signature={certificate.digitalSignature}
          status={certificate.status}
          issuedAt={certificate.issuedAt instanceof Date ? certificate.issuedAt.toISOString() : String(certificate.issuedAt)}
          tgrReference={certificate.tgrReference ?? undefined}
          milestoneId={certificate.milestoneId}

        />
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Certificate not found</p>
        </div>
      )}
    </div>
  );
}
