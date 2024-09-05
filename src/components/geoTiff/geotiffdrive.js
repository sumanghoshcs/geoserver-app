// src/components/MapComponent.js
import React, { useEffect, useRef, useState } from 'react';
import GeoTIFF from 'ol/source/GeoTIFF.js';
import Map from 'ol/Map.js';
import TileLayer from 'ol/layer/WebGLTile.js';
import 'ol/ol.css';
import { fromLonLat } from 'ol/proj';
import * as GeoTIFFLib from 'geotiff'; 
import View from 'ol/View.js'; 

const MapComponent = () => {
  const mapElement = useRef();
  const [clickInfo, setClickInfo] = useState(null); 
  const tiffUrl = 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif';
  const [imageInfo, setImageInfo] = useState(null);
  const [pixelCounts, setPixelCounts] = useState([]);
  const canvasRef = useRef(null);

  useEffect(() => {
  
    GeoTIFFLib.fromUrl(tiffUrl).then((tiff) => {
      tiff.getImage().then((image) => {
        const width = image.getWidth();
        const height = image.getHeight();
        const samplesPerPixel = image.getSamplesPerPixel();
        console.log(`GeoTIFF Width: ${width}, Height: ${height}, Samples Per Pixel: ${samplesPerPixel}`);

        const origin = image.getOrigin();
        const resolution = image.getResolution();
        const bbox = image.getBoundingBox();
        console.log("Origin: " + origin + "; Res: " + resolution + "; BBOX: " + bbox);

      
        image.readRasters({
          bbox: [8627178, 1980270, 8632636, 1987519],
          resampleMethod: 'bilinear'
        }).then((extentRasterData) => {
          console.log("Extent Raster Data Height: ", extentRasterData.height);
          console.log("Extent Raster Data Width: ", extentRasterData.width);
          console.log("Extent Raster Bytes: ", extentRasterData[0].length);
        });

        
        setImageInfo({
          width,
          height,
          origin,
          resolution,
          bbox
        });
      });
    });

    // Initialize OpenLayers Map with GeoTIFF
    const source = new GeoTIFF({
      sources: [
        {
          url: tiffUrl,
        },
      ],
    });

    const map = new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({
          source: source,
        }),
      ],
      view: new View({
        center: fromLonLat([0, 0]), // Adjust the initial center
        zoom: 2, // Adjust the initial zoom level
      }),
    });

    // Add a click handler to the map
    map.on('singleclick', (event) => {
      console.log({event})
      const coordinate = event.coordinate;
      const pixel = map.getPixelFromCoordinate(coordinate);
      const viewResolution = map.getView().getResolution();
      const more =event.activePointers;
      const ddfg = event.map
      const info = `Coordinates: ${coordinate}\nPixel: ${pixel}\nResolution: ${viewResolution}\nMore: ${ddfg}`;
      

      setClickInfo(info); // Update the state with the click information
    });


    return () => {
      map.setTarget(null); // Clean up the map on unmount
    };
  }, []);

  return (
    <div>
      <div
        ref={mapElement}
        style={{ width: '100%', height: '90vh' }}
        className="map"
      ></div>
      
      {/* Display click information */}
      {clickInfo && (
        <div style={{ padding: '10px', backgroundColor: '#f9f9f9', marginTop: '10px' }}>
          <h3>Click Info</h3>
          <pre>{clickInfo}</pre>
        </div>
      )}

      {/* Display GeoTIFF Image Info */}
      {imageInfo && (
        <div style={{ padding: '10px', backgroundColor: '#e0f7fa', marginTop: '10px' }}>
          <h3>GeoTIFF Info</h3>
          <p>Width: {imageInfo.width}</p>
          <p>Height: {imageInfo.height}</p>
          <p>Origin: {imageInfo.origin.join(', ')}</p>
          <p>Resolution: {imageInfo.resolution.join(', ')}</p>
          <p>Bounding Box: {imageInfo.bbox.join(', ')}</p>
        </div>
      )}
    </div>
  );
};

export default MapComponent;
