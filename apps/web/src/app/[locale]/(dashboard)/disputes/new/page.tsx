"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

const mockMilestones = [
  { id: "ms-001", title: "Foundation Pour - School Complex Casablanca" },
  { id: "ms-002", title: "Electrical Wiring - Hospital Rabat" },
  { id: "ms-003", title: "Road Paving - N1 Highway Extension" },
  { id: "ms-004", title: "Roof Installation - Community Center Marrakech" },
];

export default function NewDisputePage() {
  const [milestoneId, setMilestoneId] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  const canSubmit = milestoneId && reason.trim().length > 0 && description.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild aria-label="Back to disputes">
          <Link href="../disputes">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">File a Dispute</h1>
          <p className="text-muted-foreground">
            Report an issue with a milestone completion
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Dispute Details</CardTitle>
          <CardDescription>
            Provide details about the issue you want to report. All disputes are
            reviewed by assigned auditors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="dispute-milestone" className="text-sm font-medium">Milestone</label>
            <Select value={milestoneId} onValueChange={setMilestoneId}>
              <SelectTrigger id="dispute-milestone" aria-label="Select milestone">
                <SelectValue placeholder="Select milestone..." />
              </SelectTrigger>
              <SelectContent>
                {mockMilestones.map((ms) => (
                  <SelectItem key={ms.id} value={ms.id}>
                    {ms.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="dispute-reason" className="text-sm font-medium">Reason</label>
            <Input
              id="dispute-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Brief summary of the issue"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="dispute-description" className="text-sm font-medium">Description</label>
            <Textarea
              id="dispute-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed description of the issue, including any evidence..."
              rows={6}
            />
          </div>

          <div className="flex gap-3">
            <Button
              className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90"
              disabled={!canSubmit}
            >
              Submit Dispute
            </Button>
            <Button variant="outline" asChild>
              <Link href="../disputes">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
