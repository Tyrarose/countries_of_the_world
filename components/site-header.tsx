import Link from "next/link";
import { Globe } from "lucide-react";
import { SiteBreadcrumbs } from "@/components/site-breadcrumbs";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex min-h-14 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="min-w-0">
          <SiteBreadcrumbs />
        </div>

        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-heading text-base font-semibold tracking-tight transition-opacity hover:opacity-80 sm:text-lg"
        >
          <Globe className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="sm:hidden">Countries</span>
          <span className="hidden sm:inline">Countries of the World</span>
        </Link>
      </div>
    </header>
  );
}
