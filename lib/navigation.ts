import { continents } from "@/lib/continents";
import {
  formatContinentQuizPrompt,
  getContinentQuizMode,
} from "@/lib/continent-quiz-modes";
import { features } from "@/lib/features";

export type NavItem = {
  label: string;
  href: string;
  shortLabel?: string;
};

export const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  ...features
    .filter((feature) => !feature.options?.length)
    .map((feature) => ({
      label: feature.title,
      href: feature.href,
      shortLabel: feature.shortLabel,
    })),
];

const breadcrumbLabels: Record<string, string> = {
  "/": "Home",
  "/map": "Flag Map",
  "/continents": "World Continents",
  "/quiz/worldwide": "Worldwide Flag Quiz",
};

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === "/") {
    return [{ label: "Home", href: "/" }];
  }

  const quizCrumb = getContinentQuizBreadcrumb(pathname);
  if (quizCrumb) {
    return [{ label: "Home", href: "/" }, quizCrumb];
  }

  const crumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];
  const segments = pathname.split("/").filter(Boolean);
  let path = "";

  segments.forEach((segment, index) => {
    path += `/${segment}`;
    const isLast = index === segments.length - 1;
    const knownLabel = breadcrumbLabels[path];
    if (!knownLabel && !isLast) return;

    crumbs.push({
      label: knownLabel ?? formatSegment(segment),
      href: path,
    });
  });

  return crumbs;
}

function getContinentQuizBreadcrumb(pathname: string): BreadcrumbItem | null {
  const match = pathname.match(
    /^\/quiz\/continent\/(which-country|which-flag)\/([^/]+)$/
  );
  if (!match) return null;

  const mode = getContinentQuizMode(match[1]);
  const continent = continents.find((item) => item.id === match[2]);
  if (!mode || !continent) return null;

  return {
    label: formatContinentQuizPrompt(mode.prompt, continent.name),
    href: pathname,
  };
}

function formatSegment(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
