'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, FolderOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { CredentialCard } from '@/components/certificates/credential-card';
import { listCredentials } from '@/lib/api/endpoints/credentials';

export default function CredentialsPage() {
  const t = useTranslations();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['credentials'],
    queryFn: () => listCredentials(),
  });

  const credentials = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-[#1e3a5f]" />
        <div>
          <h1 className="text-2xl font-semibold text-[#1e3a5f]">
            Credential Wallet
          </h1>
          <p className="text-sm text-muted-foreground">
            Your W3C Verifiable Credentials bound to your decentralized
            identity. These credentials prove your roles and authorizations
            within the TML platform.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[180px] w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load credentials</p>
          <Button variant="outline" className="mt-2" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : credentials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No credentials issued yet. Credentials are automatically issued
              when you are assigned roles.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {credentials.map((credential) => (
            <CredentialCard key={credential.id} credential={credential} />
          ))}
        </div>
      )}
    </div>
  );
}
