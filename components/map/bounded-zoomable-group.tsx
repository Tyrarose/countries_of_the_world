"use client";

import { useMemo } from "react";
import {
  ZoomableGroup,
  useMapContext,
  type ZoomableGroupProps,
} from "react-simple-maps";
import { MAP_VERTICAL_LIMIT } from "@/lib/map-coordinates";

const EDGE_PADDING = 8;

export function BoundedZoomableGroup(props: ZoomableGroupProps) {
  const { projection } = useMapContext();

  const translateExtent = useMemo(() => {
    const northWest = projection([-180, MAP_VERTICAL_LIMIT]);
    const southEast = projection([180, -MAP_VERTICAL_LIMIT]);

    if (!northWest || !southEast) {
      return [
        [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
        [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
      ] as [[number, number], [number, number]];
    }

    const yMin = Math.min(northWest[1], southEast[1]) - EDGE_PADDING;
    const yMax = Math.max(northWest[1], southEast[1]) + EDGE_PADDING;

    return [
      [Number.NEGATIVE_INFINITY, yMin],
      [Number.POSITIVE_INFINITY, yMax],
    ] as [[number, number], [number, number]];
  }, [projection]);

  return <ZoomableGroup translateExtent={translateExtent} {...props} />;
}
