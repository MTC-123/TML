"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <div className="relative isolate overflow-hidden pt-14 pb-24 sm:pb-32 lg:pb-40">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pt-24 text-center">
        <div className="mx-auto max-w-4xl py-24 sm:py-32">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-muted-foreground ring-1 ring-border hover:ring-accent hover:text-foreground transition-colors">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-warning" />
                <span>Award-winning transparency platform</span>
              </span>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl animate-fade-up" style={{ animationDelay: "0.2s" }}>
            Transparency <br />
            <span className="text-accent">
              Middleware Layer
            </span>
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "0.4s" }}>
            Identity-anchored accountability for public infrastructure. 
            We bridge the gap between promises and deliverables using Verifiable Credentials.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6 animate-fade-up" style={{ animationDelay: "0.6s" }}>
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features" className="text-sm font-semibold leading-6 text-foreground hover:text-accent transition-colors">
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
