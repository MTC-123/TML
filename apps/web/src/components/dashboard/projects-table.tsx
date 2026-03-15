"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { listProjects } from "@/lib/api/endpoints/projects";
import { formatDateShort } from "@/lib/formatters/date";

const statusStyles: Record<string, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-[#2d8a4e]/10 text-[#2d8a4e] border-[#2d8a4e]/20",
  },
  suspended: {
    label: "Suspended",
    className: "bg-[#d97706]/10 text-[#d97706] border-[#d97706]/20",
  },
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
  },
  completed: {
    label: "Completed",
    className: "bg-[#2d8a4e]/10 text-[#2d8a4e] border-[#2d8a4e]/20",
  },
  archived: {
    label: "Archived",
    className: "bg-muted text-muted-foreground",
  },
};

export function ProjectsTable() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dashboard", "projects-table"],
    queryFn: () => listProjects({ limit: 5 }),
  });

  const projects = data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Projects Requiring Attention</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-destructive">Failed to load projects</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No projects found
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => {
                const style = statusStyles[project.status] ?? statusStyles['draft'];
                return (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.region}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("font-medium", style?.className)}
                      >
                        {style?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {"---"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
