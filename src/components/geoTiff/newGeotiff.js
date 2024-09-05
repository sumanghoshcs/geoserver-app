// src/MapComponent.js

import React, { useEffect } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/WebGLTile';
import GeoTIFF from 'ol/source/GeoTIFF';
import 'ol/ol.css';

const MapComponent = () => {
  useEffect(() => {
    // Create a GeoTIFF source
    const source = new GeoTIFF({
      sources: [
        {
          url: 'https://openlayers.org/data/raster/no-overviews.tif',
          overviews: ['https://openlayers.org/data/raster/no-overviews.tif.ovr'],
        },
      ],
    });

    // Initialize the map
    const map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: source,
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });

    // Cleanup on component unmount
    return () => {
      map.setTarget(null);
    };
  }, []);

  return (
    <div id="map" style={{ width: '100%', height: '90vh' }}></div>
  );
};

export default MapComponent;
