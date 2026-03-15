'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Camera, CameraOff, Type, StopCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface QRScannerProps {
  onScan: (data: string) => void
  onError?: (error: string) => void
}

type ScannerMode = 'idle' | 'camera' | 'text'

export function QRScanner({ onScan, onError }: QRScannerProps): React.ReactElement {
  const [mode, setMode] = useState<ScannerMode>('idle')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [textValue, setTextValue] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    setCameraError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = 'Camera API is not available in this browser. Use the text input instead.'
      setCameraError(msg)
      onError?.(msg)
      setMode('text')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setMode('camera')
    } catch (err) {
      const msg =
        err instanceof Error
          ? `Camera access denied: ${err.message}`
          : 'Could not access camera'
      setCameraError(msg)
      onError?.(msg)
      setMode('text')
    }
  }, [onError])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  const handleStop = useCallback(() => {
    stopCamera()
    setMode('idle')
  }, [stopCamera])

  const handleTextSubmit = useCallback(() => {
    const trimmed = textValue.trim()
    if (trimmed) {
      onScan(trimmed)
    }
  }, [textValue, onScan])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleTextSubmit()
      }
    },
    [handleTextSubmit],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5 text-[#1e3a5f]" />
          QR Code Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cameraError && (
          <Alert variant="destructive">
            <CameraOff className="h-4 w-4" />
            <AlertDescription>{cameraError}</AlertDescription>
          </Alert>
        )}

        {mode === 'idle' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#1e3a5f]/10">
              <Camera className="h-10 w-10 text-[#1e3a5f]" />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Scan a QR code from a Payment Clearance Certificate to verify its authenticity.
            </p>
            <div className="flex gap-2">
              <Button onClick={startCamera} className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">
                <Camera className="h-4 w-4" />
                Start Camera
              </Button>
              <Button variant="outline" onClick={() => setMode('text')}>
                <Type className="h-4 w-4" />
                Enter Manually
              </Button>
            </div>
          </div>
        )}

        {mode === 'camera' && (
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded-lg border bg-black">
              <video
                ref={videoRef}
                className="w-full"
                playsInline
                muted
                style={{ maxHeight: 320 }}
              />
              {/* Scan overlay guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="h-48 w-48 border-2 border-[#2d8a4e] rounded-lg opacity-70">
                  {/* Corner accents */}
                  <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-[#2d8a4e] rounded-tl" />
                  <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-[#2d8a4e] rounded-tr" />
                  <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-[#2d8a4e] rounded-bl" />
                  <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-[#2d8a4e] rounded-br" />
                </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Position the QR code within the guide frame. Detection requires a compatible QR
              scanning library to be integrated.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleStop} className="flex-1">
                <StopCircle className="h-4 w-4" />
                Stop Camera
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  stopCamera()
                  setMode('text')
                }}
                className="flex-1"
              >
                <Type className="h-4 w-4" />
                Enter Manually
              </Button>
            </div>
          </div>
        )}

        {mode === 'text' && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Paste the QR code data or verification URL below:
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter QR data or certificate URL..."
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button
                onClick={handleTextSubmit}
                disabled={!textValue.trim()}
                className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90"
              >
                Verify
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setTextValue('')
                setMode('idle')
                setCameraError(null)
              }}
              className="text-xs"
            >
              Back to scanner
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
