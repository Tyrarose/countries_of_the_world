import { getContinentFlagImageHref } from "@/lib/continent-flag-image";
import type { ContinentId } from "@/lib/country-continents";
import { continents } from "@/lib/continents";

export function ContinentFlagPatternDefs() {
  return (
    <defs>
      {continents.map((continent) => (
        <pattern
          key={continent.id}
          id={`continent-flag-${continent.id}`}
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <image
            href={getContinentFlagImageHref(continent.id as ContinentId)}
            width="1"
            height="1"
            preserveAspectRatio="xMidYMid slice"
            pointerEvents="none"
          />
        </pattern>
      ))}
    </defs>
  );
}
