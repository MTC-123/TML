'use client';

import {
  Wrench,
  ShieldCheck,
  IdCard,
  UserCheck,
  FileCheck,
  Calendar,
  Hash,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CredentialCardProps {
  credential: {
    id: string;
    credentialType: string;
    credentialHash: string;
    status: string;
    issuedAt: string;
    expiresAt: string | null;
    revokedAt: string | null;
    credentialJson?: Record<string, unknown>;
  };
}

const CREDENTIAL_TYPE_MAP: Record<
  string,
  { icon: typeof Wrench; label: string }
> = {
  ProfessionalEngineerCredential: {
    icon: Wrench,
    label: 'Professional Engineer',
  },
  AuditorAccreditationCredential: {
    icon: ShieldCheck,
    label: 'Auditor Accreditation',
  },
  CNIEIdentityCredential: {
    icon: IdCard,
    label: 'CNIE Identity',
  },
  DelegatedAuthorityCredential: {
    icon: UserCheck,
    label: 'Delegated Authority',
  },
};

function getCredentialTypeDisplay(credentialType: string): {
  icon: typeof Wrench;
  label: string;
} {
  return (
    CREDENTIAL_TYPE_MAP[credentialType] ?? {
      icon: FileCheck,
      label: credentialType,
    }
  );
}

function getStatusBadge(
  status: string,
): { label: string; variant: 'success' | 'destructive' | 'secondary' } {
  switch (status.toLowerCase()) {
    case 'active':
      return { label: 'Active', variant: 'success' };
    case 'revoked':
      return { label: 'Revoked', variant: 'destructive' };
    case 'expired':
      return { label: 'Expired', variant: 'secondary' };
    default:
      return { label: status, variant: 'secondary' };
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function truncateHash(hash: string): string {
  if (hash.length <= 19) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

export function CredentialCard({ credential }: CredentialCardProps) {
  const typeDisplay = getCredentialTypeDisplay(credential.credentialType);
  const Icon = typeDisplay.icon;
  const statusBadge = getStatusBadge(credential.status);
  const isRevoked = credential.status.toLowerCase() === 'revoked';
  const isActive = credential.status.toLowerCase() === 'active';

  const borderClass = isRevoked
    ? 'border-l-4 border-l-red-500'
    : isActive
      ? 'border-l-4 border-l-[#2d8a4e]'
      : '';

  return (
    <Card className={borderClass}>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-[#1e3a5f]" />
          <CardTitle
            className={`text-base font-semibold ${isRevoked ? 'line-through text-muted-foreground' : ''}`}
          >
            {typeDisplay.label}
          </CardTitle>
        </div>
        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Hash className="h-3.5 w-3.5" />
          <span className="font-mono">
            {truncateHash(credential.credentialHash)}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3.5 w-3.5" />
          <span>Issued {formatDate(credential.issuedAt)}</span>
        </div>
        {credential.expiresAt && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span>Expires {formatDate(credential.expiresAt)}</span>
          </div>
        )}
        {credential.revokedAt && (
          <div className="flex items-center gap-1.5 text-xs text-red-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>Revoked {formatDate(credential.revokedAt)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
