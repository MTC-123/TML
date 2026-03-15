'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Copy, Check, QrCode } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface QRCodeDisplayProps {
  value: string
  size?: number
}

/**
 * Generates a deterministic dot-matrix from the input string that visually
 * resembles a QR code. Includes standard finder patterns and timing strips.
 *
 * NOTE: This is a visual representation only — it is not a spec-compliant QR
 * code. For production barcode scanning, swap in a real encoder library.
 */
function generateMatrix(data: string, modules: number): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: modules }, () =>
    Array.from({ length: modules }, () => false),
  )

  // --- Finder patterns (top-left, top-right, bottom-left) ---
  const finderSize = 7
  const drawFinder = (startRow: number, startCol: number) => {
    for (let r = 0; r < finderSize; r++) {
      for (let c = 0; c < finderSize; c++) {
        const isOuter =
          r === 0 || r === finderSize - 1 || c === 0 || c === finderSize - 1
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4
        const row = matrix[startRow + r]
        if (row) row[startCol + c] = isOuter || isInner
      }
    }
  }

  drawFinder(0, 0)
  drawFinder(0, modules - finderSize)
  drawFinder(modules - finderSize, 0)

  // --- Timing patterns ---
  for (let i = finderSize; i < modules - finderSize; i++) {
    const timingRow = matrix[6]
    if (timingRow) timingRow[i] = i % 2 === 0
    const timingCol = matrix[i]
    if (timingCol) timingCol[6] = i % 2 === 0
  }

  // --- Data area filled via deterministic hash of input ---
  let seed = 0
  for (let i = 0; i < data.length; i++) {
    seed = ((seed << 5) - seed + data.charCodeAt(i)) | 0
  }
  seed = Math.abs(seed)

  for (let r = 0; r < modules; r++) {
    for (let c = 0; c < modules; c++) {
      const inTopLeftFinder = r < finderSize + 1 && c < finderSize + 1
      const inTopRightFinder = r < finderSize + 1 && c >= modules - finderSize - 1
      const inBottomLeftFinder = r >= modules - finderSize - 1 && c < finderSize + 1
      if (inTopLeftFinder || inTopRightFinder || inBottomLeftFinder || r === 6 || c === 6) {
        continue
      }
      seed = (seed * 1103515245 + 12345 + r * 31 + c * 17) | 0
      const dataRow = matrix[r]
      if (dataRow) dataRow[c] = Math.abs(seed) % 3 === 0
    }
  }

  return matrix
}

export function QRCodeDisplay({ value, size = 200 }: QRCodeDisplayProps): React.ReactElement {
  const [copied, setCopied] = useState(false)
  const modules = 25

  const matrix = useMemo(() => generateMatrix(value, modules), [value])
  const cellSize = size / modules

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access denied — silently ignore
    }
  }, [value])

  return (
    <Card className="w-fit">
      <CardContent className="flex flex-col items-center gap-3 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <QrCode className="h-4 w-4" />
          Verification QR Code
        </div>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rounded border bg-white p-2"
        >
          {matrix.map((row, rowIdx) =>
            row.map((cell, colIdx) =>
              cell ? (
                <rect
                  key={`${rowIdx}-${colIdx}`}
                  x={colIdx * cellSize}
                  y={rowIdx * cellSize}
                  width={cellSize}
                  height={cellSize}
                  fill="#1e3a5f"
                />
              ) : null,
            ),
          )}
        </svg>
        <p className="max-w-[200px] break-all text-center font-mono text-xs text-muted-foreground">
          {value.length > 40 ? `${value.slice(0, 20)}...${value.slice(-20)}` : value}
        </p>
        <Button variant="outline" size="sm" onClick={handleCopy} className="w-full">
          {copied ? (
            <>
              <Check className="h-4 w-4 text-[#2d8a4e]" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy Link
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
