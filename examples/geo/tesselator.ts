import { getTriangleCount, getVertexCount, getSurfaceIndices } from './polygon';
import { Position } from 'geojson';

// Returns the offsets of each complex polygon in the combined array of all polygons
function getPolygonOffsets(polygons: number[][][]) {
  const offsets = new Array(polygons.length + 1);
  offsets[0] = 0;
  let offset = 0;
  polygons.forEach((polygon, i) => {
    offset += getVertexCount(polygon);
    offsets[i + 1] = offset;
  });
  return offsets;
}

function getPointCount(polygons: number[][][]) {
  return polygons.reduce((points, polygon) => points + getVertexCount(polygon), 0);
}

export function calculateIndices(polygons: number[][][]): Uint32Array {
  // Calculate length of index array (3 * number of triangles)
  const indexCount = 3 * polygons.reduce((triangles, polygon) => triangles + getTriangleCount(polygon), 0);
  const offsets = getPolygonOffsets(polygons);

  // Allocate the attribute
  const attribute = new Uint32Array(indexCount);

  // 1. get triangulated indices for the internal areas
  // 2. offset them by the number of indices in previous polygons
  let i = 0;
  polygons.forEach((polygon, polygonIndex) => {
    for (const index of getSurfaceIndices(polygon)) {
      attribute[i++] = index + offsets[polygonIndex];
    }
  });

  return attribute;
}

export function calculatePositions(polygons: number[][][]): {positions: Float32Array, vertexValid: Uint8ClampedArray} {
  let i = 0;
  const pointCount = getPointCount(polygons);
  const positions = new Float32Array(pointCount * 3);
  const vertexValid = new Uint8ClampedArray(pointCount).fill(1);

  polygons.forEach(polygon => {
    polygon.forEach(loop => {
      loop.forEach(vertex => {
        // @ts-ignore
        const x = vertex[0];
        // @ts-ignore
        const y = vertex[1];
        // @ts-ignore
        const z = vertex[2] || 0;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        i++;
      });
      /* We are reusing the some buffer for `nextPositions` by offsetting one vertex
       * to the left. As a result,
       * the last vertex of each loop overlaps with the first vertex of the next loop.
       * `vertexValid` is used to mark the end of each loop so we don't draw these
       * segments:
        positions      A0 A1 A2 A3 A4 B0 B1 B2 C0 ...
        nextPositions  A1 A2 A3 A4 B0 B1 B2 C0 C1 ...
        vertexValid    1  1  1  1  0  1  1  0  1 ...
       */
      vertexValid[i - 1] = 0;
    });
  });

  return {
    positions,
    vertexValid
  }
}

export function calculateColors(polygons: number[][][], color: [number, number, number, number?]) {
  const pointCount = getPointCount(polygons);
  const colors = new Uint8ClampedArray(pointCount * 4);
  let i = 0;
  polygons.forEach(complexPolygon => {
    if (isNaN(color[3])) {
      color[3] = 255;
    }

    const vertexCount = getVertexCount(complexPolygon);
    fillArray({target: colors, source: color, start: i, count: vertexCount});
    i += color.length * vertexCount;
  });
  return colors;
}

// Uses copyWithin to significantly speed up typed array value filling
// @ts-ignore
export function fillArray({target, source, start = 0, count = 1}) {
  const length = source.length;
  const total = count * length;
  let copied = 0;
  for (let i = start; copied < length; copied++) {
    target[i++] = source[copied];
  }

  while (copied < total) {
    // If we have copied less than half, copy everything we got
    // else copy remaining in one operation
    if (copied < total - copied) {
      target.copyWithin(start + copied, start, start + copied);
      copied *= 2;
    } else {
      target.copyWithin(start + copied, start, start + total - copied);
      copied = total;
    }
  }

  return target;
}