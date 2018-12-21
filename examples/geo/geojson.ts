// borrow from deck.gl layers/src/geojson-layer/geojson.js
import { Feature, FeatureCollection, Geometry, GeometryCollection, Position, Point, LineString } from 'geojson';

export function getGeojsonFeatures(geojson: FeatureCollection|Feature): Feature[] {
  // If array, assume this is a list of features
  if (Array.isArray(geojson)) {
    return geojson;
  }

  switch (geojson.type) {
    case 'Feature':
      // Wrap the feature in a 'Features' array
      return [geojson];
    case 'FeatureCollection':
      // Just return the 'Features' array from the collection
      return geojson.features;
    default:
      // Assume it's a geometry, we'll check type in separateGeojsonFeatures
      // Wrap the geometry object in a 'Feature' object and wrap in an array
      return [{
        type: 'Feature',
        geometry: geojson,
        properties: {}
      }];
  }
}

type GeoCoordinates = Position | Position[] | Position[][] | Position[][][];

interface SourceFeature {
  feature: Feature;
  index: number;
}

interface GeoFeature {
  geometry: Geometry;
  sourceFeature: SourceFeature;
}

interface GeoFeatures {
  pointFeatures: GeoFeature[];
  lineFeatures: GeoFeature[];
  polygonFeatures: GeoFeature[];
  polygonOutlineFeatures: GeoFeature[];
}

export function separateGeojsonFeatures(features: Feature[]): GeoFeatures {
  const separated = {
    pointFeatures: new Array<GeoFeature>(),
    lineFeatures: new Array<GeoFeature>(),
    polygonFeatures: new Array<GeoFeature>(),
    polygonOutlineFeatures: new Array<GeoFeature>()
  };

  for (let featureIndex = 0; featureIndex < features.length; featureIndex++) {
    const feature = features[featureIndex];

    const {geometry} = feature;

    const sourceFeature = {
      feature,
      index: featureIndex
    };

    if (geometry.type === 'GeometryCollection') {
      const {geometries} = geometry;
      for (let i = 0; i < geometries.length; i++) {
        const subGeometry = geometries[i];
        separateGeometry(<Exclude<Geometry, GeometryCollection>>subGeometry, separated, sourceFeature);
      }
    } else {
      separateGeometry(geometry, separated, sourceFeature);
    }
  }

  return separated;
}

function separateGeometry(geometry: Exclude<Geometry, GeometryCollection>, separated: GeoFeatures, sourceFeature: SourceFeature): void {
  const {type, coordinates} = geometry;
  const {pointFeatures, lineFeatures, polygonFeatures, polygonOutlineFeatures} = separated;

  // Split each feature, but keep track of the source feature and index (for Multi* geometries)
  switch (type) {
    case 'Point':
      pointFeatures.push({
        geometry: <Point>geometry,
        sourceFeature
      });
      break;
    case 'MultiPoint':
      for (const point of <Position[]>coordinates) {
        pointFeatures.push({
          geometry: {
            type: 'Point',
            coordinates: <Position>point
          },
          sourceFeature
        });
      }
      break;
    case 'LineString':
      lineFeatures.push({
        geometry: <LineString>geometry,
        sourceFeature
      });
      break;
    case 'MultiLineString':
      // Break multilinestrings into multiple lines
      for (const path of <Position[][]>coordinates) {
        lineFeatures.push({
          geometry: {
            type: 'LineString',
            coordinates: <Position[]>path
          },
          sourceFeature
        });
      }
      break;
    case 'Polygon':
      polygonFeatures.push({
        geometry,
        sourceFeature
      });
      // Break polygon into multiple lines
      for (const path of <Position[][]>coordinates) {
        polygonOutlineFeatures.push({
          geometry: {
            type: 'LineString',
            coordinates: <Position[]>path
          },
          sourceFeature
        });
      }
      break;
    case 'MultiPolygon':
      // Break multipolygons into multiple polygons
      for (const polygon of <Position[][][]>coordinates) {
        polygonFeatures.push({
          geometry: {
            type: 'Polygon',
            coordinates: <Position[][]>polygon
          },
          sourceFeature
        });

        // Break polygon into multiple lines
        for (const path of polygon) {
          polygonOutlineFeatures.push({
            geometry: {
              type: 'LineString',
              coordinates: path
            },
            sourceFeature
          });
        }
      }
      break;
    default:
  }
}
