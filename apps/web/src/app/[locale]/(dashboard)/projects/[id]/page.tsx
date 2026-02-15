"use client";

import { use } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MilestoneTimeline } from "@/components/milestones/milestone-timeline";
import { QuorumProgressBar } from "@/components/milestones/quorum-progress-bar";
import { CertificateCard } from "@/components/certificates/certificate-card";
import { DisputeCard } from "@/components/disputes/dispute-card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Building2,
  Calendar,
  Users,
  ArrowLeft,
  FileCheck,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

// ─── Dummy Data ─────────────────────────────────────────────────

const project = {
  id: "proj-001",
  name: "Route Nationale N8 — Tronçon Rabat-Kénitra",
  region: "Rabat-Salé-Kénitra",
  budget: "15,000,000 MAD",
  donor: "World Bank",
  status: "active",
  createdAt: "2025-09-15",
  description:
    "Major highway extension project connecting Rabat to Kénitra, including road widening, bridge construction, and safety barriers installation. Funded by the World Bank under the Morocco Infrastructure Modernization Program.",
};

const milestones = [
  {
    id: "ms-001",
    projectId: "proj-001",
    sequenceNumber: 1,
    description: "Land acquisition and environmental impact assessment",
    deadline: "2025-12-31T00:00:00Z",
    status: "completed",
    requiredInspectorCount: 2,
    requiredAuditorCount: 1,
    requiredCitizenCount: 3,
    createdAt: "2025-09-15T10:00:00Z",
    updatedAt: "2025-12-20T10:00:00Z",
    deletedAt: null,
  },
  {
    id: "ms-002",
    projectId: "proj-001",
    sequenceNumber: 2,
    description: "Foundation pouring and road base preparation",
    deadline: "2026-03-31T00:00:00Z",
    status: "completed",
    requiredInspectorCount: 2,
    requiredAuditorCount: 1,
    requiredCitizenCount: 3,
    createdAt: "2025-09-15T10:00:00Z",
    updatedAt: "2026-03-15T10:00:00Z",
    deletedAt: null,
  },
  {
    id: "ms-003",
    projectId: "proj-001",
    sequenceNumber: 3,
    description: "Asphalt laying and lane marking",
    deadline: "2026-06-30T00:00:00Z",
    status: "in_progress",
    requiredInspectorCount: 2,
    requiredAuditorCount: 1,
    requiredCitizenCount: 3,
    createdAt: "2025-09-15T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
    deletedAt: null,
  },
  {
    id: "ms-004",
    projectId: "proj-001",
    sequenceNumber: 4,
    description: "Bridge construction over Oued Sebou",
    deadline: "2026-09-30T00:00:00Z",
    status: "pending",
    requiredInspectorCount: 3,
    requiredAuditorCount: 2,
    requiredCitizenCount: 5,
    createdAt: "2025-09-15T10:00:00Z",
    updatedAt: "2025-09-15T10:00:00Z",
    deletedAt: null,
  },
  {
    id: "ms-005",
    projectId: "proj-001",
    sequenceNumber: 5,
    description: "Safety barriers and signage installation",
    deadline: "2026-11-30T00:00:00Z",
    status: "pending",
    requiredInspectorCount: 2,
    requiredAuditorCount: 1,
    requiredCitizenCount: 3,
    createdAt: "2025-09-15T10:00:00Z",
    updatedAt: "2025-09-15T10:00:00Z",
    deletedAt: null,
  },
];

const quorum = {
  milestoneId: "ms-003",
  inspector: { required: 2, current: 2, met: true },
  auditor: { required: 1, current: 1, met: true },
  citizen: {
    required: 3,
    weightedScore: 2.2,
    met: false,
    breakdown: [
      { channel: "biometric", count: 1, weight: 1.0, score: 1.0 },
      { channel: "ussd", count: 2, weight: 0.6, score: 1.2 },
    ],
  },
  overallMet: false,
};

const certificates = [
  {
    id: "cert-001",
    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    status: "issued" as const,
    issuedAt: "2025-12-22T16:00:00Z",
    milestoneTitle: "Land acquisition and EIA",
  },
  {
    id: "cert-002",
    hash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2",
    status: "issued" as const,
    issuedAt: "2026-03-18T10:00:00Z",
    milestoneTitle: "Foundation pouring",
  },
];

const disputes = [
  {
    id: "disp-001",
    reason:
      "Concrete quality does not meet Grade C35 specification — core samples show compressive strength below threshold",
    status: "open" as const,
    createdAt: "2026-02-10T09:00:00Z",
    milestoneTitle: "Asphalt laying and lane marking",
    filedBy: "Inspector Alami",
  },
];

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={"/projects" as any}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Projects
      </Link>

      {/* Project Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-primary">
              {project.name}
            </h1>
            <Badge className="bg-accent text-accent-foreground hover:bg-accent/90">
              Active
            </Badge>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {project.description}
          </p>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <MapPin className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Region</p>
              <p className="font-medium">{project.region}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Building2 className="h-5 w-5 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="font-medium">{project.budget}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Users className="h-5 w-5 text-warning" />
            <div>
              <p className="text-xs text-muted-foreground">Donor</p>
              <p className="font-medium">{project.donor}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Started</p>
              <p className="font-medium">{project.createdAt}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="milestones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="milestones">
            Milestones ({milestones.length})
          </TabsTrigger>
          <TabsTrigger value="quorum">
            Quorum Status
          </TabsTrigger>
          <TabsTrigger value="certificates">
            <FileCheck className="mr-1.5 h-3.5 w-3.5" />
            Certificates ({certificates.length})
          </TabsTrigger>
          <TabsTrigger value="disputes">
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
            Disputes ({disputes.length})
          </TabsTrigger>
        </TabsList>

        {/* Milestones Tab */}
        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <CardTitle>Milestone Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <MilestoneTimeline
                milestones={milestones as any}
                projectId={project.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quorum Tab */}
        <TabsContent value="quorum">
          <Card>
            <CardHeader>
              <CardTitle>
                Quorum Status — Milestone 3: Asphalt laying and lane marking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <QuorumProgressBar quorum={quorum as any} />

              <Separator className="my-6" />

              <div className="space-y-4">
                <h3 className="text-sm font-semibold">
                  Citizen Attestation Breakdown
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold text-primary">1</p>
                      <p className="text-xs text-muted-foreground">
                        Biometric (×1.0)
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold text-warning">2</p>
                      <p className="text-xs text-muted-foreground">
                        USSD (×0.6)
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold text-primary">0</p>
                      <p className="text-xs text-muted-foreground">
                        CSO Mediated (×0.4)
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-sm text-muted-foreground">
                  Weighted Score: <strong>2.2 / 3.0</strong> — Need 0.8 more weighted points to meet citizen quorum.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates">
          <div className="grid gap-4 sm:grid-cols-2">
            {certificates.map((cert) => (
              <CertificateCard key={cert.id} {...cert} />
            ))}
          </div>
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes">
          <div className="grid gap-4 sm:grid-cols-2">
            {disputes.map((d) => (
              <DisputeCard key={d.id} {...d} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
