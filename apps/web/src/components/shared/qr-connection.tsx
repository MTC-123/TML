'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Copy, Clock, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface ConnectionInvitation {
  id: string
  recipientDid: string
  label: string
  serviceEndpoint: string
  expiresAt: string
}

interface QrConnectionProps {
  invitation: ConnectionInvitation
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export function QrConnection({ invitation }: QrConnectionProps): React.ReactElement {
  const [copied, setCopied] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const diff = Math.floor(
      (new Date(invitation.expiresAt).getTime() - Date.now()) / 1000,
    )
    return Math.max(0, diff)
  })

  const isExpired = secondsRemaining <= 0

  useEffect(() => {
    if (isExpired) return

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isExpired])

  const invitationJson = JSON.stringify(
    {
      '@type': 'https://didcomm.org/connections/1.0/invitation',
      '@id': invitation.id,
      recipientKeys: [invitation.recipientDid],
      label: invitation.label,
      serviceEndpoint: invitation.serviceEndpoint,
    },
    null,
    2,
  )

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(invitationJson)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: silently fail if clipboard access is denied
    }
  }, [invitationJson])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span>Connection Invitation</span>
          {isExpired ? (
            <Badge variant="destructive">Expired</Badge>
          ) : (
            <Badge variant="warning" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatCountdown(secondsRemaining)}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-[#1e3a5f]/5 p-3">
          <pre className="overflow-x-auto text-xs leading-relaxed text-[#1e3a5f]">
            <code>{invitationJson}</code>
          </pre>
        </div>
        <Button
          onClick={handleCopy}
          disabled={isExpired}
          variant={copied ? 'secondary' : 'default'}
          className="w-full"
        >
          {copied ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Invitation
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
