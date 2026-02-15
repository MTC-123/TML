"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Calendar } from "lucide-react";

interface CertificateCardProps {
  id: string;
  hash: string;
  status: "issued" | "revoked";
  issuedAt: string;
  milestoneTitle?: string;
}

function truncateHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

export function CertificateCard({
  id,
  hash,
  status,
  issuedAt,
  milestoneTitle,
}: CertificateCardProps) {
  const dateStr = new Date(issuedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={`certificates/${id}` as any} className="block group">
      <Card className="transition-all duration-200 hover:shadow-lg hover:border-accent/30 group-hover:-translate-y-0.5">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-mono">
                {truncateHash(hash)}
              </CardTitle>
            </div>
            <Badge
              variant={status === "issued" ? "default" : "destructive"}
              className={
                status === "issued"
                  ? "bg-accent hover:bg-accent/90 text-white"
                  : ""
              }
            >
              {status === "issued" ? "Issued" : "Revoked"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {milestoneTitle && (
            <p className="text-sm font-medium">{milestoneTitle}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{dateStr}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
