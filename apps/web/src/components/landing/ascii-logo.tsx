"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

// ════════════════════════════════════════════════════════════════
// TML — ASCII Eye of Transparency
// Animated surveillance eye using luminance-density character mapping
// Characters: · ~ o x + = * % $ @  (light → dense)
// ════════════════════════════════════════════════════════════════

const DENSITY = " ·~ox+=*%$@";
const W = 64;
const H = 28;

// Eye geometry parameters
const EYE_CX = W / 2;
const EYE_CY = 13;
const EYE_RX = 26;
const EYE_RY = 9;
const IRIS_R = 7;
const PUPIL_R = 3;

interface IrisPosition {
  dx: number;
  dy: number;
}

// 5x3 grid of iris look-directions (normalized -1..1)
const IRIS_GRID: IrisPosition[] = [];
for (let gy = -1; gy <= 1; gy++) {
  for (let gx = -2; gx <= 2; gx++) {
    IRIS_GRID.push({ dx: gx * 0.35, dy: gy * 0.4 });
  }
}

// Smooth animation path through iris positions (figure-8 + sweep)
const ANIM_PATH: number[] = [
  7, 8, 13, 12, 11, 6, 1, 2, 3, 8, 7, 6, 11, 12, 7, 2, 3, 8, 13, 12, 7,
];

function sdfEllipse(
  px: number,
  py: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number
): number {
  const nx = (px - cx) / rx;
  const ny = (py - cy) / ry;
  return Math.sqrt(nx * nx + ny * ny) - 1.0;
}

function sdfEye(
  px: number,
  py: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number
): number {
  const upperLid = sdfEllipse(px, py, cx, cy - ry * 0.15, rx, ry * 1.1);
  const lowerLid = sdfEllipse(px, py, cx, cy + ry * 0.15, rx, ry * 1.1);
  return Math.max(upperLid, lowerLid);
}

function sdfCircle(
  px: number,
  py: number,
  cx: number,
  cy: number,
  r: number
): number {
  const dx = px - cx;
  const dy = (py - cy) * 1.8; // aspect ratio correction for monospace
  return Math.sqrt(dx * dx + dy * dy) - r;
}

type Frame = string[];

function generateFrame(irisOffsetX: number, irisOffsetY: number): Frame {
  const irisCX = EYE_CX + irisOffsetX * 12;
  const irisCY = EYE_CY + irisOffsetY * 4;
  const lines: string[] = [];

  for (let y = 0; y < H; y++) {
    let line = "";
    for (let x = 0; x < W; x++) {
      const eyeDist = sdfEye(x, y, EYE_CX, EYE_CY, EYE_RX, EYE_RY);
      const irisDist = sdfCircle(x, y, irisCX, irisCY, IRIS_R);
      const pupilDist = sdfCircle(x, y, irisCX, irisCY, PUPIL_R);

      let luminance = 0;

      if (eyeDist < -0.5) {
        if (pupilDist < -0.3) {
          luminance = 0.95;
          const hlDist = sdfCircle(x, y, irisCX - 1.5, irisCY - 0.8, 1.2);
          if (hlDist < 0) luminance = 0.15;
        } else if (irisDist < -0.3) {
          const angle = Math.atan2(y - irisCY, x - irisCX);
          const radialPattern = Math.sin(angle * 12) * 0.15;
          const distFromCenter = Math.min(1, -irisDist / IRIS_R);
          luminance = 0.55 + distFromCenter * 0.3 + radialPattern;
        } else if (irisDist < 0.5) {
          luminance = 0.4 + irisDist * 0.3;
        } else {
          const veinNoise =
            Math.sin(x * 0.8 + y * 1.2) *
            Math.sin(x * 0.3 - y * 0.7) *
            0.08;
          luminance = 0.08 + veinNoise;
          const edgeFade = Math.max(0, Math.min(1, -eyeDist * 0.5));
          luminance += (1 - edgeFade) * 0.05;
        }
      } else if (eyeDist < 0.8) {
        luminance = 0.7 - eyeDist * 0.4;
      } else if (eyeDist < 2.5) {
        const falloff = (eyeDist - 0.8) / 1.7;
        luminance = 0.12 * (1 - falloff * falloff);
      } else {
        luminance = 0;
      }

      const idx = Math.round(luminance * (DENSITY.length - 1));
      line += DENSITY[Math.max(0, Math.min(DENSITY.length - 1, idx))];
    }
    lines.push(line);
  }
  return lines;
}

