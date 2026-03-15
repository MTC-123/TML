"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProject, getProjectDashboard } from "@/lib/api/endpoints/projects";
import { listMilestones } from "@/lib/api/endpoints/milestones";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MilestoneTimeline } from "@/components/milestones/milestone-timeline";
import { getProjectStatusDisplay } from "@/lib/formatters/status";
import { formatMAD } from "@/lib/formatters/currency";
import { formatDate } from "@/lib/formatters/date";
import { Link } from "@/i18n/navigation";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  FileCheck,
  ListChecks,
  MapPin,
  ShieldCheck,
} from "lucide-react";

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = use(params);

  const { data: projectRes, isLoading: projectLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => getProject(id),
  });

  const { data: dashboardRes } = useQuery({
    queryKey: ["project-dashboard", id],
    queryFn: () => getProjectDashboard(id),
  });

  const { data: milestonesRes, isLoading: milestonesLoading } = useQuery({
    queryKey: ["milestones", id],
    queryFn: () => listMilestones(id),
  });

  const project = projectRes?.data;
  const dashboard = dashboardRes?.data;
  const milestones = milestonesRes?.data ?? [];

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-muted-foreground">Project not found.</p>
        <Link href="/projects">
          <Button variant="link">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const status = getProjectStatusDisplay(project.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-[#1e3a5f]">{project.name}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {project.region}
              </span>
              <span className="flex items-center gap-1">
                <Banknote className="h-3.5 w-3.5" />
                {formatMAD(project.budget)}
              </span>
              {project.donor && <span>Donor: {project.donor}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Milestones</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.completedMilestones ?? 0}/{dashboard?.milestoneCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attestations</CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.pendingAttestations ?? 0}</div>
            <p className="text-xs text-muted-foreground">pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Certificates</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.certificatesIssued ?? 0}</div>
            <p className="text-xs text-muted-foreground">issued</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Budget</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMAD(project.budget)}</div>
            <p className="text-xs text-muted-foreground">total allocation</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="attestations">Attestations</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                  <dd className="mt-1">{project.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Region</dt>
                  <dd className="mt-1">{project.region}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Budget</dt>
                  <dd className="mt-1">{formatMAD(project.budget)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Donor</dt>
                  <dd className="mt-1">{project.donor ?? "None"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                  <dd className="mt-1">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                  <dd className="mt-1">{formatDate(project.createdAt)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Recent milestones preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              {milestonesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <MilestoneTimeline
                  milestones={milestones.slice(0, 5)}
                  projectId={id}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              {milestonesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <MilestoneTimeline milestones={milestones} projectId={id} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attestations">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Attestations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShieldCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-sm">
                  Attestation details will appear here once milestones are being reviewed.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Clearance Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileCheck className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-sm">
                  Certificates will appear here once quorum requirements are met.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Disputes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-sm">
                  No disputes have been raised for this project.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
