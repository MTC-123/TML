"use client";

import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMilestone, transitionMilestoneStatus } from "@/lib/api/endpoints/milestones";
import { getQuorumStatus, listMilestoneAttestations } from "@/lib/api/endpoints/attestations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { QuorumProgressBar } from "@/components/milestones/quorum-progress-bar";
import { getMilestoneStatusDisplay, getAttestationStatusDisplay } from "@/lib/formatters/status";
import { formatDate, formatRelativeTime } from "@/lib/formatters/date";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";
import {
  ArrowLeft,
  Calendar,
  Hash,
  Loader2,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import type { MilestoneStatus } from "@tml/types";

interface MilestoneDetailPageProps {
  params: Promise<{ id: string; milestoneId: string }>;
}

const statusTransitions: Record<MilestoneStatus, { label: string; next: MilestoneStatus } | null> = {
  pending: { label: "Start Progress", next: "in_progress" },
  in_progress: { label: "Begin Attestation", next: "attestation_in_progress" },
  attestation_in_progress: { label: "Mark Completed", next: "completed" },
  completed: null,
  failed: null,
};

export default function MilestoneDetailPage({ params }: MilestoneDetailPageProps) {
  const { id: projectId, milestoneId } = use(params);
  const queryClient = useQueryClient();

  const { data: milestoneRes, isLoading: milestoneLoading } = useQuery({
    queryKey: ["milestone", milestoneId],
    queryFn: () => getMilestone(milestoneId),
  });

  const { data: quorumRes, isLoading: quorumLoading } = useQuery({
    queryKey: ["quorum", milestoneId],
    queryFn: () => getQuorumStatus(milestoneId),
  });

  const { data: attestationsRes, isLoading: attestationsLoading } = useQuery({
    queryKey: ["milestone-attestations", milestoneId],
    queryFn: () => listMilestoneAttestations(milestoneId),
  });

  const transitionMutation = useMutation({
    mutationFn: (status: MilestoneStatus) =>
      transitionMilestoneStatus(milestoneId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["milestone", milestoneId] });
      queryClient.invalidateQueries({ queryKey: ["milestones", projectId] });
    },
  });

  const milestone = milestoneRes?.data;
  const quorum = quorumRes?.data;
  const attestations = attestationsRes?.data ?? [];

  if (milestoneLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!milestone) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Milestone not found.</p>
        <Link href={`/projects/${projectId}`}>
          <Button variant="link">Back to Project</Button>
        </Link>
      </div>
    );
  }

  const status = getMilestoneStatusDisplay(milestone.status);
  const isOverdue = new Date(milestone.deadline) < new Date() && milestone.status !== "completed";
  const transition = statusTransitions[milestone.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Project
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Hash className="h-4 w-4" />
                Milestone {milestone.sequenceNumber}
              </span>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">{milestone.description}</h1>
          </div>
          {transition && (
            <Button
              onClick={() => transitionMutation.mutate(transition.next)}
              disabled={transitionMutation.isPending}
              className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90"
            >
              {transitionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {transition.label}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: details and attestations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Deadline</dt>
                  <dd className={cn("mt-1 flex items-center gap-2", isOverdue && "text-[#dc2626]")}>
                    <Calendar className="h-4 w-4" />
                    {formatDate(milestone.deadline)}
                    {isOverdue && (
                      <Badge variant="destructive" className="text-xs">
                        Overdue
                      </Badge>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                  <dd className="mt-1">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Required Inspectors</dt>
                  <dd className="mt-1">{milestone.requiredInspectorCount}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Required Auditors</dt>
                  <dd className="mt-1">{milestone.requiredAuditorCount}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Required Citizens</dt>
                  <dd className="mt-1">{milestone.requiredCitizenCount}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                  <dd className="mt-1">{formatDate(milestone.createdAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Attestations list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attestations</CardTitle>
            </CardHeader>
            <CardContent>
              {attestationsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : attestations.length === 0 ? (
                <div className="flex flex-col items-center py-8">
                  <ShieldCheck className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No attestations have been submitted yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attestations.map((attestation) => {
                    const attStatus = getAttestationStatusDisplay(attestation.status);
                    const typeLabel = attestation.type
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase());

                    return (
                      <div
                        key={attestation.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <UserCheck className="h-4 w-4 text-[#1e3a5f]" />
                          <div>
                            <p className="text-sm font-medium">{typeLabel}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(attestation.submittedAt)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={attStatus.variant}>{attStatus.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: quorum */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quorum Status</CardTitle>
            </CardHeader>
            <CardContent>
              {quorumLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : quorum ? (
                <QuorumProgressBar quorum={quorum} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Quorum data is not available yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
