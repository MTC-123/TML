import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "TML — Transparency Middleware Layer",
  description:
    "Identity-anchored accountability middleware for public infrastructure projects in Morocco and Africa.",
  keywords: ["transparency", "accountability", "infrastructure", "Morocco", "Africa", "DID", "attestation"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
