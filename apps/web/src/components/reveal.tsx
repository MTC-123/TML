"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

type Animation =
  | "fade-up"
  | "fade-in"
  | "scale-in"
  | "slide-left"
  | "slide-right"
  | "blur-in";

interface RevealProps {
  children: ReactNode;
  animation?: Animation;
  delay?: number;
  className?: string;
  once?: boolean;
  threshold?: number;
}

/**
 * Scroll-triggered reveal animation.
 * Wraps children in an observed div that plays a CSS animation when entering the viewport.
 */
export function Reveal({
  children,
  animation = "fade-up",
  delay = 0,
  className = "",
  once = true,
  threshold = 0.15,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold]);

  const style: CSSProperties = {
    animationDelay: delay ? `${delay}ms` : undefined,
  };

  return (
    <div
      ref={ref}
      className={`${visible ? `animate-${animation}` : "opacity-0"} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
