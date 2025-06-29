
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { EditControl } from 'react-leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { v4 as uuidv4 } from 'uuid';
import { 
  Map, 
  Satellite, 
  Square, 
  Edit3, 
  Trash2, 
  Layers, 
  Target, 
  Printer 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast"
import * as L from 'leaflet';

import ColorFilterDropdown from './ColorFilterDropdown';

interface MapBlock {
  id: string;
  polygon: number[][];
  color: string;
  transparency: number;
}

interface AdvancedMapComponentProps {
  blocks?: any[];
  selectedColor?: string;
  transparency?: number;
  showSatellite?: boolean;
  showBackground?: boolean;
  printMode?: boolean;
  showNDVI?: boolean;
  drawingMode?: 'polygon' | 'edit' | 'delete' | null;
  onPolygonDrawn?: (blockData: any) => void;
  onBlockUpdate?: (blockId: string, updates: any) => void;
  onBlockDelete?: (blockId: string) => void;
  onBlockSelect?: (block: any) => void;
  centerCoordinates?: [number, number];
  boundingBox?: [number, number, number, number];
  fazendaId?: string;
  onBlocksChange?: (blocks: MapBlock[]) => void;
}

const AdvancedMapComponent: React.FC<AdvancedMapComponentProps> = ({
  blocks: externalBlocks = [],
  selectedColor = '#10B981',
  transparency = 0.2,
  showSatellite = false,
  showBackground = true,
  printMode = false,
  showNDVI = false,
  drawingMode = null,
  onPolygonDrawn,
  onBlockUpdate,
  onBlockDelete,
  onBlockSelect,
  centerCoordinates,
  boundingBox,
  fazendaId = 'default',
  onBlocksChange
}) => {
  const [blocks, setBlocks] = useState<MapBlock[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-23.5505, -46.6333]); // São Paulo coordinates
  const [visibleColors, setVisibleColors] = useState<string[]>([]);
  const mapRef = useRef<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const { toast } = useToast()

  // Load initial blocks from localStorage on component mount
  useEffect(() => {
    const storedBlocks = localStorage.getItem(`mapBlocks-${fazendaId}`);
    if (storedBlocks) {
      setBlocks(JSON.parse(storedBlocks));
    }
  }, [fazendaId]);

  // Save blocks to localStorage whenever blocks change
  useEffect(() => {
    localStorage.setItem(`mapBlocks-${fazendaId}`, JSON.stringify(blocks));
    if (onBlocksChange) {
      onBlocksChange(blocks);
    }
  }, [blocks, fazendaId, onBlocksChange]);

  const onCreate = (e: any) => {
    const { layerType, layer } = e;

    if (layerType === 'polygon') {
      const polygon = layer.getLatLngs()[0].map((latlng: any) => [latlng.lat, latlng.lng]);
      const newBlock: MapBlock = {
        id: uuidv4(),
        polygon: polygon,
        color: selectedColor,
        transparency: transparency,
      };
      setBlocks([...blocks, newBlock]);
      
      if (onPolygonDrawn) {
        onPolygonDrawn({
          coordinates: polygon,
          color: selectedColor,
          transparency: transparency
        });
      }
    }
  };

  const onEdited = (e: any) => {
    const { layers } = e;
    layers.eachLayer((layer: any) => {
      const id = layer.feature ? layer.feature.properties.id : null;
      if (id) {
        const polygon = layer.getLatLngs()[0].map((latlng: any) => [latlng.lat, latlng.lng]);
        setBlocks(prevBlocks =>
          prevBlocks.map(block =>
            block.id === id ? { ...block, polygon: polygon } : block
          )
        );
        
        if (onBlockUpdate) {
          onBlockUpdate(id, { coordinates: polygon });
        }
      }
    });
  };

  const onDeleted = (e: any) => {
    const { layers } = e;
    layers.eachLayer((layer: any) => {
      const id = layer.feature ? layer.feature.properties.id : null;
      if (id) {
        setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== id));
        
        if (onBlockDelete) {
          onBlockDelete(id);
        }
      }
    });
  };

  const onFeatureGroupReady = (reactFGref: any) => {
    if (featureGroupRef) {
      featureGroupRef.current = reactFGref;
    }
  };

  const centerMapOnBlocks = () => {
    if (!mapRef.current) return;

    if (blocks.length === 0) {
      // If there are no blocks, center the map on São Paulo
      mapRef.current.setView([-23.5505, -46.6333], 10);
      setMapCenter([-23.5505, -46.6333]);
      toast({
        title: "Mapa Centralizado",
        description: "Mapa centralizado na localização padrão.",
      })
      return;
    }

    // Create a LatLngBounds object to encompass all polygons
    const bounds = new L.LatLngBounds([]);

    blocks.forEach(block => {
      const latLngs = block.polygon.map(coord => new L.LatLng(coord[0], coord[1]));
      bounds.extend(latLngs);
    });

    // Fit the map view to the bounds
    mapRef.current.fitBounds(bounds);
    setMapCenter([bounds.getCenter().lat, bounds.getCenter().lng]);
    toast({
      title: "Mapa Centralizado",
      description: "Mapa centralizado nos blocos desenhados.",
    })
  };

  const MapContext = () => {
    const map = useMap();
    useEffect(() => {
      mapRef.current = map;
    }, [map]);
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Menu Superior */}
      <div className="bg-white border-b border-gray-200 p-4 flex flex-wrap items-center gap-2">
        <Button
          variant={drawingMode === 'polygon' ? "default" : "outline"}
          size="sm"
          onClick={() => {}}
          className="flex items-center gap-2"
        >
          <Square className="w-4 h-4" />
          Desenhar
        </Button>

        <ColorFilterDropdown
          visibleColors={visibleColors}
          onColorVisibilityChange={setVisibleColors}
        />

        <Button
          variant={drawingMode === 'edit' ? "default" : "outline"}
          size="sm"
          onClick={() => {}}
          className="flex items-center gap-2"
        >
          <Edit3 className="w-4 h-4" />
          Editar
        </Button>

        <Button
          variant={drawingMode === 'delete' ? "destructive" : "outline"}
          size="sm"
          onClick={() => {}}
          className="flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Deletar
        </Button>

        <div className="h-6 w-px bg-gray-300 mx-2" />

        <Button
          variant={showSatellite ? "default" : "outline"}
          size="sm"
          onClick={() => {}}
          className="flex items-center gap-2"
        >
          {showSatellite ? <Satellite className="w-4 h-4" /> : <Map className="w-4 h-4" />}
          {showSatellite ? 'Satélite' : 'Mapa'}
        </Button>

        <Button
          variant={showNDVI ? "default" : "outline"}
          size="sm"
          onClick={() => {}}
          className="flex items-center gap-2"
        >
          <Layers className="w-4 h-4" />
          NDVI
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={centerMapOnBlocks}
          className="flex items-center gap-2"
        >
          <Target className="w-4 h-4" />
          Centralizar
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {}}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            {printMode ? 'Sair da Impressão' : 'Modo Impressão'}
          </Button>
        </div>
      </div>

      {/* Conteúdo do Mapa */}
      <div className="flex-1 relative">
        <MapContainer
          className="h-full"
          center={mapCenter}
          zoom={13}
          scrollWheelZoom={true}
        >
          <MapContext />
          {showSatellite ? (
            <TileLayer
              url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              maxZoom={20}
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          )}

          <FeatureGroup ref={featureGroupRef} >
            <EditControl
              position='topright'
              draw={{
                polygon: drawingMode === 'polygon',
                rectangle: false,
                circle: false,
                marker: false,
                circlemarker: false,
                polyline: false,
              }}
              onCreated={onCreate}
              onEdited={onEdited}
              onDeleted={onDeleted}
              // @ts-ignore
              _onFeatureGroupReady={onFeatureGroupReady}
            />
            {blocks
              .filter(block => visibleColors.length === 0 || visibleColors.includes(block.color))
              .map(block => (
                <Polygon
                  key={block.id}
                  positions={block.polygon.map(coord => [coord[0], coord[1]])}
                  color={block.color}
                  fillOpacity={block.transparency}
                  fill={true}
                  // @ts-ignore
                  weight={printMode ? 1 : 2}
                  opacity={printMode ? 0.5 : 1}
                  // Add a unique class name to each polygon
                  className={`polygon-${block.id}`}
                  // Pass the block id as a property to the layer
                  // @ts-ignore
                  feature={{ properties: { id: block.id } }}
                  eventHandlers={{
                    mouseover: (e) => {
                      // @ts-ignore
                      if (drawingMode === 'delete') {
                        // @ts-ignore
                        e.target.setStyle({ fillColor: 'red', color: 'red' });
                      }
                    },
                    mouseout: (e) => {
                      // @ts-ignore
                      if (drawingMode === 'delete') {
                        // @ts-ignore
                        e.target.setStyle({ fillColor: block.color, color: block.color });
                      }
                    },
                    click: (e) => {
                      // @ts-ignore
                      if (drawingMode === 'delete') {
                        // @ts-ignore
                        const id = e.target.feature.properties.id;
                        setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== id));
                        if (onBlockDelete) {
                          onBlockDelete(id);
                        }
                      } else if (onBlockSelect) {
                        onBlockSelect(block);
                      }
                    }
                  }}
                />
              ))}
          </FeatureGroup>
        </MapContainer>
      </div>
    </div>
  );
};

export default AdvancedMapComponent;
