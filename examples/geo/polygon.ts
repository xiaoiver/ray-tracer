// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import earcut from 'earcut';

type SimplePolygon = number[][];
type ComplexPolygon = number[][][];

// Basic polygon support
//
// Handles simple and complex polygons
// Simple polygons are arrays of vertices, implicitly "closed"
// Complex polygons are arrays of simple polygons, with the first polygon
// representing the outer hull and other polygons representing holes

/**
 * Check if this is a non-nested polygon (i.e. the first element of the first element is a number)
 * @param {Array} polygon - either a complex or simple polygon
 * @return {Boolean} - true if the polygon is a simple polygon (i.e. not an array of polygons)
 */
export function isSimple(polygon: SimplePolygon) {
  return polygon.length >= 1 && polygon[0].length >= 2 && Number.isFinite(polygon[0][0]);
}

/**
 * Ensure that all simple polygons have the same start and end vertex
 */
function closeLoop(simplePolygon: SimplePolygon) {
  // check if first and last vertex are the same
  const p0 = simplePolygon[0];
  const p1 = simplePolygon[simplePolygon.length - 1];

  if (p0[0] === p1[0] && p0[1] === p1[1] && p0[2] === p1[2]) {
    return simplePolygon;
  }
  // duplicate the starting vertex at end
  return simplePolygon.concat([p0]);
}

/**
 * Normalize to ensure that all polygons in a list are complex - simplifies processing
 * @param {Array} polygon - either a complex or a simple polygon
 * @param {Object} opts
 * @param {Object} opts.dimensions - if 3, the coords will be padded with 0's if needed
 * @return {Array} - returns a complex polygons
 */
export function normalize(polygon: SimplePolygon|ComplexPolygon, {dimensions = 3} = {}) {
  return isSimple(<SimplePolygon>polygon) ? [closeLoop(<SimplePolygon>polygon)] : (<ComplexPolygon>polygon).map(closeLoop);
}

/**
 * Check if this is a non-nested polygon (i.e. the first element of the first element is a number)
 * @param {Array} polygon - either a complex or simple polygon
 * @return {Boolean} - true if the polygon is a simple polygon (i.e. not an array of polygons)
 */
export function getVertexCount(polygon: SimplePolygon|ComplexPolygon) {
  return isSimple(<SimplePolygon>polygon)
    ? polygon.length
    : (<ComplexPolygon>polygon).reduce((length, simplePolygon) => length + simplePolygon.length, 0);
}

// Return number of triangles needed to tesselate the polygon
export function getTriangleCount(polygon: SimplePolygon) {
  let triangleCount = 0;
  let first = true;
  for (const simplePolygon of normalize(polygon)) {
    const size = simplePolygon.length;
    if (first) {
      triangleCount += size >= 3 ? size - 2 : 0;
    } else {
      triangleCount += size + 1;
    }
    first = false;
  }
  return triangleCount;
}

// Returns the offset of each hole polygon in the flattened array for that polygon
function getHoleIndices(complexPolygon: SimplePolygon): null|number[] {
  let holeIndices = null;
  if (complexPolygon.length > 1) {
    let polygonStartIndex = 0;
    holeIndices = new Array<number>();
    complexPolygon.forEach(polygon => {
      polygonStartIndex += polygon.length;
      holeIndices.push(polygonStartIndex);
    });
    // Last element points to end of the flat array, remove it
    holeIndices.pop();
  }
  return holeIndices;
}

/*
 * Get vertex indices for drawing complexPolygon mesh
 * @private
 * @param {[Number,Number,Number][][]} complexPolygon
 * @returns {[Number]} indices
 */
export function getSurfaceIndices(complexPolygon: SimplePolygon) {
  // Prepare an array of hole indices as expected by earcut
  const holeIndices = getHoleIndices(complexPolygon);
  // Flatten the polygon as expected by earcut
  const verts = flattenVertices(complexPolygon, {dimensions: 2, result: []});
  // Let earcut triangulate the polygon
  return earcut(verts, holeIndices, 2);
}

// Flattens nested array of vertices, padding third coordinate as needed
export function flattenVertices(nestedArray: number[] | number[][] | number[][][], {result = new Array(), dimensions = 3} = {}) {
  let index = -1;
  let vertexLength = 0;
  while (++index < nestedArray.length) {
    const value = nestedArray[index];
    if (Array.isArray(value) || ArrayBuffer.isView(value)) {
      // @ts-ignore
      flattenVertices(value, {result, dimensions});
    } else {
      // eslint-disable-next-line
      if (vertexLength < dimensions) {
        result.push(value);
        vertexLength++;
      }
    }
  }
  // Add a third coordinate if needed
  if (vertexLength > 0 && vertexLength < dimensions) {
    result.push(0);
  }
  return result;
}
