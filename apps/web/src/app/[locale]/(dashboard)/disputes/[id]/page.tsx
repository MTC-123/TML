"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DisputeTimeline } from "@/components/disputes/dispute-timeline";
import { getDisputeStatusDisplay } from "@/lib/formatters/status";
import { formatDate } from "@/lib/formatters/date";
import { getDispute } from "@/lib/api/endpoints/disputes";
import Link from "next/link";

export default function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [resolution, setResolution] = useState("");
  const [outcome, setOutcome] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["disputes", id],
    queryFn: () => getDispute(id),
  });

  const dispute = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">Failed to load dispute</p>
        <Button variant="outline" className="mt-2" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!dispute) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Dispute not found</p>
      </div>
    );
  }

  const statusDisplay = getDisputeStatusDisplay(dispute.status);

  // Build timeline from dispute data
  const timeline = [
    {
      id: "evt-1",
      title: "Dispute Filed",
      description: `Dispute submitted`,
      timestamp: String(dispute.raisedAt),
      status: "completed" as const,
    },
    ...(dispute.status === "under_review" || dispute.status === "resolved" || dispute.status === "dismissed"
      ? [
          {
            id: "evt-2",
            title: "Under Review",
            description: "Assigned to review committee",
            timestamp: String(dispute.updatedAt ?? ""),
            status: (dispute.status === "under_review" ? "active" : "completed") as "active" | "completed",
          },
        ]
      : []),
    ...(dispute.status === "resolved" || dispute.status === "dismissed"
      ? [
          {
            id: "evt-3",
            title: dispute.status === "resolved" ? "Resolved" : "Dismissed",
            description: dispute.resolutionNotes ?? "Resolution decision made",
            timestamp: String(dispute.resolvedAt ?? ""),
            status: "completed" as const,
          },
        ]
      : [
          {
            id: "evt-3",
            title: "Resolution",
            description: "Pending resolution decision",
            timestamp: "",
            status: "pending" as const,
          },
        ]),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="../disputes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Dispute Details</h1>
            <Badge variant={statusDisplay.variant}>{statusDisplay.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{dispute.reason}</CardTitle>
              <CardDescription>
                Milestone: {dispute.milestoneId}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{dispute.reason}</p>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Filed By</p>
                  <p className="font-medium font-mono text-xs">
                    {dispute.raisedById?.slice(0, 24) ?? "---"}...
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Filed On</p>
                  <p className="font-medium">{formatDate(dispute.raisedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Resolution Form */}
          {dispute.status !== "resolved" && dispute.status !== "dismissed" && (
            <Card>
              <CardHeader>
                <CardTitle>Resolve Dispute</CardTitle>
                <CardDescription>
                  Provide a resolution decision and notes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Outcome</label>
                  <Select value={outcome} onValueChange={setOutcome}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select outcome..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resolved">Resolved - Uphold Dispute</SelectItem>
                      <SelectItem value="dismissed">Dismissed - Reject Dispute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Resolution Notes</label>
                  <Textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Describe the resolution decision..."
                    rows={4}
                  />
                </div>
                <Button
                  className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90"
                  disabled={!outcome || !resolution}
                >
                  Submit Resolution
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Timeline sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <DisputeTimeline events={timeline} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
