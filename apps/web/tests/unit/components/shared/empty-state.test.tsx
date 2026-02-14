import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyState } from "@/components/shared/empty-state";
import { FolderOpen } from "lucide-react";

describe("EmptyState", () => {
  it("renders message and icon", () => {
    render(
      <EmptyState
        icon={FolderOpen}
        title="No projects"
        description="Create your first project to get started."
      />,
    );

    expect(screen.getByText("No projects")).toBeInTheDocument();
    expect(
      screen.getByText("Create your first project to get started."),
    ).toBeInTheDocument();
  });

  it("renders action button when provided", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();

    render(
      <EmptyState
        icon={FolderOpen}
        title="No projects"
        description="Empty"
        actionLabel="Create Project"
        onAction={onClick}
      />,
    );

    const button = screen.getByRole("button", { name: "Create Project" });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not render action button when no action provided", () => {
    render(
      <EmptyState
        icon={FolderOpen}
        title="Nothing here"
        description="Empty state"
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
