'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ShieldCheck,
  Briefcase,
  UserCheck,
  Award,
  Key,
  Calendar,
  Hash,
  ExternalLink,
} from 'lucide-react';

interface Credential {
  id: string;
  credentialType: string;
  status: string;
  holderDid: string;
  issuedAt: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
}

interface CredentialCardProps {
  credential: Credential;
}

const CREDENTIAL_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bgLight: string; icon: typeof ShieldCheck }
> = {
  ProfessionalEngineerCredential: {
    label: 'Professional Engineer',
    color: '#1e3a5f',
    bgLight: 'rgba(30, 58, 95, 0.08)',
    icon: Briefcase,
  },
  AuditorAccreditationCredential: {
    label: 'Auditor Accreditation',
    color: '#d4a017',
    bgLight: 'rgba(212, 160, 23, 0.08)',
    icon: Award,
  },
  CNIEIdentityCredential: {
    label: 'CNIE Identity',
    color: '#10b981',
    bgLight: 'rgba(16, 185, 129, 0.08)',
    icon: ShieldCheck,
  },
  DelegatedAuthorityCredential: {
    label: 'Delegated Authority',
    color: '#7c3aed',
    bgLight: 'rgba(124, 58, 237, 0.08)',
    icon: Key,
  },
};

const DEFAULT_CONFIG = {
  label: 'Credential',
  color: '#1e3a5f',
  bgLight: 'rgba(30, 58, 95, 0.08)',
  icon: ShieldCheck,
};

function getConfig(credentialType: string): typeof DEFAULT_CONFIG {
  return CREDENTIAL_TYPE_CONFIG[credentialType] ?? DEFAULT_CONFIG;
}

function truncateDid(did: string): string {
  if (did.length <= 24) return did;
  return `${did.slice(0, 16)}...${did.slice(-8)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function truncateHash(id: string): string {
  if (id.length <= 20) return id;
  return `${id.slice(0, 8)}...${id.slice(-8)}`;
}

function StatusBadge({ status }: { status: string }): React.ReactElement {
  if (status === 'active') {
    return (
      <Badge className="border-0 bg-[#10b981]/10 text-[#10b981] pulse-glow">
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#10b981] animate-pulse" />
        Active
      </Badge>
    );
  }
  if (status === 'revoked') {
    return (
      <Badge variant="destructive" className="revoked-strike">
        Revoked
      </Badge>
    );
  }
  if (status === 'expired') {
    return (
      <Badge className="border-0 bg-gray-100 text-gray-500">
        Expired
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      {status}
    </Badge>
  );
}

export function CredentialCard({ credential }: CredentialCardProps): React.ReactElement {
  const config = getConfig(credential.credentialType);
  const IconComponent = config.icon;

  return (
    <Card
      className="card-hover group relative overflow-hidden border-0 bg-white shadow-sm hover:shadow-xl transition-shadow duration-300"
      style={{
        borderLeft: `4px solid ${config.color}`,
      }}
    >
      {/* Subtle zellige watermark in top-right */}
      <div
        className="absolute top-0 right-0 h-24 w-24 opacity-[0.03] pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${config.color} 0%, transparent 70%)`,
        }}
      />

      {/* Top Section */}
      <div className="flex items-start justify-between p-5 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
            style={{
              backgroundColor: config.bgLight,
              color: config.color,
            }}
          >
            <IconComponent className="h-5 w-5" />
          </div>
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.15em]"
              style={{ color: config.color }}
            >
              {config.label}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground font-[family-name:var(--font-body)]">
              W3C Verifiable Credential
            </p>
          </div>
        </div>
        <StatusBadge status={credential.status} />
      </div>

      {/* Divider */}
      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Middle Section */}
      <div className="space-y-2.5 px-5 py-4 font-[family-name:var(--font-body)]">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <UserCheck className="h-3.5 w-3.5" />
            Holder
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help font-mono text-xs text-foreground/80 hover:text-foreground transition-colors">
                  {truncateDid(credential.holderDid)}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="font-mono text-xs break-all">{credential.holderDid}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Issued
          </span>
          <span className="text-xs font-medium text-foreground/80">
            {formatDate(credential.issuedAt)}
          </span>
        </div>

        {credential.expiresAt && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Expires
            </span>
            <span className="text-xs font-medium text-foreground/80">
              {formatDate(credential.expiresAt)}
            </span>
          </div>
        )}

        {credential.revokedAt && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Revoked
            </span>
            <span className="text-xs font-medium text-[#dc2626]">
              {formatDate(credential.revokedAt)}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="flex items-center justify-between border-t border-dashed border-border/60 bg-[#faf7f2]/50 px-5 py-3">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Hash className="h-3 w-3" />
          <span className="font-mono text-[10px] tracking-wider opacity-60">
            {truncateHash(credential.id)}
          </span>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 text-[11px] font-medium transition-colors hover:text-[#1e3a5f]"
          style={{ color: config.color }}
        >
          View Details
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </Card>
  );
}
