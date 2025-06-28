
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
  blocks: any[];
  selectedColor: string;
  transparency: number;
  showSatellite: boolean;
  showBackground: boolean;
  printMode: boolean;
  showNDVI: boolean;
  drawingMode: 'polygon' | 'edit' | 'delete' | 'measure' | null;
  onPolygonDrawn: (blockData: any) => void;
  onBlockUpdate: (blockId: string, updates: any) => void;
  onBlockDelete: (blockId: string) => void;
  centerCoordinates?: [number, number];
  boundingBox?: [number, number, number, number];
}

const MapComponent: React.FC<MapComponentProps> = ({ 
  blocks,
  selectedColor,
  transparency,
  showSatellite,
  showBackground,
  printMode,
  showNDVI,
  drawingMode,
  onPolygonDrawn,
  onBlockUpdate,
  onBlockDelete,
  centerCoordinates,
  boundingBox
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const vectorSource = new VectorSource();
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: new Style({
        fill: new Fill({
          color: selectedColor + Math.round(transparency * 100).toString(16).padStart(2, '0'),
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

    if (drawingMode === 'polygon') {
      map.addInteraction(draw);
    }
    if (drawingMode === 'edit') {
      map.addInteraction(modify);
    }
    map.addInteraction(snap);

    draw.on('drawend', (event) => {
      const feature = event.feature;
      const geometry = feature.getGeometry() as Polygon;
      
      if (geometry) {
        const area = getArea(geometry);
        const perimeter = getLength(geometry);
        const coordinates = geometry.getCoordinates()[0];
        
        onPolygonDrawn({
          area_m2: area,
          area_acres: area * 0.000247105,
          perimeter,
          coordinates,
          cor: selectedColor
        });
      }
    });

    mapInstance.current = map;

    return () => {
      map.setTarget(undefined);
    };
  }, [selectedColor, transparency, showBackground, drawingMode, onPolygonDrawn]);

  // Update map center when coordinates change
  useEffect(() => {
    if (mapInstance.current && centerCoordinates) {
      const view = mapInstance.current.getView();
      view.setCenter(centerCoordinates);
      view.setZoom(15);
    }
  }, [centerCoordinates]);

  // Update map extent when bounding box changes
  useEffect(() => {
    if (mapInstance.current && boundingBox) {
      const view = mapInstance.current.getView();
      view.fit(boundingBox, { padding: [50, 50, 50, 50] });
    }
  }, [boundingBox]);

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="w-full h-96 border border-gray-300 rounded-lg"
        style={{ backgroundColor: showBackground ? 'transparent' : 'white' }}
      />
    </div>
  );
};

export default MapComponent;
