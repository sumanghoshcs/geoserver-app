import React, { useRef, useEffect } from 'react';
import MapView from "@arcgis/core/views/MapView";
import Map from "@arcgis/core/Map";
import Graphic from "@arcgis/core/Graphic";
import Point from "@arcgis/core/geometry/Point";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import GeoJSONLayer from "@arcgis/core/layers/GeoJSONLayer";
import PopupTemplate from "@arcgis/core/PopupTemplate";
import Expand from "@arcgis/core/widgets/Expand";
import Legend from "@arcgis/core/widgets/Legend";
import Style from "./index.css"

const ArcGis = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    const map = new Map({
      basemap: "dark-gray-vector", 
    });

    const view = new MapView({
      container: mapRef.current,
      map: map,
      center: [87.325320, 22.415280],
      zoom: 8, 
    });

 
    const point = new Point({
      longitude: 87.325320,
      latitude: 22.415280,
    });

    const pointSymbol = {
      type: "simple-marker",
      color: "red",
      size: "8px",
    };

    const pointGraphic = new Graphic({
      geometry: point,
      symbol: pointSymbol,
    });

    view.graphics.add(pointGraphic);

    const layer = new GeoJSONLayer({
      url: "https://bsvensson.github.io/various-tests/geojson/usgs-earthquakes-06182019.geojson",
      copyright: "USGS Earthquakes",
      title: "USGS Earthquakes",
      timeInfo: {
        startField: "time",
        interval: {
          unit: "days",
          value: 1,
        },
      },
      orderBy: {
        field: "mag",
      },
      renderer: {
        type: "simple",
        symbol: {
          type: "simple-marker",
          color: "orange",
          outline: null,
        },
        visualVariables: [
          {
            type: "size",
            field: "mag",
            stops: [
              { value: 1, size: "5px" },
              { value: 2, size: "15px" },
              { value: 3, size: "35px" },
            ],
          },
          {
            type: "color",
            field: "depth",
            stops: [
              { value: 2.5, color: "#F9C653", label: "<2km" },
              { value: 3.5, color: "#F8864D", label: "3km" },
              { value: 4, color: "#C53C06", label: ">4km" },
            ],
          },
        ],
      },
      popupTemplate: {
        title: "{title}",
        content: [
          {
            type: "fields",
            fieldInfos: [
              { fieldName: "place", label: "Location", visible: true },
              { fieldName: "mag", label: "Magnitude", visible: true },
              { fieldName: "depth", label: "Depth", visible: true },
            ],
          },
        ],
      },
    });

    map.add(layer);

    const legendExpand = new Expand({
      view: view,
      content: new Legend({
        view: view,
      }),
    });
    view.ui.add(legendExpand, "top-left");

    const customContent = document.createElement("div");
customContent.innerHTML = `
  <h3>USGS Earthquakes</h3>
  <p>3 earthquakes were recorded between 6/6/2019 - 6/19/2019.</p>
      <p>Max magnitude: 4.80</p>
      <p>Average magnitude: 4.60</p>
      <p>Min magnitude: 4.40</p>
      <p>Average Depth: 18.33 </p>
`;

    const newlegendExpand = new Expand({
      view: view,
      content: customContent,
    });

    view.ui.add(newlegendExpand, "top-right");

    const geojsonLayer = new GeoJSONLayer({
      url: "http://localhost:8080/geoserver/ne/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ne:populated_places&outputFormat=application/json",  // Replace with the URL to your GeoJSON file
     popupTemplate: {
        title: "{name}",
        content: [
          {
            type: "fields",
            fieldInfos: [
              { fieldName: "latitude", label: "Latitude", visible: true },
              { fieldName: "longitude", label: "Longitude", visible: true },
              { fieldName: "adm1name", label: "City", visible: true },
              { fieldName: "adm0name", label: "Country", visible: true },
            ],
          },
        ],
      },
    });

    map.add(geojsonLayer);

    view.on("click", (event) => {
      view.hitTest(event).then((response) => {
        const graphic = response.results.find(result => result.graphic.layer === geojsonLayer);
      
        if (graphic) {
          const geometry = graphic.graphic.geometry;
          
          view.goTo({
            target: geometry,
            zoom: 12, 
          });
       
        }
      });
    });

    // return () => {
    //   if (view) {
    //     view.destroy();
    //   }
    // };

    return () => {
      if (view) {
        view.when(() => {
          // Only destroy the view once it's fully initialized
          view.destroy();
        }).catch((error) => {
          // Handle errors during the destruction process
          console.error("Error destroying view:", error);
        });
      }
    };
  }, []);

  return <div>
    <div ref={mapRef} style={{ width: '100%', height: '100vh' }}></div>
  </div>
 
};

export default ArcGis;
