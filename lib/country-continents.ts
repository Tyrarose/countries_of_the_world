import countryContinentsData from "@/lib/country-continents-data.json";
import { getAlpha2FromGeoId } from "@/lib/country-codes";
import type { Continent } from "@/lib/continents";
import { continents } from "@/lib/continents";

export type ContinentId = Continent["id"];

const countryContinents = countryContinentsData as Record<string, ContinentId>;

const continentById = new Map(continents.map((continent) => [continent.id, continent]));

export function getContinentIdFromAlpha2(
  alpha2: string
): ContinentId | undefined {
  return countryContinents[alpha2.toLowerCase()];
}

export function getContinentIdFromGeoId(
  geoId: string | number
): ContinentId | undefined {
  const alpha2 = getAlpha2FromGeoId(geoId);
  if (!alpha2) return undefined;
  return getContinentIdFromAlpha2(alpha2);
}

export function getContinentById(
  continentId: ContinentId
): Continent | undefined {
  return continentById.get(continentId);
}
