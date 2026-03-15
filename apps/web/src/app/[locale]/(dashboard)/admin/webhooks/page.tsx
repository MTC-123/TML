"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Webhook, Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AuthGuard } from "@/components/auth/auth-guard";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { formatDateShort } from "@/lib/formatters/date";
import {
  listWebhooks,
  deleteWebhook,
  updateWebhook,
} from "@/lib/api/endpoints/webhooks";

const eventTypeOptions = [
  "certificate.issued",
  "certificate.delivered",
  "certificate.revoked",
  "attestation.submitted",
  "attestation.verified",
  "dispute.filed",
  "dispute.resolved",
  "milestone.completed",
];

export default function AdminWebhooksPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "webhooks"],
    queryFn: () => listWebhooks(),
  });

  const webhooks = data?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWebhook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "webhooks"] });
      setDeleteId(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateWebhook(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "webhooks"] });
    },
  });

  function handleDelete() {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  }

  function toggleActive(id: string, currentActive: boolean) {
    toggleMutation.mutate({ id, active: !currentActive });
  }

  return (
    <AuthGuard requiredRoles={["admin"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Webhooks</h1>
            <p className="text-muted-foreground">
              Configure webhook subscriptions for system events
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">
                <Plus className="mr-2 h-4 w-4" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
                <DialogDescription>
                  Add a new webhook subscription to receive event notifications.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="webhook-url" className="text-sm font-medium">Endpoint URL</label>
                  <Input
                    id="webhook-url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Event Types</label>
                  <div className="flex flex-wrap gap-2">
                    {eventTypeOptions.map((evt) => (
                      <Badge
                        key={evt}
                        variant="outline"
                        className="cursor-pointer hover:bg-[#1e3a5f]/10"
                      >
                        {evt}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click to select event types
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90"
                  onClick={() => setCreateOpen(false)}
                  disabled={!newUrl}
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load webhooks</p>
            <Button variant="outline" className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : webhooks.length === 0 ? (
          <EmptyState
            icon={Webhook}
            title="No webhooks configured"
            description="Add a webhook to start receiving event notifications."
            actionLabel="Add Webhook"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((wh) => (
                  <TableRow key={wh.id}>
                    <TableCell className="font-mono text-xs max-w-[300px] truncate">
                      {wh.url}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {wh.eventTypes.map((evt) => (
                          <Badge key={evt} variant="secondary" className="text-xs">
                            {evt}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={wh.active}
                        onCheckedChange={() => toggleActive(wh.id, wh.active)}
                      />
                    </TableCell>
                    <TableCell>{formatDateShort(wh.createdAt)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(wh.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <ConfirmationDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title="Delete Webhook"
          description="Are you sure you want to delete this webhook? This action cannot be undone."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={handleDelete}
        />
      </div>
    </AuthGuard>
  );
}
