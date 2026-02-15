"use client";

import { useState } from "react";
import { ProjectCard } from "@/components/projects/project-card";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderKanban, Plus, Loader2 } from "lucide-react";
import { useProjects, type Project } from "@/hooks/use-api";

// ─── Fallback Dummy Projects ─────────────────────────────────────

const dummyProjects: Project[] = [
  {
    id: "proj-001",
    name: "Route Nationale N8 — Tronçon Rabat-Kénitra",
    region: "Rabat-Salé-Kénitra",
    budget: "15000000.00",
    donor: "World Bank",
    status: "active",
    boundary: null,
    createdAt: "2025-09-15T10:00:00Z",
    updatedAt: "2026-01-20T10:00:00Z",
    deletedAt: null,
    _milestoneCount: 8,
    _completedMilestones: 5,
  },
  {
    id: "proj-002",
    name: "Stade Mohammed V — Rénovation Structurelle",
    region: "Casablanca-Settat",
    budget: "22000000.00",
    donor: "FMDV",
    status: "active",
    boundary: null,
    createdAt: "2025-10-01T10:00:00Z",
    updatedAt: "2026-01-18T10:00:00Z",
    deletedAt: null,
    _milestoneCount: 12,
    _completedMilestones: 7,
  },
  {
    id: "proj-003",
    name: "Barrage Al Massira — Extension Phase 2",
    region: "Béni Mellal-Khénifra",
    budget: "45000000.00",
    donor: "AfDB",
    status: "active",
    boundary: null,
    createdAt: "2025-11-10T10:00:00Z",
    updatedAt: "2026-02-01T10:00:00Z",
    deletedAt: null,
    _milestoneCount: 6,
    _completedMilestones: 2,
  },
  {
    id: "proj-004",
    name: "Centre Hospitalier Universitaire — Kénitra",
    region: "Rabat-Salé-Kénitra",
    budget: "8500000.00",
    donor: null,
    status: "planning",
    boundary: null,
    createdAt: "2026-01-05T10:00:00Z",
    updatedAt: "2026-01-05T10:00:00Z",
    deletedAt: null,
    _milestoneCount: 0,
    _completedMilestones: 0,
  },
  {
    id: "proj-005",
    name: "Autoroute Tanger-Tétouan — Voie Express",
    region: "Tanger-Tétouan-Al Hoceïma",
    budget: "32000000.00",
    donor: "EU Infrastructure Fund",
    status: "completed",
    boundary: null,
    createdAt: "2024-06-01T10:00:00Z",
    updatedAt: "2025-12-15T10:00:00Z",
    deletedAt: null,
    _milestoneCount: 10,
    _completedMilestones: 10,
  },
  {
    id: "proj-006",
    name: "Tramway Casablanca — Ligne T4",
    region: "Casablanca-Settat",
    budget: "28000000.00",
    donor: "EBRD",
    status: "active",
    boundary: null,
    createdAt: "2025-08-20T10:00:00Z",
    updatedAt: "2026-01-25T10:00:00Z",
    deletedAt: null,
    _milestoneCount: 15,
    _completedMilestones: 9,
  },
];

const statusFilters = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "planning", label: "Planning" },
  { key: "completed", label: "Completed" },
  { key: "suspended", label: "Suspended" },
];

export default function ProjectsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Attempt to fetch from API; falls back to dummy data when null
  const { data: apiData, isLoading } = useProjects({ status: statusFilter });

  const projects: Project[] = apiData?.data ?? dummyProjects;
  const isLive = apiData !== null && apiData !== undefined;

  const filtered = projects.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.region.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-primary">Projects</h1>
            {!isLive && (
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-amber-600 border-amber-200 bg-amber-50">
                Demo Data
              </Badge>
            )}
            {isLive && (
              <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider text-accent border-accent/20 bg-accent/5">
                Live
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and monitor public infrastructure projects across Morocco.
          </p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          onChange={setSearch}
          placeholder="Search projects by name or region..."
          className="sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((sf) => (
            <Badge
              key={sf.key}
              variant={statusFilter === sf.key ? "default" : "outline"}
              className={`cursor-pointer transition-colors ${
                statusFilter === sf.key
                  ? "bg-primary hover:bg-primary/90 text-white"
                  : "hover:bg-muted"
              }`}
              onClick={() => setStatusFilter(sf.key)}
            >
              {sf.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {/* Grid */}
      {!isLoading && filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects found"
          description="Try adjusting your search or filter criteria."
        />
      ) : !isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project as any}
              milestoneCount={project._milestoneCount ?? 0}
              completedMilestones={project._completedMilestones ?? 0}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
