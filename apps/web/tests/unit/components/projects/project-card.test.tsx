import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectCard } from "@/components/projects/project-card";
import { mockProject } from "../../../mocks/data";

describe("ProjectCard", () => {
  it("renders project name, region, and status", () => {
    const project = mockProject({
      name: "Route Nationale N1",
      region: "Rabat-Sale-Kenitra",
      status: "active",
    });

    render(<ProjectCard project={project} />);

    expect(screen.getByText("Route Nationale N1")).toBeInTheDocument();
    expect(screen.getByText("Rabat-Sale-Kenitra")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("navigates to project detail on click", () => {
    const project = mockProject({ id: "proj-123" });
    render(<ProjectCard project={project} />);

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/projects/proj-123");
  });

  it("shows correct status badge for different statuses", () => {
    const project = mockProject({ status: "completed" });
    render(<ProjectCard project={project} />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("shows milestone progress when provided", () => {
    const project = mockProject();
    render(
      <ProjectCard
        project={project}
        milestoneCount={5}
        completedMilestones={3}
      />,
    );

    expect(screen.getByText("Milestones")).toBeInTheDocument();
    expect(screen.getByText("3/5")).toBeInTheDocument();
  });

  it("shows donor when present", () => {
    const project = mockProject({ donor: "World Bank" });
    render(<ProjectCard project={project} />);
    expect(screen.getByText("Donor: World Bank")).toBeInTheDocument();
  });
});
