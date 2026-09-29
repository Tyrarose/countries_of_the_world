// Web Mercator cannot represent the true poles (90°); this is the practical limit.
export const MAP_VERTICAL_LIMIT = 85.05112878;

export function wrapLongitude(lng: number): number {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}

export function constrainMapCenter(
  coordinates: [number, number]
): [number, number] {
  return [wrapLongitude(coordinates[0]), coordinates[1]];
}
