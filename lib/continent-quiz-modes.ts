import type { LucideIcon } from "lucide-react";
import { BookOpen, Flag, MapPin } from "lucide-react";

export type ContinentQuizModeId = "which-country" | "which-flag" | "review";

export type ContinentQuizMode = {
  id: ContinentQuizModeId;
  title: string;
  description: string;
  href: string;
  status: "available" | "coming-soon";
  icon: LucideIcon;
  prompt: string;
};

export const continentQuizModes: ContinentQuizMode[] = [
  {
    id: "which-country",
    title: "Which country is this flag",
    description:
      "See a flag and pick the matching country from four choices.",
    href: "/quiz/continent/which-country",
    status: "available",
    icon: Flag,
    prompt: "Which country is this flag?",
  },
  {
    id: "which-flag",
    title: "Which flag is this country",
    description:
      "See a country name and pick the matching flag from four choices.",
    href: "/quiz/continent/which-flag",
    status: "available",
    icon: MapPin,
    prompt: "Which flag is this country?",
  },
  {
    id: "review",
    title: "Intuitive flag review quiz",
    description:
      "Study a continent in groups of 7, with two choices each time. Missed ones come back until you get them right.",
    href: "/quiz/continent/review",
    status: "available",
    icon: BookOpen,
    prompt: "Intuitive flag review",
  },
];

export function getContinentQuizMode(
  modeId: string
): ContinentQuizMode | undefined {
  return continentQuizModes.find((mode) => mode.id === modeId);
}

export function formatContinentQuizPrompt(
  prompt: string,
  continentName: string
): string {
  const stem = prompt.replace(/\?$/, "").trim();
  if (!stem) return continentName;
  return `${stem} in ${continentName}?`;
}
