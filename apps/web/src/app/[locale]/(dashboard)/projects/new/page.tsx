"use client";

import { useMutation } from "@tanstack/react-query";
import { createProject } from "@/lib/api/endpoints/projects";
import { ProjectForm, type ProjectFormValues } from "@/components/projects/project-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link, useRouter } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";

export default function NewProjectPage() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (values: ProjectFormValues) =>
      createProject({
        name: values.name,
        region: values.region,
        budget: values.budget,
        donor: values.donor || undefined,
      }),
    onSuccess: (res) => {
      router.push(`/projects/${res.data.id}`);
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Create New Project</h1>
        <p className="text-sm text-muted-foreground">
          Register a new public infrastructure project for milestone tracking and accountability.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Fill in the basic information about the project. You can add milestones after creation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectForm
            onSubmit={(values) => mutation.mutate(values)}
            isSubmitting={mutation.isPending}
          />
          {mutation.isError && (
            <p className="mt-4 text-sm text-[#dc2626]">
              Failed to create project. Please try again.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
