import type { Metadata } from "next";
import { WorldFlagMap, type CountryTopology } from "@/components/map/world-flag-map";
import topology from "world-atlas/countries-110m.json";

export const metadata: Metadata = {
  title: "World Flag Map | Countries of the World",
  description:
    "Explore a world map where every country is filled with its own flag.",
};

export default function MapPage() {
  return (
    <div className="h-full min-h-0 w-full">
      <WorldFlagMap topology={topology as CountryTopology} />
    </div>
  );
}
