"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

type SiteShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function SiteShell({ children, className }: SiteShellProps) {
  const pathname = usePathname();
  const isMapPage = pathname === "/map" || pathname === "/continents";

  return (
    <div
      className={cn(
        "flex flex-col",
        isMapPage ? "h-dvh overflow-hidden" : "min-h-dvh"
      )}
    >
      <SiteHeader key={pathname} />
      <main
        className={cn(
          isMapPage
            ? "relative min-h-0 flex-1 overflow-hidden p-0"
            : "mx-auto w-full max-w-6xl px-4 py-8 sm:px-6",
          className
        )}
      >
        {children}
      </main>
    </div>
  );
}
