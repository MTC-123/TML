export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1e3a5f] border-t-transparent" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
