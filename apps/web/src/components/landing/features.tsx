"use client";

import { 
  ShieldCheck, 
  Fingerprint, 
  Landmark, 
  FileCheck,
  Globe,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Verifiable Credentials",
    description: "Every milestone and audit is cryptographically signed and independently verifiable.",
    icon: ShieldCheck,
    className: "md:col-span-2",
  },
  {
    title: "Biometric Anchors",
    description: "Connect digital actions to real-world identities securely.",
    icon: Fingerprint,
    className: "md:col-span-1",
  },
  {
    title: "Public Oversight",
    description: "Complete transparency for citizen auditors and international observers.",
    icon: Users,
    className: "md:col-span-1",
  },
  {
    title: "Government Integration",
    description: "Seamlessly connects with existing ministry databases and procurement systems.",
    icon: Landmark,
    className: "md:col-span-2",
  },
  {
    title: "Global Standards",
    description: "Built on W3C DID and Verifiable Credentials standards.",
    icon: Globe,
    className: "md:col-span-3",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 sm:py-32 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-accent">Why TML?</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trust through technology.
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            We replace &ldquo;trust us&rdquo; with &ldquo;verify this&rdquo;. Our platform ensures valid delivery of public goods.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[250px]">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={cn(
                "group relative overflow-hidden rounded-3xl border border-border bg-card p-8 hover:bg-muted transition-colors shadow-sm",
                feature.className
              )}
            >
              <div className="relative h-full flex flex-col justify-between z-10">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-5 w-5 text-accent" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
