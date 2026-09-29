import type { LucideIcon } from "lucide-react";
import { Earth, Globe2, Map } from "lucide-react";
import { continents } from "@/lib/continents";
import { continentQuizModes } from "@/lib/continent-quiz-modes";

export type FeatureStatus = "available" | "coming-soon";

export type FeatureOption = {
  id: string;
  label: string;
  href?: string;
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
    href:
      mode.status === "available"
        ? `${mode.href}/${continent.id}`
        : undefined,
  })),
}));

const worldwideFeatures: Feature[] = [
  {
    id: "quiz-worldwide",
    title: "Worldwide Flag Quiz",
    description:
      "Challenge yourself with flags from every corner of the globe in one quiz.",
    href: "/quiz/worldwide",
    status: "available",
    icon: Earth,
    shortLabel: "Worldwide Quiz",
  },
];

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
