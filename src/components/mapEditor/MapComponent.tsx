
import React, { useEffect, useRef, useState } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw, Modify, Snap } from 'ol/interaction';
import { Fill, Stroke, Style } from 'ol/style';
import { Polygon } from 'ol/geom';
import { getArea, getLength } from 'ol/sphere';
import { Feature } from 'ol';
import 'ol/ol.css';

interface MapComponentProps {
  onPolygonDrawn: (area: number, perimeter: number, coordinates: number[][]) => void;
  selectedColor: string;
}

const MapComponent: React.FC<MapComponentProps> = ({ onPolygonDrawn, selectedColor }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const [showBackground, setShowBackground] = useState(true);

  useEffect(() => {
    if (!mapRef.current) return;

    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        fill: new Fill({
          color: selectedColor + '40', // Add transparency
        }),
        stroke: new Stroke({
          color: selectedColor,
          width: 2,
        }),
      }),
    });

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
          visible: showBackground,
        }),
        vectorLayer,
      ],
      view: new View({
        center: [-5274570, -2533915], // Center on Brazil
        zoom: 8,
        maxZoom: 20,
      }),
    });

    const draw = new Draw({
      source: vectorSource,
      type: 'Polygon',
    });

    const modify = new Modify({ source: vectorSource });
    const snap = new Snap({ source: vectorSource });

    map.addInteraction(draw);
    map.addInteraction(modify);
    map.addInteraction(snap);

    draw.on('drawend', (event) => {
      const feature = event.feature;
      const geometry = feature.getGeometry() as Polygon;
      
      if (geometry) {
        const area = getArea(geometry);
        const perimeter = getLength(geometry);
        const coordinates = geometry.getCoordinates()[0];
        
        onPolygonDrawn(area, perimeter, coordinates);
      }
    });

    mapInstance.current = map;

    return () => {
      map.setTarget(undefined);
    };
  }, [onPolygonDrawn, selectedColor, showBackground]);

  const toggleBackground = () => {
    setShowBackground(!showBackground);
    if (mapInstance.current) {
      const layers = mapInstance.current.getLayers();
      const osmLayer = layers.item(0) as TileLayer<OSM>;
      osmLayer.setVisible(!showBackground);
    }
  };

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={toggleBackground}
          className="bg-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-50 transition-colors border"
        >
          {showBackground ? 'Remover Fundo' : 'Mostrar Fundo'}
        </button>
      </div>
      <div
        ref={mapRef}
        className="w-full h-96 border border-gray-300 rounded-lg"
        style={{ backgroundColor: showBackground ? 'transparent' : 'white' }}
      />
    </div>
  );
};

export default MapComponent;
