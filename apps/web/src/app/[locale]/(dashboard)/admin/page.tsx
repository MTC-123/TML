"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Settings,
  Users,
  Shield,
  Database,
  RefreshCcw,
  Key,
  Globe,
} from "lucide-react";

// ─── Dummy Admin Data ───────────────────────────────────────────

const actors = [
  {
    id: "a1",
    name: "Mohammed Alami",
    role: "inspector",
    did: "did:key:z6MkhaXg...2doK",
    org: "Ministère de l'Équipement",
    status: "active",
  },
  {
    id: "a2",
    name: "Fatima Zahra Benani",
    role: "auditor",
    did: "did:key:z6MkpTHR...9xYz",
    org: "Cour des Comptes",
    status: "active",
  },
  {
    id: "a3",
    name: "Youssef El Idrissi",
    role: "contractor_engineer",
    did: "did:key:z6MknGc2...Lm3Q",
    org: "SGTM Construction",
    status: "active",
  },
  {
    id: "a4",
    name: "Amina Tazi",
    role: "citizen",
    did: "did:key:z6MkfHZq...Bp7R",
    org: null,
    status: "active",
  },
  {
    id: "a5",
    name: "USSD Pool Citizen",
    role: "citizen",
    did: "did:key:z6MkUSSD...pool",
    org: null,
    status: "active",
  },
];

const systemConfig = [
  { label: "Quorum — Inspector Weight", value: "1.0" },
  { label: "Quorum — Auditor Weight", value: "1.0" },
  { label: "Quorum — Citizen Biometric Weight", value: "1.0" },
  { label: "Quorum — Citizen USSD Weight", value: "0.6" },
  { label: "Quorum — CSO Mediated Weight", value: "0.4" },
  { label: "Geofence Radius (meters)", value: "500" },
  { label: "Certificate Auto-Issue", value: "Enabled" },
  { label: "Dispute → Revocation", value: "Automatic" },
  { label: "Auditor Rotation", value: "Crypto-Random" },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform administration, actor management, and system configuration.
        </p>
      </div>

      {/* Actor Registry */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Actor Registry
            </CardTitle>
            <Button size="sm" className="bg-accent hover:bg-accent/90 gap-2">
              <Key className="h-3.5 w-3.5" />
              Register Actor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-3 font-medium">Name</th>
                  <th className="py-3 font-medium">Role</th>
                  <th className="py-3 font-medium">DID</th>
                  <th className="py-3 font-medium">Organization</th>
                  <th className="py-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {actors.map((actor) => (
                  <tr key={actor.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{actor.name}</td>
                    <td className="py-3">
                      <Badge variant="outline" className="capitalize">
                        {actor.role.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3 font-mono text-xs text-muted-foreground">
                      {actor.did}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {actor.org ?? "—"}
                    </td>
                    <td className="py-3 text-center">
                      <Badge className="bg-accent text-white hover:bg-accent/90">
                        {actor.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              System Configuration
            </CardTitle>
            <Badge variant="secondary" className="gap-1">
              <Shield className="h-3 w-3" />
              Read Only (Demo)
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {systemConfig.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <span className="text-sm">{item.label}</span>
                <span className="font-mono text-sm font-medium">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Database className="h-5 w-5 text-accent" />
            <div>
              <p className="font-medium">PostgreSQL 16</p>
              <p className="text-xs text-muted-foreground">Connected — 12ms latency</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <RefreshCcw className="h-5 w-5 text-accent" />
            <div>
              <p className="font-medium">Redis 7</p>
              <p className="text-xs text-muted-foreground">Connected — Rate limiter active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Globe className="h-5 w-5 text-accent" />
            <div>
              <p className="font-medium">Fastify 5 API</p>
              <p className="text-xs text-muted-foreground">Healthy — 15 routes loaded</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
