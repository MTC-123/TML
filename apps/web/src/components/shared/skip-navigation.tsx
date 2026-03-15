export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-[#1e3a5f] focus:text-white focus:rounded-md focus:outline-3 focus:outline-[#d4a853] focus:outline-offset-2 focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}
