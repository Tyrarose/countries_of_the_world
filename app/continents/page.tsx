import type { Metadata } from "next";
import {
  WorldContinentFlagMap,
  type CountryTopology,
} from "@/components/map/world-continent-flag-map";
import topology from "world-atlas/countries-110m.json";

export const metadata: Metadata = {
  title: "World Continents | Countries of the World",
  description:
    "Explore a world map where each continent's landmass is filled with its own flag.",
};

export default function ContinentsPage() {
  return (
    <div className="h-full min-h-0 w-full">
      <WorldContinentFlagMap topology={topology as CountryTopology} />
    </div>
  );
}
