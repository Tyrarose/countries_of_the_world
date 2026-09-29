import { getFlagUrl } from "@/lib/country-codes";

export type CountryPattern = {
  geoId: string;
  alpha2: string;
};

type FlagPatternDefsProps = {
  countries: CountryPattern[];
};

export function FlagPatternDefs({ countries }: FlagPatternDefsProps) {
  return (
    <defs>
      {countries.map(({ geoId, alpha2 }) => (
        <pattern
          key={geoId}
          id={`flag-${geoId}`}
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <image
            href={getFlagUrl(alpha2)}
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
