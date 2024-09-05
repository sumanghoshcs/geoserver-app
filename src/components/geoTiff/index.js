import React, { useEffect } from 'react';
import 'ol/ol.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import { fromLonLat } from 'ol/proj';
import OSM from 'ol/source/OSM';

const WMSMap = () => {
  useEffect(() => {
    // Define the WMS layer source
    // const wmsSource = new TileWMS({
    //   url: 'http://localhost:8080/geoserver/sf/wms?service=WMS&version=1.1.0&request=GetMap&layers=sf%3Astreams&bbox=589434.4971235897%2C4913947.342298816%2C609518.2117427464%2C4928071.049965891&width=768&height=540&srs=EPSG%3A26713&styles=&format=application/openlayers',
    //   params: {
    //     LAYERS: 'topp:states', // Example WMS layer
    //     TILED: true,
    //   },
    //   serverType: 'geoserver',
    // });

    const wmsSource = new TileWMS({
        url: 'http://localhost:8080/geoserver/sf/wms', // Base URL of the WMS service
        params: {
          LAYERS: 'sf:sfdem', // Replace with your layer name
          FORMAT: 'image/png', // Ensure the format is supported
          VERSION: '1.1.0',
          TILED: true,
        },
        serverType: 'geoserver',
      });

    // Create the Tile layer using WMS source
    const wmsLayer = new TileLayer({
      source: wmsSource,
    });

    const tileLayers = new TileLayer({
        source: new OSM(),
      });

    // Initialize the map
    const map = new Map({
      target: 'map',
      layers: [tileLayers,wmsLayer],
      view: new View({
        center: fromLonLat([-95, 37]), // Center map on USA
        zoom: 4,
      }),
    });

    // Add a click event to retrieve GetFeatureInfo
    map.on('singleclick', function (evt) {
      const viewResolution = map.getView().getResolution();
      const url = wmsSource.getFeatureInfoUrl(
        evt.coordinate, 
        viewResolution, 
        'EPSG:3857', // The projection
        { 'INFO_FORMAT': 'application/json' } // Specify JSON for response format
      );

      if (url) {
        fetch(url)
          .then((response) => response.json())
          .then((data) => {
            if (data.features.length > 0) {
              const featureInfo = data.features[0];
              alert(`Feature Info: ${JSON.stringify(featureInfo)}`);
            } else {
              alert('No feature info found.');
            }
          });
      }
    });
  }, []);

  return (
    <div>
      <div id="map" style={{ width: '100%', height: '100vh' }}></div>
    </div>
  );
};

export default WMSMap;
