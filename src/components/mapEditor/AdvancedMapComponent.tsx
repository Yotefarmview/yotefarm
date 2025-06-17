import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw, Modify, Snap, Select } from 'ol/interaction';
import { Fill, Stroke, Style, Text } from 'ol/style';
import { Polygon, LineString } from 'ol/geom';
import { getArea, getLength } from 'ol/sphere';
import { Feature } from 'ol';
import { fromLonLat, toLonLat } from 'ol/proj';
import { boundingExtent } from 'ol/extent';
import * as turf from '@turf/turf';
import GeoJSON from 'ol/format/GeoJSON';
import { unByKey } from 'ol/Observable';
import Overlay from 'ol/Overlay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare } from 'lucide-react';
import 'ol/ol.css';

interface BlockData {
  id?: string;
  name: string;
  nome?: string;
  color: string;
  cor?: string;
  transparency: number;
  area_m2: number;
  area_acres: number;
  perimeter: number;
  coordinates: number[][];
}

interface MeasurementData {
  id?: string;
  name: string;
  distance: number;
  coordinates: number[][];
  isDrain: boolean;
}

interface AdvancedMapComponentProps {
  blocks: any[];
  selectedColor: string;
  transparency: number;
  showSatellite: boolean;
  showBackground: boolean;
  printMode: boolean;
  showNDVI: boolean;
  drawingMode: 'polygon' | 'edit' | 'delete' | 'measure' | 'multiselect' | null;
  onPolygonDrawn: (blockData: BlockData) => void;
  onBlockUpdate: (blockId: string, updates: Partial<BlockData>) => void;
  onBlockDelete: (blockId: string) => void;
  onBlockSelect: (block: any) => void;
  centerCoordinates?: [number, number];
  boundingBox?: [number, number, number, number];
  selectedBlocks?: Set<string>;
  totalSelectedArea?: number;
  onMultiSelectChange?: (selectedBlocks: Set<string>, totalArea: number) => void;
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
  boundingBox,
  selectedBlocks: externalSelectedBlocks = new Set(),
  totalSelectedArea: externalTotalArea = 0,
  onMultiSelectChange
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const vectorSource = useRef<VectorSource | null>(null);
  const measurementSource = useRef<VectorSource | null>(null);
  const measureTooltipElement = useRef<HTMLDivElement | null>(null);
  const measureTooltip = useRef<any>(null);
  const [currentDraw, setCurrentDraw] = useState<Draw | null>(null);
  const [currentModify, setCurrentModify] = useState<Modify | null>(null);
  const [currentSelect, setCurrentSelect] = useState<Select | null>(null);
  const [mapReady, setMapReady] = useState(false);
  
  // Measurement states
  const [measurements, setMeasurements] = useState<MeasurementData[]>([]);

  // Multi-select states (use external or internal)
  const [internalSelectedBlocks, setInternalSelectedBlocks] = useState<Set<string>>(new Set());
  const [internalTotalArea, setInternalTotalArea] = useState(0);
  
  const selectedBlocks = externalSelectedBlocks.size > 0 ? externalSelectedBlocks : internalSelectedBlocks;
  const totalSelectedArea = externalTotalArea > 0 ? externalTotalArea : internalTotalArea;

  // Color options for blocks
  const colorOptions = [
    { value: '#10B981', label: 'Verde', name: 'Plantado' },
    { value: '#F59E0B', label: 'Amarelo', name: 'Maduro' },
    { value: '#EF4444', label: 'Vermelho', name: 'Problemas' },
    { value: '#F97316', label: 'Laranja', name: 'Colhendo' },
    { value: '#8B5CF6', label: 'Roxo', name: 'Aplicação' },
    { value: '#FFFFFF', label: 'Branco', name: 'Vazio' },
    { value: '#3B82F6', label: 'Azul', name: 'Irrigação' },
    { value: '#EC4899', label: 'Rosa', name: 'Teste' },
    { value: '#06B6D4', label: 'Turquesa', name: 'Dreno' }
  ];

