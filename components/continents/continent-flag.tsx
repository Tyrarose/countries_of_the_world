import { getContinentFlagImageHref } from "@/lib/continent-flag-image";
import type { ContinentId } from "@/lib/country-continents";
import type { Continent } from "@/lib/continents";
import { cn } from "@/lib/utils";

type ContinentFlagProps = {
  continent: Continent;
  className?: string;
};

export function ContinentFlag({ continent, className }: ContinentFlagProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- flag image from flagcdn or inline SVG data URI
    <img
      src={getContinentFlagImageHref(continent.id as ContinentId)}
      alt={`Flag of ${continent.name}`}
      className={cn("h-full w-full object-cover", className)}
    />
  );
}
