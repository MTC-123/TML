'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Shield,
  ShieldCheck,
  ShieldX,
  Hash,
  QrCode,
  CheckCircle,
  XCircle,
  Loader2,
  FileCheck,
  Building2,
  Calendar,
  Fingerprint,
  Copy,
  RefreshCw,
  AlertTriangle,
  Camera,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { QRScanner } from '@/components/shared/qr-scanner'
import { QRCodeDisplay } from '@/components/certificates/qr-code-display'
import { verifyCertificateByHash } from '@/lib/api/endpoints/certificates'
import type { ComplianceCertificateResponse } from '@tml/types'

const API_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3001'

type VerifyState = 'idle' | 'loading' | 'verified' | 'invalid' | 'not_found' | 'revoked'

interface VerifyResult {
  state: VerifyState
  certificate: ComplianceCertificateResponse | null
  errorMessage?: string
}

type VerifyMode = 'scan-qr' | 'enter-hash' | 'verify-credential'

const MODES: { id: VerifyMode; icon: typeof QrCode; titleKey: string; descKey: string }[] = [
  {
    id: 'scan-qr',
    icon: QrCode,
    titleKey: 'modes.scanQr.title',
    descKey: 'modes.scanQr.description',
  },
  {
    id: 'enter-hash',
    icon: Hash,
    titleKey: 'modes.enterHash.title',
    descKey: 'modes.enterHash.description',
  },
  {
    id: 'verify-credential',
    icon: Fingerprint,
    titleKey: 'modes.verifyCredential.title',
    descKey: 'modes.verifyCredential.description',
  },
]

