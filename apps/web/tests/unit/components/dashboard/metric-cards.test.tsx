import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MetricCard } from "@/components/dashboard/metric-cards";
import { FolderKanban } from "lucide-react";

describe("MetricCard", () => {
  it("renders title, value, and trend", () => {
    render(
      <MetricCard
        title="Total Projects"
        value={42}
        icon={FolderKanban}
        trend="up"
        trendValue="+12%"
      />,
    );

    expect(screen.getByText("Total Projects")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("+12%")).toBeInTheDocument();
    expect(screen.getByText("vs last month")).toBeInTheDocument();
  });

  it("renders down trend", () => {
    render(
      <MetricCard
        title="Disputes"
        value={3}
        icon={FolderKanban}
        trend="down"
        trendValue="-5%"
      />,
    );

    expect(screen.getByText("-5%")).toBeInTheDocument();
  });

  it("renders neutral trend", () => {
    render(
      <MetricCard
        title="Auditors"
        value={18}
        icon={FolderKanban}
        trend="neutral"
        trendValue="0%"
      />,
    );

    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders string value", () => {
    render(
      <MetricCard
        title="Budget"
        value="5M MAD"
        icon={FolderKanban}
        trend="up"
        trendValue="+8%"
      />,
    );

    expect(screen.getByText("5M MAD")).toBeInTheDocument();
  });
});
