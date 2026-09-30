import type { LucideIcon } from "lucide-react";
import { Globe2, Map } from "lucide-react";
import { continents } from "@/lib/continents";
import {
  getQuizCountries,
  getWorldwideQuizCountries,
  worldwideQuizSizes,
} from "@/lib/continent-quiz";
import {
  continentQuizModes,
  formatContinentQuizPrompt,
} from "@/lib/continent-quiz-modes";

export type FeatureStatus = "available" | "coming-soon";

export type FeatureOption = {
  id: string;
  label: string;
  href?: string;
  countryCount?: number;
};

export type Feature = {
  id: string;
  title: string;
  description: string;
  href: string;
  status: FeatureStatus;
  icon: LucideIcon;
  shortLabel?: string;
  cta?: string;
  options?: FeatureOption[];
};

export type FeatureGroup = {
  id: string;
  title: string;
  features: Feature[];
};

const mapFeatures: Feature[] = [
  {
    id: "flag-map",
    title: "World Flag Map",
    description:
      "Explore a world map where every country is filled with its own flag, shaped to match its borders.",
    href: "/map",
    status: "available",
    icon: Map,
    shortLabel: "Flag Map",
  },
  {
    id: "world-continents",
    title: "World Continents",
    description:
      "Explore a world map where each continent's landmass is filled with its own flag.",
    href: "/continents",
    status: "available",
    icon: Globe2,
    shortLabel: "Continents",
  },
];

const continentQuizFeatures: Feature[] = continentQuizModes.map((mode) => ({
  id: `quiz-${mode.id}`,
  title: mode.title,
  description: mode.description,
  href: mode.href,
  status: mode.status,
  icon: mode.icon,
  options: continents.map((continent) => ({
    id: continent.id,
    label: continent.name,
    countryCount: getQuizCountries(continent.id).length,
    href:
      mode.status === "available"
        ? `${mode.href}/${continent.id}`
        : undefined,
  })),
}));

const worldwideCountryCount = getWorldwideQuizCountries().length;

const worldwideFeatures: Feature[] = continentQuizModes
  .filter((mode) => mode.id !== "review")
  .map((mode) => ({
    id: `quiz-worldwide-${mode.id}`,
    title: formatContinentQuizPrompt(mode.prompt, "Worldwide").replace(
      /\?$/,
      ""
    ),
    description: mode.description,
    href: `/quiz/worldwide/${mode.id}/all`,
    status: "available" as const,
    icon: mode.icon,
    shortLabel:
      mode.id === "which-country" ? "Which country" : "Which flag",
    options: worldwideQuizSizes.map((size) => ({
      id: size.id,
      label: size.label,
      href: `/quiz/worldwide/${mode.id}/${size.id}`,
      countryCount: size.limit == null ? worldwideCountryCount : undefined,
    })),
  }));

export const featureGroups: FeatureGroup[] = [
  {
    id: "maps",
    title: "Maps",
    features: mapFeatures,
  },
  {
    id: "continent-quiz",
    title: "Flag Quiz by Continent",
    features: continentQuizFeatures,
  },
  {
    id: "worldwide",
    title: "Worldwide",
    features: worldwideFeatures,
  },
];

export const features: Feature[] = featureGroups.flatMap(
  (group) => group.features
);