  // Criar estilo para blocos com nome como legenda e área (apenas acres)
  const createBlockStyle = useCallback((color: string, transparency: number, name?: string, area_acres?: number, isSelected?: boolean, isMultiSelected?: boolean) => {
    const displayText = name ? `${name}\n${area_acres?.toFixed(4) || 0} acres` : '';
    
    // Convert transparency to alpha correctly - transparency 0 = fully opaque, transparency 1 = fully transparent
    const alpha = Math.round((1 - transparency) * 255).toString(16).padStart(2, '0');
    
    // Different colors for different selection states
    let strokeColor = color;
    let strokeWidth = 2;
    
    if (isMultiSelected) {
      strokeColor = '#00FF00'; // Green for multi-selected
      strokeWidth = 4;
    } else if (isSelected) {
      strokeColor = '#FFD700'; // Gold for single selected
      strokeWidth = 4;
    }
    
    return new Style({
      fill: new Fill({
        color: color + alpha,
      }),
      stroke: new Stroke({
        color: strokeColor,
        width: strokeWidth,
      }),
      text: displayText ? new Text({
        text: displayText,
        font: 'bold 12px Arial, sans-serif',
        fill: new Fill({ color: '#000' }),
        stroke: new Stroke({ color: '#fff', width: 3 }),
        offsetY: 0,
        textAlign: 'center',
        textBaseline: 'middle',
      }) : undefined,
    });
  }, []);

  // Criar estilo para medições
  const createMeasurementStyle = useCallback((measurement: MeasurementData, isSelected?: boolean) => {
    const color = measurement.isDrain ? '#3B82F6' : '#FF6B35';
    const distanceInFt = measurement.distance * 3.28084; // Convert meters to feet
    const displayText = `${measurement.name}\n${distanceInFt.toFixed(2)}ft`;
    
    return new Style({
      stroke: new Stroke({
        color: isSelected ? '#FFD700' : color,
        width: isSelected ? 4 : 3,
        lineDash: measurement.isDrain ? [10, 5] : undefined,
      }),
      text: new Text({
        text: displayText,
        font: 'bold 12px Arial, sans-serif',
        fill: new Fill({ color: '#000' }),
        stroke: new Stroke({ color: '#fff', width: 3 }),
        offsetY: -10,
        textAlign: 'center',
        textBaseline: 'middle',
      }),
    });
  }, []);

