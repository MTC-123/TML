'use client'

import React, { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link2, Plus } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { QrConnection } from '@/components/shared/qr-connection'
import {
  listConnections,
  createConnectionInvitation,
  type AgentConnection,
  type ConnectionInvitation,
} from '@/lib/api/endpoints/connections'

type ConnectionState = 'invited' | 'connected' | 'active'

function getStateBadge(state: ConnectionState): React.ReactElement {
  switch (state) {
    case 'invited':
      return <Badge variant="warning">Invited</Badge>
    case 'connected':
      return <Badge variant="default">Connected</Badge>
    case 'active':
      return <Badge variant="success">Active</Badge>
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function truncateDid(did: string): string {
  if (did.length <= 30) return did
  return `${did.slice(0, 20)}...${did.slice(-8)}`
}

export default function ConnectionsPage(): React.ReactElement {
  const queryClient = useQueryClient()
  const [invitation, setInvitation] = useState<ConnectionInvitation | null>(null)

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['connections'],
    queryFn: () => listConnections(),
  })

  const connections = data?.data ?? []

  const createInvitationMutation = useMutation({
    mutationFn: () => createConnectionInvitation(),
    onSuccess: (res) => {
      setInvitation(res.data)
      queryClient.invalidateQueries({ queryKey: ['connections'] })
    },
  })

  const handleCreateInvitation = useCallback(() => {
    createInvitationMutation.mutate()
  }, [createInvitationMutation])

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="flex items-center gap-3">
        <Link2 className="h-7 w-7 text-[#1e3a5f]" />
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          Agent Connections
        </h1>
      </div>

      {/* Create Invitation Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1e3a5f]">
            Create Invitation
          </h2>
          <Button
            onClick={handleCreateInvitation}
            disabled={createInvitationMutation.isPending}
          >
            <Plus className="h-4 w-4" />
            New Invitation
          </Button>
        </div>

        {invitation && (
          <div className="flex justify-center">
            <QrConnection invitation={invitation} />
          </div>
        )}
      </section>

      {/* Connections List Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#1e3a5f]">
          Your Connections
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-[100px] rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-sm text-destructive">Failed to load connections</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : connections.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No connections yet. Create an invitation to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {connections.map((connection) => (
              <Card key={connection.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>{connection.label}</span>
                    {getStateBadge(connection.state as ConnectionState)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p className="font-mono text-xs text-muted-foreground">
                    {truncateDid(connection.did)}
                  </p>
                  <p className="text-muted-foreground">
                    Created {formatDate(connection.createdAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