export default function VerifyPage() {
  const t = useTranslations('verify')
  const searchParams = useSearchParams()
  const initialHash = searchParams.get('hash') ?? ''

  const [hashInput, setHashInput] = useState(initialHash)
  const [vpToken, setVpToken] = useState('')
  const [activeMode, setActiveMode] = useState<VerifyMode>(initialHash ? 'enter-hash' : 'scan-qr')
  const [result, setResult] = useState<VerifyResult>({
    state: initialHash ? 'loading' : 'idle',
    certificate: null,
  })
  const [copied, setCopied] = useState(false)

  // ---- Hash verification (uses existing API helper) ----
  const verifyByHash = useCallback(async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) {
      setResult({ state: 'idle', certificate: null })
      return
    }

    setResult({ state: 'loading', certificate: null })

    try {
      const res = await verifyCertificateByHash(trimmed)
      if (res.data.status === 'revoked') {
        setResult({ state: 'revoked', certificate: res.data })
      } else {
        setResult({ state: 'verified', certificate: res.data })
      }
    } catch {
      setResult({ state: 'not_found', certificate: null })
    }
  }, [])

  // ---- QR verification ----
  const verifyByQR = useCallback(async (qrData: string) => {
    setResult({ state: 'loading', certificate: null })

    try {
      const response = await fetch(`${API_URL}/api/v1/verify/qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: qrData }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string }
        throw new Error(body.message || `QR verification failed (${response.status})`)
      }

      const data = (await response.json()) as { data: ComplianceCertificateResponse }
      if (data.data.status === 'revoked') {
        setResult({ state: 'revoked', certificate: data.data })
      } else {
        setResult({ state: 'verified', certificate: data.data })
      }
    } catch (err) {
      setResult({
        state: 'not_found',
        certificate: null,
        errorMessage: err instanceof Error ? err.message : t('errors.qrFailed'),
      })
    }
  }, [t])

  // ---- OpenID4VP verification ----
  const verifyVP = useCallback(async () => {
    const trimmed = vpToken.trim()
    if (!trimmed) return

    setResult({ state: 'loading', certificate: null })

    try {
      const response = await fetch(`${API_URL}/api/v1/verify/openid4vp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vp_token: trimmed }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { message?: string }
        throw new Error(body.message || `VP verification failed (${response.status})`)
      }

      const data = (await response.json()) as { data: ComplianceCertificateResponse }
      setResult({ state: 'verified', certificate: data.data })
    } catch (err) {
      setResult({
        state: 'invalid',
        certificate: null,
        errorMessage: err instanceof Error ? err.message : t('errors.credentialFailed'),
      })
    }
  }, [vpToken, t])

  // Auto-verify if hash provided via URL search params
  useEffect(() => {
    if (initialHash) {
      verifyByHash(initialHash)
    }
  }, [initialHash, verifyByHash])

  const handleReset = useCallback(() => {
    setResult({ state: 'idle', certificate: null })
  }, [])

  const copyToClipboard = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#faf7f2]">
      {/* Background decorations */}
      <div className="zellige-pattern grain-overlay absolute inset-0" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-20 h-64 w-64 rounded-full bg-[#10b981]/[0.04] blur-3xl" />
        <div className="absolute right-1/4 top-40 h-48 w-48 rounded-full bg-[#d4a017]/[0.05] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-16 md:py-24">
        {/* ═══ Header Section ═══ */}
        <div className="animate-fade-up mb-14 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#0a1628] gold-ring">
            <Shield className="h-10 w-10 text-[#d4a017]" />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-[#0a1628] md:text-5xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#1e3a5f]/70 font-[family-name:var(--font-body)]">
            {t('subtitle')}
          </p>
          <div className="gold-line-animated mx-auto mt-6" />
        </div>

        {/* ═══ Mode Selector Cards ═══ */}
        <div className="animate-fade-up stagger-2 mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {MODES.map((mode) => {
            const Icon = mode.icon
            const isActive = activeMode === mode.id
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`card-hover group relative rounded-xl border-2 p-5 text-left transition-all duration-300 ${
                  isActive
                    ? 'border-l-4 border-l-[#10b981] border-t-transparent border-r-transparent border-b-transparent bg-white shadow-lg'
                    : 'border-[#1e3a5f]/10 bg-white/60 hover:bg-white hover:border-[#1e3a5f]/20'
                }`}
              >
                <div className={`mb-3 inline-flex rounded-lg p-2.5 ${
                  isActive ? 'bg-[#10b981]/10' : 'bg-[#1e3a5f]/5 group-hover:bg-[#1e3a5f]/10'
                }`}>
                  <Icon className={`h-5 w-5 ${
                    isActive ? 'text-[#10b981]' : 'text-[#1e3a5f]/60 group-hover:text-[#1e3a5f]'
                  }`} />
                </div>
                <h3 className={`text-sm font-semibold ${
                  isActive ? 'text-[#0a1628]' : 'text-[#1e3a5f]/80'
                }`}>
                  {t(mode.titleKey)}
                </h3>
                <p className="mt-1 text-xs text-[#1e3a5f]/50">
                  {t(mode.descKey)}
                </p>
                {isActive && (
                  <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#10b981]" />
                )}
              </button>
            )
          })}
        </div>

        {/* ═══ Content Panel ═══ */}
        <div className="animate-fade-up stagger-3">
          {/* Mode 1: QR Scanner */}
          {activeMode === 'scan-qr' && (
            <div className="overflow-hidden rounded-2xl border border-[#1e3a5f]/10 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-[#1e3a5f]/5 bg-[#0a1628]/[0.02] px-6 py-4">
                <div className="rounded-full bg-[#1e3a5f]/10 p-2">
                  <Camera className="h-4 w-4 text-[#1e3a5f]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0a1628]">{t('scanner.title')}</h3>
                  <p className="text-xs text-[#1e3a5f]/50">{t('scanner.description')}</p>
                </div>
              </div>
              <div className="p-6">
                <div className="corner-brackets mx-auto max-w-sm p-2">
                  <QRScanner
                    onScan={verifyByQR}
                    onError={(err) => {
                      setResult({ state: 'idle', certificate: null, errorMessage: err })
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Hash Input */}
          {activeMode === 'enter-hash' && (
            <div className="overflow-hidden rounded-2xl border border-[#1e3a5f]/10 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-[#1e3a5f]/5 bg-[#0a1628]/[0.02] px-6 py-4">
                <div className="rounded-full bg-[#1e3a5f]/10 p-2">
                  <Hash className="h-4 w-4 text-[#1e3a5f]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0a1628]">{t('hashMode.title')}</h3>
                  <p className="text-xs text-[#1e3a5f]/50">
                    {t('hashMode.description')}
                  </p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <label htmlFor="certificate-hash" className="sr-only">
                      Certificate hash
                    </label>
                    <Input
                      id="certificate-hash"
                      placeholder={t('placeholder')}
                      value={hashInput}
                      onChange={(e) => setHashInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') verifyByHash(hashInput)
                      }}
                      className="h-12 border-[#1e3a5f]/20 bg-[#faf7f2] font-mono text-sm tracking-wide placeholder:text-[#1e3a5f]/30 focus:border-[#d4a017] focus:ring-[#d4a017]/30"
                    />
                  </div>
                  <Button
                    onClick={() => verifyByHash(hashInput)}
                    disabled={!hashInput.trim() || result.state === 'loading'}
                    className="h-12 gap-2 bg-[#10b981] px-6 text-white hover:bg-[#0d9668] disabled:opacity-40"
                  >
                    {result.state === 'loading' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span className="hidden sm:inline">{t('search')}</span>
                      </>
                    )}
                  </Button>
                </div>
                <p className="mt-3 text-xs text-[#1e3a5f]/40">
                  {t('hashMode.helpText')}
                </p>
              </div>
            </div>
          )}

          {/* Mode 3: VP Token */}
          {activeMode === 'verify-credential' && (
            <div className="overflow-hidden rounded-2xl border border-[#1e3a5f]/10 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-[#1e3a5f]/5 bg-[#0a1628]/[0.02] px-6 py-4">
                <div className="rounded-full bg-[#1e3a5f]/10 p-2">
                  <Fingerprint className="h-4 w-4 text-[#1e3a5f]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#0a1628]">{t('vpMode.title')}</h3>
                  <p className="text-xs text-[#1e3a5f]/50">{t('vpMode.description')}</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <label htmlFor="vp-token" className="sr-only">
                  Verifiable Presentation token
                </label>
                <textarea
                  id="vp-token"
                  placeholder={t('vpMode.placeholder')}
                  value={vpToken}
                  onChange={(e) => setVpToken(e.target.value)}
                  rows={6}
                  className="w-full rounded-xl border border-[#1e3a5f]/15 bg-[#0a1628] p-4 font-mono text-sm text-[#faf7f2]/90 placeholder:text-[#faf7f2]/25 focus:border-[#d4a017] focus:outline-none focus:ring-2 focus:ring-[#d4a017]/20"
                />
                <Button
                  onClick={verifyVP}
                  disabled={!vpToken.trim() || result.state === 'loading'}
                  className="w-full h-12 gap-2 bg-[#10b981] text-white hover:bg-[#0d9668] disabled:opacity-40"
                >
                  {result.state === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('vpMode.verifying')}
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4" />
                      {t('vpMode.verifyButton')}
                    </>
                  )}
                </Button>
                <div className="rounded-xl border border-[#d4a017]/15 bg-[#d4a017]/[0.04] p-4">
                  <p className="text-xs text-[#1e3a5f]/60 leading-relaxed">
                    <strong className="text-[#1e3a5f]/80">{t('vpMode.howItWorksLabel')}</strong> {t('vpMode.howItWorksText')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ═══ Results Section ═══ */}
        <div className="mt-12" aria-live="polite">
          {/* Loading State */}
          {result.state === 'loading' && (
            <div role="status" className="animate-fade-up rounded-2xl border border-[#1e3a5f]/10 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1e3a5f]/5">
                <Shield className="h-8 w-8 animate-spin-slow text-[#1e3a5f]" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-[#1e3a5f]/60">{t('loading')}</p>
              <div className="mx-auto mt-6 max-w-md space-y-3">
                <div className="shimmer h-4 rounded-full" />
                <div className="shimmer h-4 w-3/4 rounded-full mx-auto" />
                <div className="shimmer h-4 w-1/2 rounded-full mx-auto" />
              </div>
            </div>
          )}

          {/* Not Found / Invalid */}
          {(result.state === 'not_found' || result.state === 'invalid') && !result.certificate && (
            <div role="alert" className="animate-fade-up rounded-2xl border border-[#1e3a5f]/10 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#1e3a5f]/5">
                <ShieldX className="h-8 w-8 text-[#1e3a5f]/40" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#0a1628]">
                {result.state === 'not_found' ? t('notFound.title') : t('invalid.title')}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-[#1e3a5f]/50">
                {result.errorMessage ||
                  (result.state === 'not_found'
                    ? t('notFound.description')
                    : t('invalid.description'))}
              </p>
              <div className="mx-auto mt-4 flex max-w-xs items-center gap-2 rounded-lg border border-[#d97706]/20 bg-[#d97706]/5 p-3">
                <AlertTriangle className="h-4 w-4 shrink-0 text-[#d97706]" />
                <p className="text-left text-xs text-[#d97706]/80">
                  {t('notFound.hint')}
                </p>
              </div>
            </div>
          )}

          {/* Revoked Certificate */}
          {result.state === 'revoked' && result.certificate && (
            <div className="animate-fade-up space-y-6">
              <div className="relative overflow-hidden rounded-2xl border-2 border-[#dc2626]/30 bg-white shadow-sm">
                {/* Red banner */}
                <div className="bg-[#dc2626] px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                      <XCircle className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="revoked-strike font-[family-name:var(--font-display)] text-xl font-bold text-white">
                          {t('certificate.revokedTitle')}
                        </h3>
                        <Badge className="border-white/30 bg-white/20 text-white hover:bg-white/30">
                          <XCircle className="mr-1 h-3 w-3" />
                          {t('certificate.revoked')}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-white/70">
                        {t('certificate.revokedDescription')}
                      </p>
                    </div>
                    <AlertTriangle className="hidden h-10 w-10 text-white/30 md:block" />
                  </div>
                </div>
              </div>
              <CertificateDetails certificate={result.certificate} onCopy={copyToClipboard} copied={copied} />
            </div>
          )}

          {/* Valid Certificate */}
          {result.state === 'verified' && result.certificate && (
            <div className="animate-fade-up space-y-6">
              <div className="relative overflow-hidden rounded-2xl border-2 border-[#10b981]/30 bg-white shadow-sm">
                {/* Emerald banner */}
                <div className="bg-[#10b981] px-6 py-5">
                  <div className="flex items-center gap-4">
                    <div className="pulse-glow flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
                      <ShieldCheck className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-white">
                          {t('certificate.validTitle')}
                        </h3>
                        <Badge className="border-white/30 bg-white/20 text-white hover:bg-white/30">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          {t('certificate.verified')}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-white/70">
                        {t('certificate.verifiedDescription')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <CertificateDetails certificate={result.certificate} onCopy={copyToClipboard} copied={copied} />
            </div>
          )}

          {/* Reset Button */}
          {(result.state === 'verified' ||
            result.state === 'revoked' ||
            result.state === 'not_found' ||
            result.state === 'invalid') && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={handleReset}
                className="gap-2 rounded-full border-[#1e3a5f]/20 px-6 text-[#1e3a5f] hover:bg-[#1e3a5f]/5 hover:border-[#1e3a5f]/30"
              >
                <RefreshCw className="h-4 w-4" />
                {t('verifyAnother')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Certificate details sub-component
// ---------------------------------------------------------------------------

function CertificateDetails({
  certificate,
  onCopy,
  copied,
}: {
  certificate: ComplianceCertificateResponse
  onCopy: (text: string) => void
  copied: boolean
}) {
  const t = useTranslations('verify')
  const [signatureExpanded, setSignatureExpanded] = useState(false)

  return (
    <div className="overflow-hidden rounded-2xl border border-[#1e3a5f]/10 bg-white shadow-sm">
      {/* Gold top border */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[#d4a017] to-transparent" />

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-[#10b981]/10 p-2">
            <FileCheck className="h-5 w-5 text-[#10b981]" />
          </div>
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-[#0a1628]">
            {t('details.title')}
          </h3>
        </div>

        {/* Two-column metadata grid */}
        <div className="grid gap-5 sm:grid-cols-2">
          <MetadataField
            label={t('details.certificateId')}
            value={certificate.id}
            mono
          />
          <MetadataField
            label={t('details.milestoneId')}
            value={certificate.milestoneId}
            mono
          />
          <MetadataField
            label={t('details.issued')}
            icon={<Calendar className="h-3.5 w-3.5" />}
            value={new Date(certificate.issuedAt).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          />
          <div>
            <div className="text-xs font-medium uppercase tracking-widest text-[#1e3a5f]/40">
              {t('details.status')}
            </div>
            <div className="mt-1.5">
              <Badge
                variant="outline"
                className={`${
                  certificate.status === 'revoked'
                    ? 'border-[#dc2626]/30 bg-[#dc2626]/5 text-[#dc2626]'
                    : 'border-[#10b981]/30 bg-[#10b981]/5 text-[#10b981]'
                }`}
              >
                {certificate.status}
              </Badge>
            </div>
          </div>
          {certificate.tgrReference && (
            <MetadataField
              label={t('details.tgrReference')}
              icon={<Building2 className="h-3.5 w-3.5" />}
              value={certificate.tgrReference}
              mono
            />
          )}
        </div>

        <Separator className="my-6 bg-[#1e3a5f]/5" />

        {/* Integrity Hash */}
        <div>
          <div className="mb-2 text-xs font-medium uppercase tracking-widest text-[#1e3a5f]/40">
            {t('details.integrityHash')}
          </div>
          <div className="group relative rounded-xl border border-[#1e3a5f]/10 bg-[#0a1628] p-4">
            <code className="block break-all font-mono text-xs leading-relaxed text-[#faf7f2]/80">
              {certificate.certificateHash}
            </code>
            <button
              onClick={() => onCopy(certificate.certificateHash)}
              className="absolute right-3 top-3 rounded-lg bg-white/10 p-1.5 text-[#faf7f2]/40 opacity-0 transition-opacity hover:bg-white/20 hover:text-[#faf7f2]/80 group-hover:opacity-100 focus:opacity-100"
              aria-label={copied ? "Hash copied" : "Copy hash to clipboard"}
              title={t('details.copyHash')}
            >
              {copied ? (
                <CheckCircle className="h-3.5 w-3.5 text-[#10b981]" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Digital Signature (expandable) */}
        {certificate.digitalSignature && (
          <>
            <Separator className="my-6 bg-[#1e3a5f]/5" />
            <div>
              <button
                onClick={() => setSignatureExpanded(!signatureExpanded)}
                aria-expanded={signatureExpanded}
                className="mb-2 flex w-full items-center justify-between text-xs font-medium uppercase tracking-widest text-[#1e3a5f]/40 hover:text-[#1e3a5f]/60"
              >
                <span>{t('details.digitalSignature')}</span>
                {signatureExpanded ? (
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
              {signatureExpanded && (
                <div className="animate-fade-up rounded-xl border border-[#1e3a5f]/10 bg-[#0a1628] p-4">
                  <code className="block break-all font-mono text-xs leading-relaxed text-[#faf7f2]/80">
                    {certificate.digitalSignature}
                  </code>
                </div>
              )}
            </div>
          </>
        )}

        <Separator className="my-6 bg-[#1e3a5f]/5" />

        {/* QR Code */}
        <div className="flex flex-col items-center">
          <div className="rounded-xl border border-[#1e3a5f]/10 bg-[#faf7f2] p-4">
            <QRCodeDisplay value={certificate.certificateHash} size={160} />
          </div>
        </div>

        {/* Verified timestamp */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#1e3a5f]/30">
          <Clock className="h-3 w-3" />
          <span>{t('details.verifiedOn', { date: new Date().toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }) })}</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Metadata field helper
// ---------------------------------------------------------------------------

function MetadataField({
  label,
  value,
  icon,
  mono = false,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  mono?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-[#1e3a5f]/40">
        {icon}
        {label}
      </div>
      <div className={`mt-1.5 text-sm text-[#0a1628] ${mono ? 'font-mono tracking-wide' : ''}`}>
        {value}
      </div>
    </div>
  )
}