  // Calcular área e perímetro usando Turf.js
  const calculatePolygonMetrics = useCallback((coordinates: number[][]) => {
    try {
      // Ensure the polygon is closed by making sure first and last coordinates are the same
      const closedCoordinates = [...coordinates];
      if (closedCoordinates.length > 0) {
        const first = closedCoordinates[0];
        const last = closedCoordinates[closedCoordinates.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          closedCoordinates.push([...first]);
        }
      }

      const polygon = turf.polygon([closedCoordinates]);
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

  // Find feature by block ID
  const findFeatureByBlockId = useCallback((blockId: string): Feature | null => {
    if (!vectorSource.current) return null;
    
    const features = vectorSource.current.getFeatures();
    return features.find(f => f.get('blockId') === blockId) || null;
  }, []);

  // Update specific feature style and properties
  const updateFeatureStyle = useCallback((feature: Feature, name: string, color: string, transparency: number, area_acres?: number, isSelected?: boolean, isMultiSelected?: boolean) => {
    const style = createBlockStyle(color, transparency, name, area_acres, isSelected, isMultiSelected);
    feature.setStyle(style);
    
    // Update feature properties
    feature.set('name', name);
    feature.set('color', color);
    feature.set('transparency', transparency);
    feature.set('isSelected', isSelected);
    feature.set('isMultiSelected', isMultiSelected);
    
    console.log(`Updated feature style - ID: ${feature.get('blockId')}, Name: ${name}, Multi-selected: ${isMultiSelected}`);
  }, [createBlockStyle]);

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    if (!vectorSource.current) return;
    
    vectorSource.current.getFeatures().forEach(feature => {
      const blockData = feature.get('blockData');
      updateFeatureStyle(
        feature, 
        blockData?.nome || feature.get('name') || '',
        blockData?.cor || feature.get('color') || '#10B981',
        blockData?.transparencia !== undefined ? blockData.transparencia : transparency,
        blockData?.area_acres,
        false,
        false
      );
    });

    const newSelectedBlocks = new Set<string>();
    const newTotalArea = 0;
    
    if (onMultiSelectChange) {
      onMultiSelectChange(newSelectedBlocks, newTotalArea);
    } else {
      setInternalSelectedBlocks(newSelectedBlocks);
      setInternalTotalArea(newTotalArea);
    }
  }, [updateFeatureStyle, transparency, onMultiSelectChange]);

  // Handle multi-selection
  const handleMultiSelect = useCallback((feature: Feature) => {
    const blockId = feature.get('blockId');
    const blockData = feature.get('blockData');
    
    if (!blockId || !blockData) return;

    const newSelectedBlocks = new Set(selectedBlocks);
    
    if (newSelectedBlocks.has(blockId)) {
      // Remove from selection
      newSelectedBlocks.delete(blockId);
      updateFeatureStyle(
        feature,
        blockData.nome || '',
        blockData.cor || '#10B981',
        blockData.transparencia || 0.4,
        blockData.area_acres,
        false,
        false
      );
    } else {
      // Add to selection
      newSelectedBlocks.add(blockId);
      updateFeatureStyle(
        feature,
        blockData.nome || '',
        blockData.cor || '#10B981',
        blockData.transparencia || 0.4,
        blockData.area_acres,
        false,
        true
      );
    }
    
    // Calculate total area
    let totalArea = 0;
    vectorSource.current?.getFeatures().forEach(f => {
      const fBlockId = f.get('blockId');
      const fBlockData = f.get('blockData');
      if (newSelectedBlocks.has(fBlockId) && fBlockData?.area_acres) {
        totalArea += fBlockData.area_acres;
      }
    });

    if (onMultiSelectChange) {
      onMultiSelectChange(newSelectedBlocks, totalArea);
    } else {
      setInternalSelectedBlocks(newSelectedBlocks);
      setInternalTotalArea(totalArea);
    }
  }, [selectedBlocks, updateFeatureStyle, onMultiSelectChange]);

  // Handle block selection for editing
  const handleBlockClick = useCallback((feature: Feature) => {
    if (drawingMode === 'multiselect') {
      handleMultiSelect(feature);
    } else {
      // Single select mode (existing functionality)
      clearAllSelections();
      onBlockSelect(feature.get('blockData'));
    }
  }, [drawingMode, handleMultiSelect, clearAllSelections, onBlockSelect]);

  // Create measurement tooltip
  const createMeasureTooltip = useCallback(() => {
    if (measureTooltipElement.current) {
      measureTooltipElement.current.parentNode?.removeChild(measureTooltipElement.current);
    }
    
    measureTooltipElement.current = document.createElement('div');
    measureTooltipElement.current.className = 'ol-tooltip ol-tooltip-measure';
    measureTooltipElement.current.style.cssText = `
      position: absolute;
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      white-space: nowrap;
      pointer-events: none;
      z-index: 1000;
    `;
    
    if (mapInstance.current) {
      const overlay = new Overlay({
        element: measureTooltipElement.current,
        offset: [0, -15],
        positioning: 'bottom-center',
      });
      mapInstance.current.addOverlay(overlay);
      measureTooltip.current = overlay;
    }
  }, []);

  // Format length for display - always in feet
  const formatLength = useCallback((line: LineString) => {
    const lengthInMeters = getLength(line);
    const lengthInFt = lengthInMeters * 3.28084; // Convert meters to feet
    return Math.round(lengthInFt * 100) / 100 + ' ft';
  }, []);

  // Inicializar mapa - uma única vez
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    console.log('Inicializando mapa...');

    try {
      // Criar VectorSources
      const newVectorSource = new VectorSource();
      const newMeasurementSource = new VectorSource();
      vectorSource.current = newVectorSource;
      measurementSource.current = newMeasurementSource;
      
      const vectorLayer = new VectorLayer({
        source: newVectorSource,
        style: (feature) => {
          if (!(feature instanceof Feature)) return undefined;
          
          const blockData = feature.get('blockData');
          const isSelected = feature.get('isSelected') || false;
          const isMultiSelected = feature.get('isMultiSelected') || false;
          
          return createBlockStyle(
            blockData?.cor || feature.get('color') || selectedColor,
            blockData?.transparencia !== undefined ? blockData.transparencia : feature.get('transparency') || transparency,
            blockData?.nome || feature.get('name'),
            blockData?.area_acres,
            isSelected,
            isMultiSelected
          );
        },
      });

      const measurementLayer = new VectorLayer({
        source: newMeasurementSource,
        style: (feature) => {
          if (!(feature instanceof Feature)) return undefined;
          const measurementData = feature.get('measurementData');
          return measurementData ? createMeasurementStyle(measurementData) : undefined;
        },
      });

      // Camadas de fundo
      const osmLayer = new TileLayer({
        source: new OSM(),
        visible: showBackground && !showSatellite && !printMode,
      });

      const satelliteLayer = new TileLayer({
        source: new XYZ({
          url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
          maxZoom: 20,
        }),
        visible: showSatellite && showBackground && !printMode,
      });

      const ndviLayer = new TileLayer({
        source: new XYZ({
          url: 'https://example.com/ndvi/{z}/{x}/{y}.png',
          maxZoom: 18,
        }),
        visible: showNDVI,
        opacity: 0.7,
      });

      // Usar coordenadas default para Brasil se não tiver centerCoordinates
      const defaultCenter = centerCoordinates || [-47.8825, -15.7942];
      
      const map = new Map({
        target: mapRef.current,
        layers: [osmLayer, satelliteLayer, ndviLayer, vectorLayer, measurementLayer],
        view: new View({
          center: fromLonLat(defaultCenter),
          zoom: 10,
          maxZoom: 22,
        }),
      });

      // Add click event for feature selection with Ctrl key support
      map.on('click', (event) => {
        const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => {
          return feature instanceof Feature ? feature : null;
        });
        
        if (feature) {
          if (feature.get('blockData')) {
            event.preventDefault();
            handleBlockClick(feature);
          }
        } else {
          clearAllSelections();
        }
      });

      mapInstance.current = map;

      // Aguardar renderização completa
      map.once('rendercomplete', () => {
        console.log('Mapa renderizado com sucesso');
        setMapReady(true);
      });

      console.log('Mapa criado com sucesso');

      return () => {
        if (mapInstance.current) {
          mapInstance.current.setTarget(undefined);
          mapInstance.current = null;
        }
        vectorSource.current = null;
        measurementSource.current = null;
        setMapReady(false);
      };
    } catch (error) {
      console.error('Erro ao inicializar mapa:', error);
    }
  }, []);

  // Carregar blocos existentes
  useEffect(() => {
    if (!vectorSource.current || !mapReady) return;

    console.log('Carregando blocos:', blocks.length);

    // Limpar blocos existentes
    vectorSource.current.clear();

    // Carregar novos blocos
    blocks.forEach(block => {
      if (block.coordenadas) {
        try {
          let coordinates;
          if (typeof block.coordenadas === 'string') {
            coordinates = JSON.parse(block.coordenadas);
          } else if (Array.isArray(block.coordenadas)) {
            coordinates = block.coordenadas;
          } else {
            coordinates = [];
          }
          
          const polygon = new Polygon([coordinates.map((coord: number[]) => fromLonLat(coord))]);
          const feature = new Feature({
            geometry: polygon
          });
          
          // Set unique properties for this feature
          feature.set('blockId', block.id);
          feature.set('name', block.nome);
          feature.set('color', block.cor);
          feature.set('transparency', block.transparencia !== undefined ? block.transparencia : transparency);
          feature.set('blockData', block);
          feature.set('isSelected', false);
          feature.set('isMultiSelected', false);
          
          console.log('Adding block to map:', block.id, block.nome, 'transparency:', block.transparencia !== undefined ? block.transparencia : transparency);
          
          vectorSource.current!.addFeature(feature);
        } catch (error) {
          console.error('Erro ao carregar bloco:', error);
        }
      }
    });
  }, [blocks, mapReady, transparency]);

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
    if (!mapInstance.current || !vectorSource.current) return;

    const map = mapInstance.current;

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
        source: vectorSource.current,
        type: 'Polygon',
        style: createBlockStyle(selectedColor, transparency),
        freehand: false,
      });

      const snap = new Snap({ source: vectorSource.current });

      draw.on('drawend', (event) => {
        const feature = event.feature;
        const geometry = feature.getGeometry() as Polygon;
        
        if (geometry) {
          const coordinates = geometry.getCoordinates()[0].map(coord => toLonLat(coord));
          coordinates.pop(); // Remove o último ponto duplicado
          
          const metrics = calculatePolygonMetrics(coordinates);
          
          const blockData: BlockData = {
            name: `Bloco ${Date.now()}`,
            color: selectedColor,
            transparency,
            coordinates,
            ...metrics
          };

          // Set unique properties for this new feature
          const uniqueId = `temp_${Date.now()}`;
          feature.set('blockId', uniqueId);
          feature.set('name', blockData.name);
          feature.set('color', blockData.color);
          feature.set('transparency', blockData.transparency);
          feature.set('blockData', blockData);
          feature.set('isSelected', false);
          feature.set('isMultiSelected', false);

          console.log('New block drawn:', uniqueId, blockData.name);

          onPolygonDrawn(blockData);
        }
      });

      map.addInteraction(draw);
      map.addInteraction(snap);
      setCurrentDraw(draw);

    } else if (drawingMode === 'measure') {
      // Modo medição - linhas retas
      const draw = new Draw({
        source: measurementSource.current!,
        type: 'LineString',
        style: new Style({
          stroke: new Stroke({
            color: '#FF6B35',
            width: 3,
          }),
        }),
      });

      createMeasureTooltip();

      let sketch: Feature | null = null;
      let listener: any = null;

      draw.on('drawstart', (event) => {
        sketch = event.feature;
        
        listener = sketch?.getGeometry()?.on('change', (evt) => {
          const geom = evt.target as LineString;
          const tooltipCoord = geom.getLastCoordinate();
          
          if (measureTooltipElement.current && measureTooltip.current) {
            measureTooltipElement.current.innerHTML = formatLength(geom);
            measureTooltip.current.setPosition(tooltipCoord);
          }
        });
      });

      draw.on('drawend', (event) => {
        const feature = event.feature;
        const geometry = feature.getGeometry() as LineString;
        
        // Clear the tooltip
        if (measureTooltipElement.current) {
          measureTooltipElement.current.className = 'ol-tooltip ol-tooltip-static';
        }
        
        // Unregister the sketch listener
        if (listener) {
          unByKey(listener);
        }
        
        if (geometry) {
          const coordinates = geometry.getCoordinates().map(coord => toLonLat(coord));
          const distance = getLength(geometry);
          
          const measurementData: MeasurementData = {
            id: `measure_${Date.now()}`,
            name: `Medição ${measurements.length + 1}`,
            distance,
            coordinates,
            isDrain: false
          };

          // Set properties for this new feature
          feature.set('measurementId', measurementData.id);
          feature.set('measurementData', measurementData);
          feature.setStyle(createMeasurementStyle(measurementData));

          // Add to measurements array
          setMeasurements(prev => [...prev, measurementData]);

          // Open edit form
          // Removed editingMeasurement and measurementForm states and UI per refactor instructions

          console.log('New measurement created:', measurementData);
        }

        // Create new tooltip for next measurement
        setTimeout(() => {
          createMeasureTooltip();
        }, 100);
      });

      map.addInteraction(draw);
      setCurrentDraw(draw);

    } else if (drawingMode === 'edit') {
      // Modo edição
      const select = new Select({
        style: (feature) => {
          if (!(feature instanceof Feature)) return undefined;
          const blockData = feature.get('blockData');
          return createBlockStyle(
            blockData?.cor || feature.get('color') || selectedColor,
            transparency,
            blockData?.nome || feature.get('name'),
            blockData?.area_acres,
            true
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
          if (feature instanceof Feature && feature.get('blockData')) {
            clearAllSelections();
            onBlockSelect(feature.get('blockData'));
            updateFeatureStyle(
              feature,
              feature.get('blockData').nome || '',
              feature.get('blockData').cor || '#10B981',
              feature.get('blockData').transparencia || 0.4,
              feature.get('blockData').area_acres,
              true,
              false
            );
          }
        }
      });

      modify.on('modifyend', (event) => {
        const features = event.features.getArray();
        features.forEach(feature => {
          if (!(feature instanceof Feature)) return;
          
          const geometry = feature.getGeometry() as Polygon;
          const coordinates = geometry.getCoordinates()[0].map(coord => toLonLat(coord));
          coordinates.pop(); // Remove o último ponto duplicado
          
          const metrics = calculatePolygonMetrics(coordinates);
          const blockId = feature.get('blockId');
          
          if (blockId) {
            // Update feature properties
            const updatedBlockData = {
              ...feature.get('blockData'),
              ...metrics
            };
            feature.set('blockData', updatedBlockData);

            // Update style with new area
            const blockData = feature.get('blockData');
            updateFeatureStyle(
              feature,
              blockData?.nome || feature.get('name') || '',
              blockData?.cor || feature.get('color') || selectedColor,
              blockData?.transparencia !== undefined ? blockData.transparencia : transparency,
              blockData?.area_acres,
              feature.get('isSelected') || false,
              feature.get('isMultiSelected') || false
            );

            onBlockUpdate(blockId, {
              coordinates,
              ...metrics
            });
            
            console.log('Block modified:', blockId, metrics);
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
          if (!(feature instanceof Feature)) return undefined;
          const blockData = feature.get('blockData');
          return createBlockStyle(
            '#EF4444', // Vermelho para indicar seleção para deletar
            0.7,
            blockData?.nome || feature.get('name'),
            blockData?.area_acres
          );
        }
      });

      select.on('select', (event) => {
        const selectedFeatures = event.selected;
        if (selectedFeatures.length > 0) {
          const feature = selectedFeatures[0];
          if (!(feature instanceof Feature)) return;
          
          const blockId = feature.get('blockId');
          const blockName = feature.get('name');
          
          if (blockId && confirm(`Tem certeza que deseja deletar o bloco "${blockName}"?`)) {
            vectorSource.current!.removeFeature(feature);
            onBlockDelete(blockId);
            console.log('Block deleted via delete mode:', blockId);
          }
        }
        select.getFeatures().clear();
      });

      map.addInteraction(select);
      setCurrentSelect(select);
    }
  }, [drawingMode, selectedColor, transparency, onPolygonDrawn, onBlockUpdate, onBlockDelete, calculatePolygonMetrics, createBlockStyle, handleBlockClick, updateFeatureStyle, createMeasurementStyle, measurements.length, createMeasureTooltip, formatLength, clearAllSelections, onBlockSelect]);

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

  // Multi-selection summary panel
  const multiSelectPanel = selectedBlocks.size > 0 && drawingMode === 'multiselect' && (
    <div className="w-full mt-4">
      <Card className="bg-white shadow-lg border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-green-600" />
            Blocos Selecionados ({selectedBlocks.size})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-center">
              <p className="text-sm text-green-700 mb-1">Área Total Selecionada</p>
              <p className="text-2xl font-bold text-green-900">
                {totalSelectedArea.toFixed(4)} acres
              </p>
            </div>
          </div>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {Array.from(selectedBlocks).map(blockId => {
              const feature = findFeatureByBlockId(blockId);
              const blockData = feature?.get('blockData');
              return (
                <div key={blockId} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span className="font-medium truncate flex-1">
                    {blockData?.nome || 'Sem nome'}
                  </span>
                  <span className="text-gray-600 ml-2">
                    {blockData?.area_acres?.toFixed(4) || 0} acres
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-xs text-gray-500 pt-2">
            <strong>Dica:</strong> Clique nos blocos do mapa para selecionar/desmarcar.
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Update all existing blocks when global transparency changes
  useEffect(() => {
    if (!vectorSource.current || !mapReady) return;

    console.log('Updating transparency for all blocks:', transparency);
    
    vectorSource.current.getFeatures().forEach(feature => {
      const blockData = feature.get('blockData');
      // Only update blocks that don't have their own custom transparency
      if (blockData && blockData.transparencia === undefined) {
        updateFeatureStyle(
          feature,
          blockData.nome || feature.get('name') || '',
          blockData.cor || feature.get('color') || selectedColor,
          transparency, // Use global transparency
          blockData.area_acres,
          feature.get('isSelected') || false,
          feature.get('isMultiSelected') || false
        );
      }
    });
  }, [transparency, selectedColor, mapReady, updateFeatureStyle]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Carregando mapa...</p>
          </div>
        </div>
      )}
      
      <div
        ref={mapRef}
        className="w-full h-full border border-gray-300 rounded-lg flex-1"
        style={{ 
          minHeight: '500px',
          backgroundColor: printMode ? 'white' : 'transparent' 
        }}
      />
      
      {multiSelectPanel}
    </div>
  );
};

export default AdvancedMapComponent;
