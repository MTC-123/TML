"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, ThumbsUp, ThumbsDown, HelpCircle, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getCitizenStats } from "@/lib/api/endpoints/dashboard";
import { listProjects } from "@/lib/api/endpoints/projects";

type VoteType = "yes" | "no" | "unsure";

export default function CitizenPage() {
  const [votes, setVotes] = useState<Record<string, VoteType>>({});

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["citizen", "stats"],
    queryFn: () => getCitizenStats(),
  });

  const { data: projectsData, isLoading: projectsLoading, error: projectsError, refetch } = useQuery({
    queryKey: ["citizen", "nearby-projects"],
    queryFn: () => listProjects({ status: "active", limit: 5 }),
  });

  const stats = statsData?.data;
  const projects = projectsData?.data ?? [];

  function handleVote(projectId: string, vote: VoteType) {
    setVotes((prev) => ({ ...prev, [projectId]: vote }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Review nearby projects and share your feedback
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        {statsLoading ? (
          <>
            <Skeleton className="h-[80px] rounded-lg" />
            <Skeleton className="h-[80px] rounded-lg" />
          </>
        ) : (
          <>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-[#2d8a4e]">
                  {stats?.attestationsGiven ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Attestations Given</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-[#1e3a5f]">
                  {stats?.nearbyProjects ?? projects.length}
                </p>
                <p className="text-xs text-muted-foreground">Nearby Projects</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Separator />

      {/* Nearby projects */}
      <div>
        <h2 className="text-base font-semibold mb-3">Nearby Projects</h2>
        {projectsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[150px] w-full rounded-lg" />
            ))}
          </div>
        ) : projectsError ? (
          <div className="text-center py-8">
            <p className="text-sm text-destructive">Failed to load projects</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No nearby projects found
          </p>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const voted = votes[project.id];
              return (
                <Card key={project.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <Badge variant="outline" className="text-xs shrink-0">
                        <MapPin className="h-3 w-3 mr-1" />
                        {project.region}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{project.region}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="text-sm font-medium capitalize">{project.status}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Does this work look complete and satisfactory?
                      </p>
                      {voted ? (
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              voted === "yes"
                                ? "success"
                                : voted === "no"
                                  ? "destructive"
                                  : "warning"
                            }
                          >
                            {voted === "yes"
                              ? "Approved"
                              : voted === "no"
                                ? "Rejected"
                                : "Unsure"}
                          </Badge>
                          <button
                            onClick={() => {
                              const newVotes = { ...votes };
                              delete newVotes[project.id];
                              setVotes(newVotes);
                            }}
                            className="text-xs text-muted-foreground underline"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-[#2d8a4e] hover:bg-[#2d8a4e]/90"
                            onClick={() => handleVote(project.id, "yes")}
                          >
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Yes
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleVote(project.id, "no")}
                          >
                            <ThumbsDown className="h-4 w-4 mr-1" />
                            No
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleVote(project.id, "unsure")}
                          >
                            <HelpCircle className="h-4 w-4 mr-1" />
                            Unsure
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
