import React, { useState, useEffect, useRef,useCallback} from 'react';
import axios from 'axios';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
import GeoJSON from 'ol/format/GeoJSON';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Feature } from 'ol';
import MultiPoint from 'ol/geom/MultiPoint.js';
import Point from 'ol/geom/Point';
import { Icon, Style, Fill, Stroke, Circle as CircleStyle, Text} from 'ol/style';
import {Heatmap as HeatmapLayer} from "ol/layer";
import { Cluster } from "ol/source";
import { Select } from 'antd'; // Import Ant Design Select
import jsonData from "./components/jsonData"
import ArcGis from "./components/arcGis"

const { Option } = Select;


const MyComponent = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coordinates, setCoordinates] = useState(null);
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [vectorLayer, setVectorLayer] = useState(null);
  const [showRoads, setShowRoads] = useState(false);
  const [populatedPlace, setPopulatedPlace] = useState(false)
  const [populatedPlaceLayer, setPopulatedPlaceLayer] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showPopulatedPlace, setShowPopulatedPlace] = useState(false);
  const [layerColor, setLayerColor] = useState('#ffff'); // Default color
  const [isClustered, setIsClustered] = useState(false);
  const [clusterLayers,setIsClusterLayers] = useState(null);
  const [himapLayer,setIsHeatmapLayer] = useState(null);
  const [toggleApi,setToggleApi] = useState(false);


  
  const geojsonObject = {
    'type': 'FeatureCollection',
    'crs': {
      'type': 'name',
      'properties': {
        'name': 'EPSG:3857',
      },
    },
    'features': [
      {
        'type': 'Feature',
        'geometry': {
          'type': 'Polygon',
          'coordinates': [
            [
              [-5e6, 6e6],
              [-5e6, 8e6],
              [-3e6, 8e6],
              [-3e6, 6e6],
              [-5e6, 6e6],
            ],
          ],
        },
      },
      {
        'type': 'Feature',
        'geometry': {
          'type': 'Polygon',
          'coordinates': [
            [
              [-2e6, 6e6],
              [-2e6, 8e6],
              [0, 8e6],
              [0, 6e6],
              [-2e6, 6e6],
            ],
          ],
        },
      },
      {
        'type': 'Feature',
        'geometry': {
          'type': 'Polygon',
          'coordinates': [
            [
              [1e6, 6e6],
              [1e6, 8e6],
              [3e6, 8e6],
              [3e6, 6e6],
              [1e6, 6e6],
            ],
          ],
        },
      },
      {
        'type': 'Feature',
        'geometry': {
          'type': 'Polygon',
          'coordinates': [
            [
              [-2e6, -1e6],
              [-1e6, 1e6],
              [0, -1e6],
              [-2e6, -1e6],
            ],
          ],
        },
      },
    ],
  };

  const styles = [
    /* We are using two different styles for the polygons:
     *  - The first style is for the polygons themselves.
     *  - The second style is to draw the vertices of the polygons.
     *    In a custom geometry function the vertices of a polygon are
     *    returned as MultiPoint geometry, which will be used to render
     *    the style.
     */
    new Style({
      stroke: new Stroke({
        color: 'blue',
        width: 3,
      }),
      fill: new Fill({
        color: 'rgba(0, 0, 255, 0.1)',
      }),
    }),
    new Style({
      image: new CircleStyle({
        radius: 5,
        fill: new Fill({
          color: 'orange',
        }),
      }),
      geometry: function (feature) {
        // return the coordinates of the first ring of the polygon
        const coordinates = feature.getGeometry().getCoordinates()[0];
        return new MultiPoint(coordinates);
      },
    }),
  ];

  const getPolygonStyle = (feature) => {
    const zoneValue = feature.get('zone');
    const fillColor = zoneValue < 100 ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';

    return new Style({
      fill: new Fill({
        color: fillColor,
      }),
      stroke: new Stroke({
        color: '#000', // Black border for all polygons
        width: 2
        ,
      }),
    });
  };
  
  
  // Fetch data from GeoServer
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Start loading
        const response = await axios.get(
          'http://localhost:8080/geoserver/ne/wms?service=WMS&version=1.1.0&request=GetMap&layers=ne%3Aworld&bbox=-180.0%2C-90.0%2C180.0%2C90.0&width=768&height=384&srs=EPSG%3A4326&styles=&format=geojson'
        );
        const geojsonData = response.data;
        setData(geojsonData); // Store the GeoJSON data
        const styleResponse = await axios.get('http://localhost:8080/geoserver/ne/wms?service=WMS&version=1.1.0&request=GetMap&layers=ne%3Apopulated_places&bbox=-175.2205644999999%2C-41.29206799231509%2C179.2166470999999%2C64.14345946317033&width=768&height=330&srs=EPSG%3A4326&styles=&format=geojson')
        const populatedPlaceData = styleResponse.data
        setPopulatedPlace(populatedPlaceData)
       
      } catch (err) {
        setError(err.message); // Capture any errors
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchData();
  }, [toggleApi]);

  const styleFunction = (feature) => {
    const featureType = feature.getGeometry().getType();
    let style = null;

    // Example: Apply different styles based on feature type
    if (featureType === 'Point') {
      style = new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({
            color: 'rgba(255, 0, 0, 0.6)', 
          }),
          stroke: new Stroke({
            color: '#ffcc33',
            width: 2,
          }),
        }),
      });
    } else if (featureType === 'Polygon') {
      style = new Style({
        stroke: new Stroke({
          color: layerColor, 
          width: 2,
        }),
        fill: new Fill({
          color: 'rgba(0, 0, 255, 0.3)', 
        }),
      });
    }

    return style;
  };
  
  // Initialize map and add tile layer
  useEffect(() => {
    if (!map && mapRef.current) {
      const tileLayers = new TileLayer({
        source: new OSM(),
      });


      let defaultLocation = [87.325320, 22.415280];

      const newView = new View({
        center: fromLonLat(defaultLocation),
        zoom: 10,
      });

      const source = new VectorSource({
        features: new GeoJSON().readFeatures(geojsonObject),
      });
      
      const layer = new VectorLayer({
        source: source,
        style: styleFunction,
      });

      const populationLayers = new VectorSource({
        features: new GeoJSON().readFeatures(jsonData, {
          featureProjection: 'EPSG:3857', // Project to Web Mercator
        }),
      });

      const poplationlayer = new VectorLayer({
        source: populationLayers,
      style: getPolygonStyle,
      });

      const generateRandomPoints = () => {
        const features = [];
        const count = 500; // Number of points
        const minLon = 68.0;
        const maxLon = 97.0;
        const minLat = 8.0;
        const maxLat = 37.0;
    
        for (let i = 0; i < count; i++) {
          const lon = Math.random() * (maxLon - minLon) + minLon;
          const lat = Math.random() * (maxLat - minLat) + minLat;
          const coords = fromLonLat([lon, lat]);
          const feature = new Feature(new Point(coords));
          features.push(feature);
        }
        return features;
      };

      const features = generateRandomPoints();

      const sourceHit = new VectorSource({
        features: features,
      });

      const clusterSource = new Cluster({
        distance: 5,
        source: sourceHit,
      });
      
      const heatmapLayer = new HeatmapLayer({
        source: sourceHit,
        blur: 10,
        radius: 10,
        weight: function (feature) {
          return Math.random();
        }
      });
    setIsHeatmapLayer(heatmapLayer)
      const styleCache = {};
      const clusterLayer = new VectorLayer({
        source: clusterSource,
        style: function (feature) {
          const size = feature.get("features").length;
          let style = styleCache[size];
          if (!style) {
            style = new Style({
              image: new CircleStyle({
                radius: 10,
                stroke: new Stroke({
                  color: "#fff",
                }),
                fill: new Fill({
                  color: "#3399CC",
                }),
              }),
              text: new Text({
                text: size.toString(),
                fill: new Fill({
                  color: "#fff",
                }),
              }),
            });
            styleCache[size] = style;
          }
          return style;
        },
      });

      setIsClusterLayers(clusterLayer)
      const initialMap = new Map({
        target: mapRef.current,
        layers: [tileLayers,layer,poplationlayer],
        view: newView,
      });

      setMap(initialMap);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation([longitude, latitude]);
          initialMap.getView().setCenter(fromLonLat([longitude, latitude]));
          initialMap.getView().setZoom(12);
        },
        (err) => {
          console.error('Error getting location: ', err);
        }
      );

      initialMap.on('pointermove', function (evt) {
        const [lon, lat] = toLonLat(evt.coordinate);
        setCoordinates({ lon, lat });
      });
    }

    if (data && map) {
      
      const showBorder = new VectorSource({
        features: new GeoJSON().readFeatures(data, {
          featureProjection: 'EPSG:3857',
        }),
      });

      const newVectorLayer = new VectorLayer({
        source: showBorder,
        style: new Style({
          stroke: new Stroke({
            color: layerColor,
            width: 2,
          }),
          // fill: new Fill({
          //   color: ${layerColor}80, // Add transparency to the fill color
          // }),
        }),
      });

      setVectorLayer(newVectorLayer);
    }

    if (populatedPlace && map) {
      const populatedPlaceSource = new VectorSource({
        features: new GeoJSON().readFeatures(populatedPlace, {
          featureProjection: 'EPSG:3857',
        }),
      });

      const newPopulatedPlaceLayer = new VectorLayer({
        source: populatedPlaceSource,
        style: new Style({
          image: new Icon({
            src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            scale: 0.05,
          }),
        }),
      });

      setPopulatedPlaceLayer(newPopulatedPlaceLayer);
    }

  }, [data, map, layerColor,populatedPlace,toggleApi]);

  useEffect(() => {
    if (vectorLayer) {
      vectorLayer.setVisible(showRoads);
      const existingLayer = map.getLayers().getArray().find(layer => layer === vectorLayer);
  
      if (showRoads && !existingLayer) {
       
        map.addLayer(vectorLayer);
      } else if (!showRoads && existingLayer) {
        debugger
        map.removeLayer(vectorLayer);
        
      }
    }
  }, [showRoads, vectorLayer, map]);
  // setLayerColor('#ffff');

  useEffect(() => {
    if (populatedPlaceLayer) {
      populatedPlaceLayer.setVisible(showPopulatedPlace);
      const existingLayer = map.getLayers().getArray().find((layer) => layer === populatedPlaceLayer);

      if (showPopulatedPlace && !existingLayer) {
        map.addLayer(populatedPlaceLayer);
      } else if (!showPopulatedPlace && existingLayer) {
        map.removeLayer(populatedPlaceLayer);
      }
    }
  }, [showPopulatedPlace, populatedPlaceLayer, map]);
   
      // const toggleCluster = useCallback(() => {
      //   if (map) {
      //     if (isClustered) {
      //       map.removeLayer(clusterLayers);
      //       map.addLayer(himapLayer);
      //     } else {
      //       map.removeLayer(himapLayer);
      //       map.addLayer(clusterLayers);
      //     }
      //     setIsClustered(!isClustered);
      //   }
      // }, [map, isClustered, clusterLayers, himapLayer]);

      const toggleCluster = () =>{
        if (map) {
          if (isClustered) {
            map.removeLayer(clusterLayers);
            map.addLayer(himapLayer);
          } else {
            map.removeLayer(himapLayer);
            map.addLayer(clusterLayers);
          }
          setIsClustered(!isClustered);
        }
      }


  useEffect(() => {
    if (map && currentLocation) {
      const locationFeature = new Feature({
        geometry: new Point(fromLonLat(currentLocation)),
      });

      locationFeature.setStyle(
        new Style({
          image: new Icon({
            src: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
            scale: 0.05,
          }),
        })
      );

      const locationLayer = new VectorLayer({
        source: new VectorSource({
          features: [locationFeature],
        }),
      });

      map.addLayer(locationLayer);
    }
  }, [map, currentLocation]);

  const handleColorChange = (value) => {
      setLayerColor(value); 
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const toggleApis = () =>{
    setToggleApi(prev=>!prev)
  }

  return (
    <div>
      <div style={{ 
          position: 'absolute',
          top: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000,}}>
       <button onClick={toggleApis} style={{ position: "absolute", top: "10px", left: "10px" }}>
        Toggle ArcGis/OpenLayer
      </button>
      </div>
      {toggleApi ? <><ArcGis/></> : <>  <div ref={mapRef} style={{ width: '100%', height: '100vh' }}></div>
      <div
        style={{
          position: 'absolute',
          top: '10px',
          right: '15px',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '10px',
          borderRadius: '5px',
          zIndex: 1000,
        }}
      >
        <h4>Layer Controls</h4>
        <div>
          <input
            type="checkbox"
            checked={showRoads}
            onChange={(e) => setShowRoads(e.target.checked)}
          />
          <label htmlFor="osmLayer"> Country Map</label>
        </div>

        <div>
          <input
           type="checkbox"
           checked={showPopulatedPlace}
           onChange={(e) => setShowPopulatedPlace(e.target.checked)}
          />
          <label htmlFor="osmLayer"> Populqted Place</label>
        </div>

        <div>
        <button onClick={toggleCluster} style={{ position: "absolute", top: "10px", left: "10px" }}>
        Toggle Cluster/Heatmap
      </button>
        </div>

        <Select
          defaultValue={layerColor}
          style={{ width: 120 }}
          onChange={handleColorChange}
        >
          <Option value="#ff0000">Red</Option>
          <Option value="#00ff00">Green</Option>
          <Option value="#0000ff">Blue</Option>
          <Option value="#fffff">Default</Option>
        </Select>

        {coordinates && (
          <div>
            <p>
              Longitude: {coordinates.lon.toFixed(2)}, Latitude: {coordinates.lat.toFixed(2)}
            </p>
          </div>
        )}
      </div>
      </>}
    </div>
  );
};

export default MyComponent;