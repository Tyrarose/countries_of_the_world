"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GeoJsonObject } from "geojson";
import { ComposableMap } from "react-simple-maps";
import { BoundedZoomableGroup } from "@/components/map/bounded-zoomable-group";
import { CountryInfoCard } from "@/components/map/country-info-card";
import { TiledGeographies } from "@/components/map/tiled-geographies";
import type { CountryPattern } from "@/components/map/flag-pattern-defs";
import {
  getAlpha2FromGeoId,
  getCountryNameFromGeoId,
} from "@/lib/country-codes";
import { constrainMapCenter } from "@/lib/map-coordinates";

const HOVER_CLEAR_DELAY_MS = 150;
const DRAG_THRESHOLD_PX = 6;

export type CountryTopology = {
  objects: Record<string, { geometries?: Array<{ id?: string | number }> }>;
};

type WorldFlagMapProps = {
  topology: CountryTopology;
};

function resolveGeoIdFromPoint(
  clientX: number,
  clientY: number,
  hitPaths: SVGPathElement[]
): string | null {
  const svg = document.querySelector<SVGSVGElement>(".world-flag-map .rsm-svg");
  if (!svg || hitPaths.length === 0) return null;

  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;

  for (let index = hitPaths.length - 1; index >= 0; index -= 1) {
    const path = hitPaths[index];
    const matrix = path.getScreenCTM();
    if (!matrix) continue;

    const localPoint = point.matrixTransform(matrix.inverse());

    try {
      if (path.isPointInFill(localPoint)) {
        return path.dataset.geoId ?? null;
      }
    } catch {
      // Ignore invalid paths in older browsers.
    }
  }

  return null;
}

export function WorldFlagMap({ topology }: WorldFlagMapProps) {
  const [hoveredGeoId, setHoveredGeoId] = useState<string | null>(null);
  const [position, setPosition] = useState({
    coordinates: [0, 0] as [number, number],
    zoom: 1,
  });
  const hoverClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const hitPathsRef = useRef<SVGPathElement[]>([]);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);

  const countryPatterns = useMemo(() => {
    const objects = topology.objects;
    const countriesObject = objects.countries ?? objects.default;
    if (!countriesObject || !("geometries" in countriesObject)) return [];

    const patterns: CountryPattern[] = [];

    for (const geometry of countriesObject.geometries ?? []) {
      const geoId = String(geometry.id ?? "");
      if (!geoId) continue;

      const alpha2 = getAlpha2FromGeoId(geoId);
      if (!alpha2) continue;

      patterns.push({ geoId, alpha2 });
    }

    return patterns;
  }, [topology]);

  const patternIds = useMemo(
    () => new Set(countryPatterns.map((country) => country.geoId)),
    [countryPatterns]
  );

  const activeGeoId = hoveredGeoId;
  const activeAlpha2 = activeGeoId ? getAlpha2FromGeoId(activeGeoId) : undefined;
  const activeCountryName = activeGeoId
    ? getCountryNameFromGeoId(activeGeoId) ?? activeGeoId
    : "";

  useEffect(() => {
    return () => {
      if (hoverClearTimeoutRef.current) {
        clearTimeout(hoverClearTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      hitPathsRef.current = Array.from(
        document.querySelectorAll<SVGPathElement>(
          ".world-flag-map [data-geo-hit]"
        )
      );
    });

    return () => cancelAnimationFrame(frameId);
  }, [position.zoom, position.coordinates, countryPatterns.length]);

  const clearHoverTimeout = useCallback(() => {
    if (hoverClearTimeoutRef.current) {
      clearTimeout(hoverClearTimeoutRef.current);
      hoverClearTimeoutRef.current = null;
    }
  }, []);

  const handleCountryEnter = useCallback(
    (geoId: string) => {
      clearHoverTimeout();
      setHoveredGeoId(geoId);
    },
    [clearHoverTimeout]
  );

  const handleCountryLeave = useCallback(() => {
    clearHoverTimeout();
    hoverClearTimeoutRef.current = setTimeout(() => {
      setHoveredGeoId(null);
      hoverClearTimeoutRef.current = null;
    }, HOVER_CLEAR_DELAY_MS);
  }, [clearHoverTimeout]);

  const updateCountryFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const geoId = resolveGeoIdFromPoint(
        clientX,
        clientY,
        hitPathsRef.current
      );

      if (geoId) {
        handleCountryEnter(geoId);
      } else {
        handleCountryLeave();
      }
    },
    [handleCountryEnter, handleCountryLeave]
  );

  const syncPosition = useCallback(
    (coordinates?: [number, number], zoom?: number) => {
      if (!coordinates || zoom === undefined) return;

      setPosition({
        coordinates: constrainMapCenter(coordinates),
        zoom,
      });
    },
    []
  );

  return (
    <div
      className="world-flag-map relative isolate h-full min-h-0 w-full overflow-hidden bg-muted/30"
      onPointerDown={(event) => {
        pointerDownRef.current = { x: event.clientX, y: event.clientY };
        isDraggingRef.current = false;
      }}
      onPointerMove={(event) => {
        if (pointerDownRef.current) {
          const deltaX = event.clientX - pointerDownRef.current.x;
          const deltaY = event.clientY - pointerDownRef.current.y;

          if (Math.hypot(deltaX, deltaY) > DRAG_THRESHOLD_PX) {
            isDraggingRef.current = true;
          }
        }

        if (!isDraggingRef.current) {
          updateCountryFromPointer(event.clientX, event.clientY);
        }
      }}
      onPointerUp={(event) => {
        if (!isDraggingRef.current) {
          updateCountryFromPointer(event.clientX, event.clientY);
        }

        pointerDownRef.current = null;
        isDraggingRef.current = false;
      }}
      onPointerLeave={() => {
        pointerDownRef.current = null;
        isDraggingRef.current = false;
        handleCountryLeave();
      }}
    >

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 147 }}
        className="relative z-0 h-full w-full [&_.rsm-svg]:h-full [&_.rsm-svg]:w-full"
      >
        <BoundedZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={({ coordinates, zoom }) => syncPosition(coordinates, zoom)}
          minZoom={1}
          maxZoom={8}
        >
          <TiledGeographies
            topology={topology as unknown as GeoJsonObject}
            countryPatterns={countryPatterns}
            patternIds={patternIds}
            hoveredGeoId={hoveredGeoId}
          />
        </BoundedZoomableGroup>
      </ComposableMap>

      {activeGeoId &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-auto fixed bottom-4 right-4 z-[100] sm:bottom-6 sm:right-6"
            onPointerEnter={() => {
              clearHoverTimeout();
              setHoveredGeoId(activeGeoId);
            }}
            onPointerLeave={handleCountryLeave}
          >
            <CountryInfoCard
              key={activeGeoId}
              alpha2={activeAlpha2}
              countryName={activeCountryName}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
