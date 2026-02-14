import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { mockProject } from "../mocks/data";

const API_BASE = "http://localhost:3000/api/v1";

const projects = [
  mockProject({ name: "Route Nationale N1 Extension", region: "Rabat-Sale-Kenitra", status: "active" }),
  mockProject({ name: "Ecole Primaire Hay Riad", region: "Casablanca-Settat", status: "completed" }),
  mockProject({ name: "Hospital Renovation", region: "Fes-Meknes", status: "draft" }),
];

const server = setupServer(
  http.get(`${API_BASE}/projects`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "20", 10);

    let filtered = [...projects];

    if (status) {
      filtered = filtered.filter((p) => p.status === status);
    }
    if (search) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return HttpResponse.json({
      data: filtered.slice((page - 1) * limit, page * limit),
      meta: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      },
    });
  }),

  http.get(`${API_BASE}/projects/:id`, ({ params }) => {
    const project = projects.find((p) => p.id === params["id"]);
    if (!project) {
      return HttpResponse.json(
        { code: "NOT_FOUND", message: "Project not found" },
        { status: 404 },
      );
    }
    return HttpResponse.json({ data: project });
  }),

  http.post(`${API_BASE}/projects`, async ({ request }) => {
    const body = (await request.json()) as { name: string; region: string };
    const newProject = mockProject({ name: body.name, region: body.region, status: "draft" });
    return HttpResponse.json({ data: newProject }, { status: 201 });
  }),
);

beforeEach(() => {
  server.listen({ onUnhandledRequest: "bypass" });
});

afterEach(() => {
  server.close();
});

describe("Project management API", () => {
  it("lists all projects", async () => {
    const res = await fetch(`${API_BASE}/projects`);
    const json = (await res.json()) as { data: unknown[]; meta: { total: number } };
    expect(json.data).toHaveLength(3);
    expect(json.meta.total).toBe(3);
  });

  it("filters projects by status", async () => {
    const res = await fetch(`${API_BASE}/projects?status=active`);
    const json = (await res.json()) as { data: Array<{ status: string }> };
    expect(json.data).toHaveLength(1);
    expect(json.data[0].status).toBe("active");
  });

  it("searches projects by name", async () => {
    const res = await fetch(`${API_BASE}/projects?search=hospital`);
    const json = (await res.json()) as { data: Array<{ name: string }> };
    expect(json.data).toHaveLength(1);
    expect(json.data[0].name).toBe("Hospital Renovation");
  });

  it("returns empty for no-match search", async () => {
    const res = await fetch(`${API_BASE}/projects?search=nonexistent`);
    const json = (await res.json()) as { data: unknown[] };
    expect(json.data).toHaveLength(0);
  });

  it("fetches single project by ID", async () => {
    const id = projects[0].id;
    const res = await fetch(`${API_BASE}/projects/${id}`);
    const json = (await res.json()) as { data: { id: string; name: string } };
    expect(json.data.id).toBe(id);
    expect(json.data.name).toBe("Route Nationale N1 Extension");
  });

  it("returns 404 for unknown project", async () => {
    const res = await fetch(`${API_BASE}/projects/unknown-id`);
    expect(res.status).toBe(404);
  });

  it("creates a new project", async () => {
    const res = await fetch(`${API_BASE}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Bridge", region: "Tanger-Tetouan" }),
    });
    const json = (await res.json()) as { data: { name: string; status: string } };
    expect(res.status).toBe(201);
    expect(json.data.name).toBe("New Bridge");
    expect(json.data.status).toBe("draft");
  });
});
