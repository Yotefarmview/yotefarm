
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select as UISelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, X, Edit2, Trash2 } from 'lucide-react';
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
  const vectorSource = useRef<VectorSource | null>(null);
  const [currentDraw, setCurrentDraw] = useState<Draw | null>(null);
  const [currentModify, setCurrentModify] = useState<Modify | null>(null);
  const [currentSelect, setCurrentSelect] = useState<Select | null>(null);
  const [editingBlock, setEditingBlock] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: '', color: '#10B981' });
  const [mapReady, setMapReady] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

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
  const createBlockStyle = useCallback((color: string, transparency: number, name?: string, area_acres?: number, isSelected?: boolean) => {
    const displayText = name ? `${name}\n${area_acres?.toFixed(4) || 0} acres` : '';
    
    return new Style({
      fill: new Fill({
        color: color + Math.round(transparency * 255).toString(16).padStart(2, '0'),
      }),
      stroke: new Stroke({
        color: isSelected ? '#FFD700' : color,
        width: isSelected ? 4 : 2,
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
  const updateFeatureStyle = useCallback((feature: Feature, name: string, color: string, area_acres?: number, isSelected?: boolean) => {
    const style = createBlockStyle(color, transparency, name, area_acres, isSelected);
    feature.setStyle(style);
    
    // Update feature properties
    feature.set('name', name);
    feature.set('color', color);
    feature.set('isSelected', isSelected);
    
    console.log(`Updated feature style - ID: ${feature.get('blockId')}, Name: ${name}, Color: ${color}, Selected: ${isSelected}`);
  }, [createBlockStyle, transparency]);

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    if (!vectorSource.current) return;
    
    vectorSource.current.getFeatures().forEach(feature => {
      const blockData = feature.get('blockData');
      updateFeatureStyle(
        feature, 
        blockData?.nome || feature.get('name') || '',
        blockData?.cor || feature.get('color') || '#10B981',
        blockData?.area_acres,
        false
      );
    });
    
    setSelectedFeature(null);
    setEditingBlock(null);
    setEditForm({ name: '', color: '#10B981' });
  }, [updateFeatureStyle]);

  // Handle block selection for editing
  const handleBlockClick = useCallback((feature: Feature) => {
    console.log('Block clicked:', feature.get('blockId'));
    
    // Clear previous selections
    clearAllSelections();
    
    const blockData = feature.get('blockData');
    const blockId = feature.get('blockId');
    
    if (blockData && blockId) {
      // Set this feature as selected
      setSelectedFeature(feature);
      setEditingBlock(blockData);
      setEditForm({
        name: blockData.nome || '',
        color: blockData.cor || '#10B981'
      });
      
      // Update style to show selection
      updateFeatureStyle(
        feature,
        blockData.nome || '',
        blockData.cor || '#10B981',
        blockData.area_acres,
        true
      );
      
      onBlockSelect(blockData);
      console.log('Block selected for editing:', blockId, blockData.nome);
    }
  }, [clearAllSelections, updateFeatureStyle, onBlockSelect]);

  // Handle save edit - only update the selected feature
  const handleSaveEdit = useCallback(() => {
    if (!editingBlock || !selectedFeature) {
      console.log('No editing block or selected feature');
      return;
    }

    const blockId = selectedFeature.get('blockId');
    console.log('Saving edit for block:', blockId, editForm);
    
    // Update the selected feature's style and properties
    updateFeatureStyle(
      selectedFeature,
      editForm.name,
      editForm.color,
      editingBlock.area_acres,
      false // Remove selection after save
    );
    
    // Update the blockData stored in the feature
    const updatedBlockData = {
      ...editingBlock,
      nome: editForm.name,
      cor: editForm.color
    };
    selectedFeature.set('blockData', updatedBlockData);
    
    // Update in parent component
    onBlockUpdate(blockId, {
      name: editForm.name,
      nome: editForm.name,
      color: editForm.color,
      cor: editForm.color
    });

    // Force refresh of vector source
    if (vectorSource.current) {
      vectorSource.current.changed();
    }

    // Clear selection
    setEditingBlock(null);
    setEditForm({ name: '', color: '#10B981' });
    setSelectedFeature(null);
  }, [editingBlock, selectedFeature, editForm, onBlockUpdate, updateFeatureStyle]);

  // Handle delete edit
  const handleDeleteEdit = useCallback(() => {
    if (!editingBlock || !selectedFeature) return;

    const blockId = selectedFeature.get('blockId');
    const blockName = editingBlock.nome || 'Bloco sem nome';
    
    if (confirm(`Tem certeza que deseja deletar o bloco "${blockName}"?`)) {
      // Remove from vector source
      if (vectorSource.current) {
        vectorSource.current.removeFeature(selectedFeature);
      }
      
      // Call parent delete function
      onBlockDelete(blockId);
      
      // Clear selection
      setEditingBlock(null);
      setEditForm({ name: '', color: '#10B981' });
      setSelectedFeature(null);
      
      console.log('Block deleted:', blockId);
    }
  }, [editingBlock, selectedFeature, onBlockDelete]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    clearAllSelections();
  }, [clearAllSelections]);

  // Inicializar mapa - uma única vez
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    console.log('Inicializando mapa...');

    try {
      // Criar VectorSource
      const newVectorSource = new VectorSource();
      vectorSource.current = newVectorSource;
      
      const vectorLayer = new VectorLayer({
        source: newVectorSource,
        style: (feature) => {
          if (!(feature instanceof Feature)) return undefined;
          
          const blockData = feature.get('blockData');
          const isSelected = feature.get('isSelected') || false;
          
          return createBlockStyle(
            blockData?.cor || feature.get('color') || selectedColor,
            transparency,
            blockData?.nome || feature.get('name'),
            blockData?.area_acres,
            isSelected
          );
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
        layers: [osmLayer, satelliteLayer, ndviLayer, vectorLayer],
        view: new View({
          center: fromLonLat(defaultCenter),
          zoom: 10,
          maxZoom: 22,
        }),
      });

      // Add click event for block selection
      map.on('click', (event) => {
        const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => {
          return feature instanceof Feature ? feature : null;
        });
        
        if (feature && feature.get('blockData')) {
          handleBlockClick(feature);
        } else {
          // Clicked on empty area, clear selection
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
          feature.set('transparency', block.transparencia || 0.4);
          feature.set('blockData', block);
          feature.set('isSelected', false);
          
          console.log('Adding block to map:', block.id, block.nome);
          
          vectorSource.current!.addFeature(feature);
        } catch (error) {
          console.error('Erro ao carregar bloco:', error);
        }
      }
    });
  }, [blocks, mapReady]);

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

          console.log('New block drawn:', uniqueId, blockData.name);

          onPolygonDrawn(blockData);
        }
      });

      map.addInteraction(draw);
      map.addInteraction(snap);
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
            handleBlockClick(feature);
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
              metrics.area_acres,
              feature.get('isSelected') || false
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
  }, [drawingMode, selectedColor, transparency, onPolygonDrawn, onBlockUpdate, onBlockDelete, calculatePolygonMetrics, createBlockStyle, handleBlockClick, updateFeatureStyle]);

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
    <div className="relative w-full h-full">
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
        className="w-full h-full border border-gray-300 rounded-lg"
        style={{ 
          minHeight: '500px',
          backgroundColor: printMode ? 'white' : 'transparent' 
        }}
      />
      
      {/* Quick Edit Panel */}
      {editingBlock && selectedFeature && (
        <div className="absolute top-4 right-4 z-50">
          <Card className="w-80 bg-white shadow-lg border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Edit2 className="w-5 h-5" />
                Edição Rápida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="quick-edit-name">Nome do Bloco</Label>
                <Input
                  id="quick-edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  placeholder="Digite o nome do bloco"
                />
              </div>
              
              <div>
                <Label htmlFor="quick-edit-color">Cor do Bloco</Label>
                <UISelect 
                  value={editForm.color} 
                  onValueChange={(value) => setEditForm({...editForm, color: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-50">
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-300"
                            style={{ backgroundColor: color.value }}
                          />
                          <div>
                            <span className="font-medium">{color.label}</span>
                            <span className="text-xs text-gray-500 ml-2">{color.name}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </UISelect>
              </div>

              {/* Display block metrics - only acres */}
              {editingBlock && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">Dados do Bloco</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="text-green-700">ID:</span>
                      <p className="font-medium text-xs">{selectedFeature.get('blockId')}</p>
                    </div>
                    <div>
                      <span className="text-green-700">Área:</span>
                      <p className="font-medium">{editingBlock.area_acres?.toFixed(4) || 0} acres</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleSaveEdit}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button 
                  onClick={handleDeleteEdit}
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Deletar
                </Button>
                <Button 
                  onClick={handleCancelEdit}
                  variant="outline"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-xs text-gray-500 pt-2">
                <strong>Dica:</strong> Clique em qualquer bloco no mapa para editar rapidamente seu nome e cor.
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdvancedMapComponent;
