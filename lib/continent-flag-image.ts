import type { ContinentId } from "@/lib/country-continents";

/**
 * Continent flag images from ThothWhatsThis's "Flags of the seven continents"
 * (https://www.reddit.com/r/vexillology/comments/14yx3lh/flags_of_the_seven_continents/)
 */
export function getContinentFlagImageHref(continentId: ContinentId): string {
  return `/flags/continents/${continentId}.png`;
}
