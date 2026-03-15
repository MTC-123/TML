import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants";
import type { ActorRole } from "@tml/types";

interface RoleBadgeProps {
  role: ActorRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  return <Badge variant="secondary">{ROLE_LABELS[role]}</Badge>;
}
