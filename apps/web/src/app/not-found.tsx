import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground/50" />
      <div>
        <h1 className="text-3xl font-bold">404</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          The page you are looking for does not exist.
        </p>
      </div>
      <Button asChild className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">
        <Link href="/">Back to Home</Link>
      </Button>
    </div>
  );
}
