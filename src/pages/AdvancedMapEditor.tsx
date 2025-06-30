
import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AdvancedMapComponent from '@/components/mapEditor/AdvancedMapComponent';
import MapControls from '@/components/mapEditor/MapControls';
import LocationSearch from '@/components/mapEditor/LocationSearch';
import ShapefileImporter from '@/components/mapEditor/ShapefileImporter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Search, 
  Upload, 
  Save, 
  FileDown, 
  MapPin, 
  Home,
  Download
} from 'lucide-react';

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

const AdvancedMapEditor = () => {
  // Estado do mapa
  const [selectedColor, setSelectedColor] = useState('#10B981');
  const [transparency, setTransparency] = useState(0.4);
  const [showSatellite, setShowSatellite] = useState(false);
  const [showBackground, setShowBackground] = useState(true);
  const [printMode, setPrintMode] = useState(false);
  const [showNDVI, setShowNDVI] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'edit' | 'delete' | 'measure' | null>(null);
  const [centerCoordinates, setCenterCoordinates] = useState<[number, number] | undefined>();
  const [boundingBox, setBoundingBox] = useState<[number, number, number, number] | undefined>();
  
  // Estado das cores visíveis - inicialmente todas visíveis
  const [visibleColors, setVisibleColors] = useState<string[]>([
    '#10B981', '#F59E0B', '#EF4444', '#F97316', '#8B5CF6', 
    '#FFFFFF', '#3B82F6', '#EC4899', '#06B6D4'
  ]);

  // Estado dos formulários
  const [farmName, setFarmName] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // Query dos blocos
  const { data: blocks = [], isLoading: isLoadingBlocks } = useQuery({
    queryKey: ['blocks', selectedFarmId],
    queryFn: async () => {
      if (!selectedFarmId) return [];
      
      try {
        console.log('Carregando blocos para fazenda:', selectedFarmId);
        const { data, error } = await supabase
          .from('blocos')
          .select('*')
          .eq('fazenda_id', selectedFarmId);

        if (error) {
          console.error('Erro ao carregar blocos:', error);
          throw error;
        }

        console.log('Blocos carregados:', data?.length || 0);
        return data || [];
      } catch (error) {
        console.error('Erro ao carregar blocos:', error);
        return [];
      }
    },
    enabled: !!selectedFarmId,
  });

  // Query das fazendas
  const { data: farms = [] } = useQuery({
    queryKey: ['farms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fazendas')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data || [];
    },
  });

  // Mutation para criar fazenda
  const createFarmMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('fazendas')
        .insert([{ nome: name }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['farms'] });
      setSelectedFarmId(data.id);
      setFarmName('');
      toast.success('Fazenda criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar fazenda:', error);
      toast.error('Erro ao criar fazenda');
    },
  });

  // Mutation para salvar bloco
  const saveBlockMutation = useMutation({
    mutationFn: async (blockData: BlockData) => {
      if (!selectedFarmId) throw new Error('Nenhuma fazenda selecionada');

      const { data, error } = await supabase
        .from('blocos')
        .insert([{
          fazenda_id: selectedFarmId,
          nome: blockData.name,
          cor: blockData.color,
          transparencia: blockData.transparency,
          area_m2: blockData.area_m2,
          area_acres: blockData.area_acres,
          perimetro: blockData.perimeter,
          coordenadas: JSON.stringify(blockData.coordinates)
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      toast.success('Bloco salvo com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao salvar bloco:', error);
      toast.error('Erro ao salvar bloco');
    },
  });

  // Mutation para atualizar bloco
  const updateBlockMutation = useMutation({
    mutationFn: async ({ blockId, updates }: { blockId: string; updates: Partial<BlockData> }) => {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.nome = updates.name;
      if (updates.nome !== undefined) updateData.nome = updates.nome;
      if (updates.color !== undefined) updateData.cor = updates.color;
      if (updates.cor !== undefined) updateData.cor = updates.cor;
      if (updates.transparency !== undefined) updateData.transparencia = updates.transparency;
      if (updates.coordinates !== undefined) updateData.coordenadas = JSON.stringify(updates.coordinates);
      if (updates.area_m2 !== undefined) updateData.area_m2 = updates.area_m2;
      if (updates.area_acres !== undefined) updateData.area_acres = updates.area_acres;
      if (updates.perimeter !== undefined) updateData.perimetro = updates.perimeter;

      const { data, error } = await supabase
        .from('blocos')
        .update(updateData)
        .eq('id', blockId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      toast.success('Bloco atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar bloco:', error);
      toast.error('Erro ao atualizar bloco');
    },
  });

  // Mutation para deletar bloco
  const deleteBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const { error } = await supabase
        .from('blocos')
        .delete()
        .eq('id', blockId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      toast.success('Bloco deletado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao deletar bloco:', error);
      toast.error('Erro ao deletar bloco');
    },
  });

  // Handlers
  const handleCreateFarm = () => {
    if (farmName.trim()) {
      createFarmMutation.mutate(farmName.trim());
    }
  };

  const handlePolygonDrawn = useCallback((blockData: BlockData) => {
    saveBlockMutation.mutate(blockData);
  }, [saveBlockMutation]);

  const handleBlockUpdate = useCallback((blockId: string, updates: Partial<BlockData>) => {
    updateBlockMutation.mutate({ blockId, updates });
  }, [updateBlockMutation]);

  const handleBlockDelete = useCallback((blockId: string) => {
    deleteBlockMutation.mutate(blockId);
  }, [deleteBlockMutation]);

  const handleBlockSelect = useCallback((block: any) => {
    console.log('Bloco selecionado:', block);
  }, []);

  const handleLocationSelect = useCallback((coordinates: [number, number], boundingBox?: [number, number, number, number]) => {
    setCenterCoordinates(coordinates);
    setBoundingBox(boundingBox);
  }, []);

  const handleCenterMap = useCallback(() => {
    if (blocks.length > 0) {
      // Calculate center from all blocks
      let allCoords: [number, number][] = [];
      
      blocks.forEach(block => {
        try {
          let coordinates;
          if (typeof block.coordenadas === 'string') {
            coordinates = JSON.parse(block.coordenadas);
          } else if (Array.isArray(block.coordenadas)) {
            coordinates = block.coordenadas;
          }
          
          if (coordinates && Array.isArray(coordinates)) {
            allCoords = [...allCoords, ...coordinates];
          }
        } catch (error) {
          console.error('Erro ao processar coordenadas do bloco:', error);
        }
      });

      if (allCoords.length > 0) {
        const avgLat = allCoords.reduce((sum, coord) => sum + coord[1], 0) / allCoords.length;
        const avgLng = allCoords.reduce((sum, coord) => sum + coord[0], 0) / allCoords.length;
        
        const minLat = Math.min(...allCoords.map(c => c[1]));
        const maxLat = Math.max(...allCoords.map(c => c[1]));
        const minLng = Math.min(...allCoords.map(c => c[0]));
        const maxLng = Math.max(...allCoords.map(c => c[0]));
        
        setCenterCoordinates([avgLng, avgLat]);
        setBoundingBox([minLat, minLng, maxLat, maxLng]);
      }
    } else {
      // Default to Brazil center
      setCenterCoordinates([-47.8825, -15.7942]);
      setBoundingBox(undefined);
    }
  }, [blocks]);

  const handleExportBlocks = useCallback(() => {
    if (blocks.length === 0) {
      toast.error('Nenhum bloco para exportar');
      return;
    }

    const geoJson = {
      type: 'FeatureCollection',
      features: blocks.map(block => {
        let coordinates;
        try {
          if (typeof block.coordenadas === 'string') {
            coordinates = JSON.parse(block.coordenadas);
          } else if (Array.isArray(block.coordenadas)) {
            coordinates = block.coordenadas;
          } else {
            coordinates = [];
          }
        } catch (error) {
          console.error('Erro ao processar coordenadas:', error);
          coordinates = [];
        }

        // Ensure the polygon is closed
        if (coordinates.length > 0) {
          const first = coordinates[0];
          const last = coordinates[coordinates.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            coordinates.push([...first]);
          }
        }

        return {
          type: 'Feature',
          properties: {
            id: block.id,
            nome: block.nome,
            cor: block.cor,
            area_m2: block.area_m2,
            area_acres: block.area_acres,
            perimetro: block.perimetro,
            transparencia: block.transparencia
          },
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates]
          }
        };
      })
    };

    const dataStr = JSON.stringify(geoJson, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blocos_${selectedFarmId || 'export'}.geojson`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Blocos exportados com sucesso!');
  }, [blocks, selectedFarmId]);

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Farm Selection */}
          <div className="flex items-center gap-2">
            <Home className="w-4 h-4" />
            <select
              value={selectedFarmId || ''}
              onChange={(e) => setSelectedFarmId(e.target.value || null)}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="">Selecione uma fazenda</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Create Farm */}
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nome da nova fazenda"
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              className="w-48 h-8 text-sm"
            />
            <Button
              onClick={handleCreateFarm}
              size="sm"
              disabled={!farmName.trim() || createFarmMutation.isPending}
            >
              <Save className="w-4 h-4 mr-1" />
              Criar
            </Button>
          </div>

          {/* Location Search */}
          <LocationSearch onLocationSelect={handleLocationSelect} />

          {/* Export Button */}
          <Button
            onClick={handleExportBlocks}
            variant="outline"
            size="sm"
            disabled={blocks.length === 0}
          >
            <Download className="w-4 h-4 mr-1" />
            Exportar
          </Button>

          {/* Shapefile Importer */}
          <ShapefileImporter
            farmId={selectedFarmId}
            onImportComplete={() => {
              queryClient.invalidateQueries({ queryKey: ['blocks'] });
              toast.success('Blocos importados com sucesso!');
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map Controls Sidebar */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <MapControls
              showSatellite={showSatellite}
              onToggleSatellite={() => setShowSatellite(!showSatellite)}
              showBackground={showBackground}
              onToggleBackground={() => setShowBackground(!showBackground)}
              printMode={printMode}
              onTogglePrintMode={() => setPrintMode(!printMode)}
              showNDVI={showNDVI}
              onToggleNDVI={() => setShowNDVI(!showNDVI)}
              selectedColor={selectedColor}
              onColorChange={setSelectedColor}
              transparency={transparency}
              onTransparencyChange={setTransparency}
              drawingMode={drawingMode}
              onDrawingModeChange={setDrawingMode}
              onCenterMap={handleCenterMap}
              visibleColors={visibleColors}
              onVisibleColorsChange={setVisibleColors}
            />
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative">
          <AdvancedMapComponent
            blocks={blocks}
            selectedColor={selectedColor}
            transparency={transparency}
            showSatellite={showSatellite}
            showBackground={showBackground}
            printMode={printMode}
            showNDVI={showNDVI}
            drawingMode={drawingMode}
            onPolygonDrawn={handlePolygonDrawn}
            onBlockUpdate={handleBlockUpdate}
            onBlockDelete={handleBlockDelete}
            onBlockSelect={handleBlockSelect}
            centerCoordinates={centerCoordinates}
            boundingBox={boundingBox}
            visibleColors={visibleColors}
          />
        </div>
      </div>
    </div>
  );
};

export default AdvancedMapEditor;
