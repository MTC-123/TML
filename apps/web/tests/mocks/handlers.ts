import { http, HttpResponse } from "msw";
import {
  mockProject,
  mockCertificate,
  mockAttestation,
} from "./data";

const API_BASE = "http://localhost:3000/api/v1";

export const handlers = [
  // Projects
  http.get(`${API_BASE}/projects`, () => {
    return HttpResponse.json({
      data: [
        mockProject({ name: "Route Nationale N1 Extension" }),
        mockProject({ name: "Ecole Primaire Hay Riad", status: "completed" }),
      ],
      meta: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
  }),

  http.get(`${API_BASE}/projects/:id`, ({ params }) => {
    return HttpResponse.json({
      data: mockProject({ id: params["id"] as string }),
    });
  }),

  // Attestations
  http.post(`${API_BASE}/attestations`, async () => {
    return HttpResponse.json(
      { data: mockAttestation({ status: "submitted" }) },
      { status: 201 },
    );
  }),

  // Certificates
  http.get(`${API_BASE}/certificates/verify/:hash`, ({ params }) => {
    const hash = params["hash"] as string;
    if (hash.startsWith("valid")) {
      return HttpResponse.json({
        data: mockCertificate({ certificateHash: hash, status: "issued" }),
      });
    }
    return HttpResponse.json(
      { code: "NOT_FOUND", message: "Certificate not found", statusCode: 404 },
      { status: 404 },
    );
  }),

  // Auth
  http.get(`${API_BASE}/auth/login`, () => {
    return HttpResponse.json({
      data: { redirectUrl: "https://esignet.example.com/authorize?client_id=tml" },
    });
  }),

  http.post(`${API_BASE}/auth/refresh`, async ({ request }) => {
    const body = (await request.json()) as { refreshToken?: string };
    if (body.refreshToken === "valid-refresh-token") {
      return HttpResponse.json({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
      });
    }
    return HttpResponse.json(
      { code: "UNAUTHORIZED", message: "Invalid refresh token", statusCode: 401 },
      { status: 401 },
    );
  }),
];
