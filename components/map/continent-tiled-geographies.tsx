"use client";

import { useMemo } from "react";
import type { Feature, GeoJsonObject, Geometry } from "geojson";
import { Geographies, Geography, useMapContext } from "react-simple-maps";
import { ContinentFlagPatternDefs } from "@/components/map/continent-flag-pattern-defs";
import { getCountryNameFromGeoId } from "@/lib/country-codes";
import { getContinentIdFromGeoId } from "@/lib/country-continents";

const FALLBACK_FILL = "#d4d4d8";
const COUNTRY_BORDER = "#16a34a";
const TILE_OFFSETS = [-1, 0, 1] as const;

type RenderedGeography = Feature<Geometry> & {
  rsmKey: string;
  svgPath: string | null;
};

type ContinentTiledGeographiesProps = {
  topology: GeoJsonObject;
  hoveredContinentId: string | null;
};

type GeographyTileProps = {
  geographies: RenderedGeography[];
  translateX: number;
  hoveredContinentId: string | null;
  tileIndex: number;
};

function GeographyTile({
  geographies,
  translateX,
  hoveredContinentId,
  tileIndex,
}: GeographyTileProps) {
  return (
    <g transform={`translate(${translateX}, 0)`}>
      {geographies.map((geo) => {
        const geoId = String(geo.id ?? "");
        const continentId = getContinentIdFromGeoId(geoId);
        const isActive = continentId && hoveredContinentId === continentId;

        return (
          <Geography
            key={`${tileIndex}-${geo.rsmKey}`}
            geography={geo}
            fill={
              continentId
                ? `url(#continent-flag-${continentId})`
                : FALLBACK_FILL
            }
            stroke={COUNTRY_BORDER}
            strokeWidth={isActive ? 1.25 : 0.5}
            opacity={isActive ? 0.92 : 1}
            style={{ pointerEvents: "none" }}
            tabIndex={-1}
            aria-hidden="true"
          />
        );
      })}

      {geographies.map((geo) => {
        const geoId = String(geo.id ?? "");
        const continentId = getContinentIdFromGeoId(geoId);
        const countryName =
          getCountryNameFromGeoId(geoId) ??
          (geo.properties?.name as string | undefined) ??
          geoId;

        if (!geo.svgPath) return null;

        return (
          <path
            key={`${tileIndex}-${geo.rsmKey}-hit`}
            d={geo.svgPath}
            data-geo-hit="true"
            data-geo-id={geoId}
            data-continent-id={continentId ?? ""}
            fill="transparent"
            stroke="transparent"
            pointerEvents="none"
            aria-hidden="true"
            aria-label={countryName}
          />
        );
      })}
    </g>
  );
}

export function ContinentTiledGeographies({
  topology,
  hoveredContinentId,
}: ContinentTiledGeographiesProps) {
  const { projection } = useMapContext();

  const worldWidth = useMemo(() => {
    const west = projection([-180, 0]);
    const east = projection([180, 0]);

    if (!west || !east) {
      return 800;
    }

    return east[0] - west[0];
  }, [projection]);

  return (
    <>
      <ContinentFlagPatternDefs />
      <Geographies geography={topology}>
        {({ geographies }) =>
          TILE_OFFSETS.map((tile) => (
            <GeographyTile
              key={tile}
              tileIndex={tile}
              geographies={geographies}
              translateX={tile * worldWidth}
              hoveredContinentId={hoveredContinentId}
            />
          ))
        }
      </Geographies>
    </>
  );
}
