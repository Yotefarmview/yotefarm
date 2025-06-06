
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw, Modify, Snap, Select } from 'ol/interaction';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { Polygon } from 'ol/geom';
import { getArea, getLength } from 'ol/sphere';
import { Feature } from 'ol';
import { fromLonLat, toLonLat } from 'ol/proj';
import { boundingExtent } from 'ol/extent';
import * as turf from '@turf/turf';
import GeoJSON from 'ol/format/GeoJSON';
import 'ol/ol.css';

interface BlockData {
  id?: string;
  name: string;
  color: string;
  transparency: number;
  area_m2: number;
  area_acres: number;
  perimeter: number;
  coordinates: number[][];
}

interface AdvancedMapComponentProps {
  blocks: any[];
  selectedColor: string;
  transparency: number;
  showSatellite: boolean;
  showBackground: boolean;
  printMode: boolean;
  showNDVI: boolean;
  drawingMode: 'polygon' | 'edit' | 'delete' | null;
  onPolygonDrawn: (blockData: BlockData) => void;
  onBlockUpdate: (blockId: string, updates: Partial<BlockData>) => void;
  onBlockDelete: (blockId: string) => void;
  onBlockSelect: (block: any) => void;
  centerCoordinates?: [number, number];
  boundingBox?: [number, number, number, number];
}

