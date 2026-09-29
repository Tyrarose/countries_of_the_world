"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GeoJsonObject } from "geojson";
import { ComposableMap } from "react-simple-maps";
import { BoundedZoomableGroup } from "@/components/map/bounded-zoomable-group";
import { ContinentInfoCard } from "@/components/continents/continent-info-card";
import { ContinentTiledGeographies } from "@/components/map/continent-tiled-geographies";
import { getContinentById, type ContinentId } from "@/lib/country-continents";
import { constrainMapCenter } from "@/lib/map-coordinates";

const HOVER_CLEAR_DELAY_MS = 150;
const DRAG_THRESHOLD_PX = 6;

export type CountryTopology = {
  objects: Record<string, { geometries?: Array<{ id?: string | number }> }>;
};

type WorldContinentFlagMapProps = {
  topology: CountryTopology;
};

function resolveContinentIdFromPoint(
  clientX: number,
  clientY: number,
  hitPaths: SVGPathElement[]
): ContinentId | null {
  const svg = document.querySelector<SVGSVGElement>(
    ".world-continent-flag-map .rsm-svg"
  );
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
        const continentId = path.dataset.continentId;
        return continentId ? (continentId as ContinentId) : null;
      }
    } catch {
      // Ignore invalid paths in older browsers.
    }
  }

  return null;
}

export function WorldContinentFlagMap({ topology }: WorldContinentFlagMapProps) {
  const [hoveredContinentId, setHoveredContinentId] =
    useState<ContinentId | null>(null);
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

  const activeContinent = hoveredContinentId
    ? getContinentById(hoveredContinentId)
    : undefined;

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
          ".world-continent-flag-map [data-geo-hit]"
        )
      );
    });

    return () => cancelAnimationFrame(frameId);
  }, [position.zoom, position.coordinates]);

  const clearHoverTimeout = useCallback(() => {
    if (hoverClearTimeoutRef.current) {
      clearTimeout(hoverClearTimeoutRef.current);
      hoverClearTimeoutRef.current = null;
    }
  }, []);

  const handleContinentEnter = useCallback(
    (continentId: ContinentId) => {
      clearHoverTimeout();
      setHoveredContinentId(continentId);
    },
    [clearHoverTimeout]
  );

  const handleContinentLeave = useCallback(() => {
    clearHoverTimeout();
    hoverClearTimeoutRef.current = setTimeout(() => {
      setHoveredContinentId(null);
      hoverClearTimeoutRef.current = null;
    }, HOVER_CLEAR_DELAY_MS);
  }, [clearHoverTimeout]);

  const updateContinentFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const continentId = resolveContinentIdFromPoint(
        clientX,
        clientY,
        hitPathsRef.current
      );

      if (continentId) {
        handleContinentEnter(continentId);
      } else {
        handleContinentLeave();
      }
    },
    [handleContinentEnter, handleContinentLeave]
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
      className="world-continent-flag-map relative isolate h-full min-h-0 w-full overflow-hidden bg-muted/30"
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
          updateContinentFromPointer(event.clientX, event.clientY);
        }
      }}
      onPointerUp={(event) => {
        if (!isDraggingRef.current) {
          updateContinentFromPointer(event.clientX, event.clientY);
        }

        pointerDownRef.current = null;
        isDraggingRef.current = false;
      }}
      onPointerLeave={() => {
        pointerDownRef.current = null;
        isDraggingRef.current = false;
        handleContinentLeave();
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
          <ContinentTiledGeographies
            topology={topology as unknown as GeoJsonObject}
            hoveredContinentId={hoveredContinentId}
          />
        </BoundedZoomableGroup>
      </ComposableMap>

      {activeContinent &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-auto fixed bottom-4 right-4 z-[100] sm:bottom-6 sm:right-6"
            onPointerEnter={() => {
              clearHoverTimeout();
              setHoveredContinentId(activeContinent.id as ContinentId);
            }}
            onPointerLeave={handleContinentLeave}
          >
            <ContinentInfoCard continent={activeContinent} />
          </div>,
          document.body
        )}
    </div>
  );
}