const TML_LOGO: string[] = [
  "  ████████╗ ███╗   ███╗ ██╗      ",
  "  ╚══██╔══╝ ████╗ ████║ ██║      ",
  "     ██║    ██╔████╔██║ ██║      ",
  "     ██║    ██║╚██╔╝██║ ██║      ",
  "     ██║    ██║ ╚═╝ ██║ ███████╗ ",
  "     ╚═╝    ╚═╝     ╚═╝ ╚══════╝ ",
];

const TAGLINE =
  "T R A N S P A R E N T   M I L E S T O N E   L E D G E R";
const SUBTITLE = "every dirham accountable";

interface TMLAsciiLogoProps {
  reducedMotion?: boolean;
}

export default function TMLAsciiLogo({
  reducedMotion = false,
}: TMLAsciiLogoProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [glitchLine, setGlitchLine] = useState(-1);
  const [scanLine, setScanLine] = useState(0);
  const [opacity, setOpacity] = useState(reducedMotion ? 1 : 0);

  // Pre-generate all frames
  const frames: Frame[] = useMemo(() => {
    return IRIS_GRID.map((pos) => generateFrame(pos.dx, pos.dy));
  }, []);

  // Idle animation: eye looks around
  useEffect(() => {
    if (isHovered || reducedMotion) return;
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % ANIM_PATH.length);
    }, 600);
    return () => clearInterval(interval);
  }, [isHovered, reducedMotion]);

  // Mouse tracking: eye follows cursor
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isHovered) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      setMousePos({
        x: Math.max(0, Math.min(1, nx)),
        y: Math.max(0, Math.min(1, ny)),
      });
    },
    [isHovered]
  );

  // Find closest frame to mouse position
  const activeFrameIdx: number = useMemo(() => {
    if (!isHovered) return ANIM_PATH[frameIndex] ?? 7;
    const targetDx = (mousePos.x - 0.5) * 2;
    const targetDy = (mousePos.y - 0.5) * 2;
    let bestIdx = 0;
    let bestDist = Infinity;
    IRIS_GRID.forEach((pos, i) => {
      const d = (pos.dx - targetDx) ** 2 + (pos.dy - targetDy) ** 2;
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    return bestIdx;
  }, [isHovered, mousePos, frameIndex]);

  // Random glitch effect
  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.15) {
        const line = Math.floor(Math.random() * H);
        setGlitchLine(line);
        setTimeout(() => setGlitchLine(-1), 80);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  // Scan line effect
  useEffect(() => {
    if (reducedMotion) return;
    const interval = setInterval(() => {
      setScanLine((prev) => (prev + 1) % (H + TML_LOGO.length + 12));
    }, 60);
    return () => clearInterval(interval);
  }, [reducedMotion]);

  // Fade in
  useEffect(() => {
    if (reducedMotion) return;
    const timer = setTimeout(() => setOpacity(1), 100);
    return () => clearTimeout(timer);
  }, [reducedMotion]);

  const currentFrame: Frame = frames[activeFrameIdx] ?? frames[7] ?? [];

  const glitchShift = (lineIdx: number): string => {
    if (reducedMotion) return "none";
    if (lineIdx === glitchLine)
      return `translateX(${(Math.random() - 0.5) * 8}px)`;
    return "none";
  };

  return (
    <div
      className="flex flex-col items-center justify-center overflow-hidden font-mono relative"
      style={{
        opacity,
        transition: reducedMotion ? "none" : "opacity 1.5s ease",
      }}
    >
      {/* CRT vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgba(10,15,28,0.5) 100%)",
        }}
      />

      {/* Top status bar */}
      <div className="hidden sm:block text-sidebar-foreground/30 text-[11px] tracking-[3px] mb-6 font-['Courier_New',monospace] uppercase">
        ┌ sys.tml.core ─── identity verification protocol ─── active ┐
      </div>

      {/* Eye ASCII art */}
      <div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="cursor-crosshair relative px-4"
      >
        <pre
          className="m-0 select-none tracking-[1px] text-[5px] leading-[6px] sm:text-[clamp(5px,1.1vw,13px)] sm:leading-[clamp(6px,1.25vw,15px)]"
          style={{
            color: "#1e3a5f",
          }}
        >
          {currentFrame.map((line, i) => (
            <div
              key={i}
              style={{
                transform: glitchShift(i),
                opacity: !reducedMotion && i === scanLine ? 0.6 : 1,
                transition: reducedMotion ? "none" : "opacity 0.05s",
                color:
                  !reducedMotion && i === scanLine
                    ? "#5a8ab5"
                    : line.trim().length === 0
                      ? "transparent"
                      : undefined,
              }}
            >
              {line || " ".repeat(W)}
            </div>
          ))}
        </pre>

        {/* Glow pulse behind the eye */}
        {!reducedMotion && (
          <div
            className="absolute top-1/2 left-1/2 w-[60%] h-[60%] pointer-events-none -z-10"
            style={{
              transform: "translate(-50%, -50%)",
              background:
                "radial-gradient(ellipse, rgba(30,58,95,0.1) 0%, transparent 70%)",
              animation: "tml-pulse 3s ease-in-out infinite",
            }}
          />
        )}
      </div>

      {/* Divider line */}
      <div
        className="text-sidebar-foreground/20 text-[clamp(5px,1.1vw,13px)] font-['Courier_New',monospace] my-3 tracking-[2px]"
      >
        ═══════════════════════════════════════════════════════════════
      </div>

      {/* TML block letters */}
      <pre
        className="m-0 text-center select-none font-['Courier_New',monospace] text-[clamp(6px,1.2vw,14px)] leading-[clamp(7px,1.35vw,16px)]"
        style={{
          color: "#c8daf0",
        }}
      >
        {TML_LOGO.map((line, i) => (
          <div
            key={`logo-${i}`}
            style={
              reducedMotion
                ? {}
                : {
                    opacity: 0,
                    animation: "tml-fadeSlideUp 0.6s ease forwards",
                    animationDelay: `${1.2 + i * 0.1}s`,
                  }
            }
          >
            {line}
          </div>
        ))}
      </pre>

      {/* Tagline */}
      <div
        className="mt-4 font-['Courier_New',monospace] text-[clamp(7px,0.85vw,11px)] tracking-[clamp(2px,0.5vw,6px)]"
        style={{
          color: "#4a7ab5",
          ...(reducedMotion
            ? {}
            : {
                opacity: 0,
                animation: "tml-fadeSlideUp 0.8s ease forwards",
                animationDelay: "2s",
              }),
        }}
      >
        {TAGLINE}
      </div>

      {/* Subtitle */}
      <div
        className="mt-2 font-['Courier_New',monospace] uppercase text-[clamp(8px,0.9vw,12px)] tracking-[clamp(3px,0.7vw,8px)]"
        style={{
          color: "#2d8a4e",
          ...(reducedMotion
            ? {}
            : {
                opacity: 0,
                animation: "tml-fadeSlideUp 0.8s ease forwards",
                animationDelay: "2.4s",
              }),
        }}
      >
        ◆ {SUBTITLE} ◆
      </div>

      {/* Bottom status */}
      <div
        className="hidden sm:flex gap-8 mt-8 text-sidebar-foreground/25 text-[10px] tracking-[2px] font-['Courier_New',monospace]"
        style={
          reducedMotion
            ? {}
            : {
                opacity: 0,
                animation: "tml-fadeSlideUp 0.6s ease forwards",
                animationDelay: "2.8s",
              }
        }
      >
        <span>■ CNIE VERIFIED</span>
        <span>■ ED25519 SIGNED</span>
        <span>■ W3C VC COMPLIANT</span>
        <span>■ CNDP SECURED</span>
      </div>

      {/* Hover instruction */}
      <div
        className="mt-6 text-[9px] tracking-[4px] font-['Courier_New',monospace] uppercase transition-colors duration-300"
        style={{
          color: isHovered ? "#3b7dd850" : "#1e3a5f30",
          ...(reducedMotion
            ? {}
            : {
                opacity: 0,
                animation: "tml-fadeSlideUp 0.6s ease forwards",
                animationDelay: "3.2s",
              }),
        }}
      >
        {isHovered ? "[ tracking ]" : "[ move cursor over eye ]"}
      </div>

      <style>{`
        @keyframes tml-pulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
        }
        @keyframes tml-fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