const AdvancedMapComponent: React.FC<AdvancedMapComponentProps> = ({
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
  onBlockSelect,
  centerCoordinates,
  boundingBox
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const [currentDraw, setCurrentDraw] = useState<Draw | null>(null);
  const [currentModify, setCurrentModify] = useState<Modify | null>(null);
  const [currentSelect, setCurrentSelect] = useState<Select | null>(null);

  // Criar estilo para blocos com nome como legenda
  const createBlockStyle = useCallback((color: string, transparency: number, name?: string) => {
    return new Style({
      fill: new Fill({
        color: color + Math.round(transparency * 255).toString(16).padStart(2, '0'),
      }),
      stroke: new Stroke({
        color: color,
        width: 2,
      }),
      text: name ? new Text({
        text: name,
        font: 'bold 14px Arial, sans-serif',
        fill: new Fill({ color: '#000' }),
        stroke: new Stroke({ color: '#fff', width: 3 }),
        offsetY: 0,
        textAlign: 'center',
        textBaseline: 'middle',
      }) : undefined,
    });
  }, []);

  // Calcular área e perímetro usando Turf.js
  const calculatePolygonMetrics = useCallback((coordinates: number[][]) => {
    try {
      const polygon = turf.polygon([coordinates]);
      const area = turf.area(polygon); // em m²
      const perimeter = turf.length(polygon, { units: 'meters' }); // em metros
      const areaAcres = area * 0.000247105; // conversão para acres

      return {
        area_m2: Math.round(area * 100) / 100,
        area_acres: Math.round(areaAcres * 10000) / 10000,
        perimeter: Math.round(perimeter * 100) / 100
      };
    } catch (error) {
      console.error('Erro no cálculo de métricas:', error);
      return { area_m2: 0, area_acres: 0, perimeter: 0 };
    }
  }, []);

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current) return;

    const vectorSource = new VectorSource();
    
    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) => {
        const props = feature.getProperties();
        return createBlockStyle(
          props.color || selectedColor, 
          props.transparency || transparency,
          props.name
        );
      },
    });

    // Camada OSM
    const osmLayer = new TileLayer({
      source: new OSM(),
      visible: showBackground && !printMode,
    });

    // Camada Satélite
    const satelliteLayer = new TileLayer({
      source: new XYZ({
        url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        maxZoom: 20,
      }),
      visible: showSatellite && showBackground && !printMode,
    });

    // Camada NDVI
    const ndviLayer = new TileLayer({
      source: new XYZ({
        url: 'https://example.com/ndvi/{z}/{x}/{y}.png',
        maxZoom: 18,
      }),
      visible: showNDVI,
      opacity: 0.7,
    });

    const map = new Map({
      target: mapRef.current,
      layers: [osmLayer, satelliteLayer, ndviLayer, vectorLayer],
      view: new View({
        center: fromLonLat(centerCoordinates || [-47.8825, -15.7942]),
        zoom: 15,
        maxZoom: 22,
      }),
    });

    mapInstance.current = map;

    // Carregar blocos existentes
    blocks.forEach(block => {
      if (block.coordenadas) {
        try {
          const coordinates = Array.isArray(block.coordenadas) 
            ? block.coordenadas 
            : JSON.parse(block.coordenadas);
          
          const polygon = new Polygon([coordinates.map((coord: number[]) => fromLonLat(coord))]);
          const feature = new Feature({
            geometry: polygon,
            id: block.id,
            name: block.nome,
            color: block.cor,
            transparency: block.transparencia || 0.4,
            blockData: block
          });
          
          vectorSource.addFeature(feature);
        } catch (error) {
          console.error('Erro ao carregar bloco:', error);
        }
      }
    });

    return () => {
      map.setTarget(undefined);
    };
  }, [blocks, centerCoordinates]);

  // Atualizar visibilidade das camadas
  useEffect(() => {
    if (!mapInstance.current) return;

    const layers = mapInstance.current.getLayers().getArray();
    const osmLayer = layers[0] as TileLayer<OSM>;
    const satelliteLayer = layers[1] as TileLayer<XYZ>;
    const ndviLayer = layers[2] as TileLayer<XYZ>;

    if (osmLayer) {
      osmLayer.setVisible(!showSatellite && showBackground && !printMode);
    }
    if (satelliteLayer) {
      satelliteLayer.setVisible(showSatellite && showBackground && !printMode);
    }
    if (ndviLayer) {
      ndviLayer.setVisible(showNDVI);
    }

    // Modo impressão - fundo branco
    const mapElement = mapRef.current;
    if (mapElement) {
      if (printMode) {
        mapElement.style.backgroundColor = 'white';
      } else {
        mapElement.style.backgroundColor = 'transparent';
      }
    }
  }, [showSatellite, showBackground, printMode, showNDVI]);

  // Gerenciar interações baseadas no modo de desenho
  useEffect(() => {
    if (!mapInstance.current) return;

    const map = mapInstance.current;
    const vectorLayer = map.getLayers().item(3) as VectorLayer<VectorSource>;
    const vectorSource = vectorLayer.getSource()!;

    // Remover interações existentes
    if (currentDraw) {
      map.removeInteraction(currentDraw);
      setCurrentDraw(null);
    }
    if (currentModify) {
      map.removeInteraction(currentModify);
      setCurrentModify(null);
    }
    if (currentSelect) {
      map.removeInteraction(currentSelect);
      setCurrentSelect(null);
    }

    if (drawingMode === 'polygon') {
      // Modo desenho - polígonos livres com pontos ilimitados
      const draw = new Draw({
        source: vectorSource,
        type: 'Polygon',
        style: createBlockStyle(selectedColor, transparency),
        freehand: false, // Permite desenho ponto a ponto
      });

      const snap = new Snap({ source: vectorSource });

      draw.on('drawstart', (event) => {
        console.log('Iniciando desenho do polígono...');
      });

      draw.on('drawend', (event) => {
        const feature = event.feature;
        const geometry = feature.getGeometry() as Polygon;
        
        if (geometry) {
          const coordinates = geometry.getCoordinates()[0].map(coord => toLonLat(coord));
          // Remove o último ponto duplicado (fechamento do polígono)
          coordinates.pop();
          
          const metrics = calculatePolygonMetrics(coordinates);
          
          const blockData: BlockData = {
            name: `Bloco ${Date.now()}`,
            color: selectedColor,
            transparency,
            coordinates,
            ...metrics
          };

          feature.setProperties({
            name: blockData.name,
            color: blockData.color,
            transparency: blockData.transparency,
          });

          onPolygonDrawn(blockData);
        }
      });

      // Adicionar listener para duplo clique no mapa para finalizar desenho
      const handleDoubleClick = (event: any) => {
        if (draw.getActive()) {
          // Finalizar o desenho atual
          draw.finishDrawing();
        }
      };

      map.on('dblclick', handleDoubleClick);

      map.addInteraction(draw);
      map.addInteraction(snap);
      setCurrentDraw(draw);

      // Cleanup para remover o listener quando sair do modo desenho
      return () => {
        map.un('dblclick', handleDoubleClick);
      };

    } else if (drawingMode === 'edit') {
      // Modo edição
      const select = new Select({
        style: (feature) => {
          const props = feature.getProperties();
          return createBlockStyle(
            props.color || selectedColor, 
            props.transparency || transparency,
            props.name
          );
        }
      });
      
      const modify = new Modify({
        features: select.getFeatures(),
      });

      select.on('select', (event) => {
        const selectedFeatures = event.selected;
        if (selectedFeatures.length > 0) {
          const feature = selectedFeatures[0];
          const blockData = feature.get('blockData');
          if (blockData) {
            onBlockSelect(blockData);
          }
        }
      });

      modify.on('modifyend', (event) => {
        const features = event.features.getArray();
        features.forEach(feature => {
          const geometry = feature.getGeometry() as Polygon;
          const coordinates = geometry.getCoordinates()[0].map(coord => toLonLat(coord));
          // Remove o último ponto duplicado
          coordinates.pop();
          
          const metrics = calculatePolygonMetrics(coordinates);
          const blockId = feature.get('id');
          
          if (blockId) {
            onBlockUpdate(blockId, {
              coordinates,
              ...metrics
            });
          }
        });
      });

      map.addInteraction(select);
      map.addInteraction(modify);
      setCurrentSelect(select);
      setCurrentModify(modify);

    } else if (drawingMode === 'delete') {
      // Modo deletar
      const select = new Select({
        style: (feature) => {
          const props = feature.getProperties();
          return createBlockStyle(
            '#EF4444', // Vermelho para indicar seleção para deletar
            0.7,
            props.name
          );
        }
      });

      select.on('select', (event) => {
        const selectedFeatures = event.selected;
        if (selectedFeatures.length > 0) {
          const feature = selectedFeatures[0];
          const blockId = feature.get('id');
          const blockName = feature.get('name');
          
          if (blockId && confirm(`Tem certeza que deseja deletar o bloco "${blockName}"?`)) {
            vectorSource.removeFeature(feature);
            onBlockDelete(blockId);
          }
        }
        select.getFeatures().clear();
      });

      map.addInteraction(select);
      setCurrentSelect(select);
    }
  }, [drawingMode, selectedColor, transparency, onPolygonDrawn, onBlockUpdate, onBlockDelete, onBlockSelect, calculatePolygonMetrics, createBlockStyle]);

  // Centralizar mapa em coordenadas específicas
  useEffect(() => {
    if (!mapInstance.current || !centerCoordinates) return;

    const view = mapInstance.current.getView();
    view.animate({
      center: fromLonLat(centerCoordinates),
      zoom: boundingBox ? undefined : 15,
      duration: 1000,
    });

    if (boundingBox) {
      const extent_coords = [
        fromLonLat([boundingBox[2], boundingBox[0]]),
        fromLonLat([boundingBox[3], boundingBox[1]])
      ];
      view.fit(boundingExtent(extent_coords), { 
        padding: [50, 50, 50, 50],
        duration: 1000 
      });
    }
  }, [centerCoordinates, boundingBox]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full border border-gray-300 rounded-lg"
      style={{ 
        minHeight: '500px',
        backgroundColor: printMode ? 'white' : 'transparent' 
      }}
    />
  );
};

export default AdvancedMapComponent;
