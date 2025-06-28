
import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useBlocks } from '@/hooks/useBlocks';
import { useFarms } from '@/hooks/useFarms';
import AdvancedMapComponent from '@/components/mapEditor/AdvancedMapComponent';
import MapControls from '@/components/mapEditor/MapControls';
import AdvancedBlockForm from '@/components/mapEditor/AdvancedBlockForm';
import LocationSearch from '@/components/mapEditor/LocationSearch';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';

const AdvancedMapEditor: React.FC = () => {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const { blocks, loading, createBlock, updateBlock, deleteBlock } = useBlocks(farmId);
  const { farms } = useFarms();
  const { toast } = useToast();
  
  // Estados para controles do mapa
  const [showSatellite, setShowSatellite] = useState(false);
  const [showBackground, setShowBackground] = useState(true);
  const [printMode, setPrintMode] = useState(false);
  const [showNDVI, setShowNDVI] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([
    '#10B981', '#F59E0B', '#EF4444', '#F97316', '#8B5CF6', '#FFFFFF', '#3B82F6', '#EC4899', '#06B6D4'
  ]);
  const [transparency, setTransparency] = useState(0.4);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'edit' | 'delete' | 'measure' | null>(null);
  
  // Estados para localização
  const [centerCoordinates, setCenterCoordinates] = useState<[number, number] | undefined>();
  const [boundingBox, setBoundingBox] = useState<[number, number, number, number] | undefined>();
  
  // Estados para formulário
  const [selectedBlock, setSelectedBlock] = useState<any>(null);

  // Filtrar blocos baseado nas cores selecionadas
  const filteredBlocks = blocks.filter(block => 
    selectedColors.includes(block.cor || '#10B981')
  );

  // Fazenda atual
  const currentFarm = farms.find(farm => farm.id === farmId);

  const handlePolygonDrawn = async (blockData: any) => {
    try {
      const newBlock = await createBlock({
        fazenda_id: farmId!,
        nome: blockData.name,
        cor: blockData.color,
        coordenadas: blockData.coordinates,
        area_m2: blockData.area_m2,
        area_acres: blockData.area_acres,
        perimetro: blockData.perimeter,
        transparencia: blockData.transparency,
        data_plantio: null,
        ndvi_historico: [],
        possui_dreno: false,
        proxima_aplicacao: null,
        proxima_colheita: null,
        tipo_cana: null,
        ultima_aplicacao: null
      });
      
      toast({
        title: "Bloco criado",
        description: `Bloco "${blockData.name}" foi criado com sucesso.`
      });
      
      setDrawingMode(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o bloco.",
        variant: "destructive"
      });
    }
  };

  const handleBlockUpdate = async (blockId: string, updates: any) => {
    try {
      await updateBlock(blockId, updates);
      toast({
        title: "Bloco atualizado",
        description: "As alterações foram salvas com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o bloco.",
        variant: "destructive"
      });
    }
  };

  const handleBlockDelete = async (blockId: string) => {
    try {
      await deleteBlock(blockId);
      toast({
        title: "Bloco deletado",
        description: "O bloco foi removido com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível deletar o bloco.",
        variant: "destructive"
      });
    }
  };

  const handleBlockSelect = (block: any) => {
    setSelectedBlock(block);
  };

  const handleSaveBlock = async (blockData: any) => {
    if (selectedBlock?.id) {
      await handleBlockUpdate(selectedBlock.id, blockData);
    }
    setSelectedBlock(null);
  };

  const handleLocationSelect = (lat: number, lon: number, boundingbox?: [number, number, number, number]) => {
    setCenterCoordinates([lon, lat]);
    if (boundingbox) {
      setBoundingBox(boundingbox);
    } else {
      setBoundingBox(undefined);
    }
  };

  const handleAddressUpdate = (address: string) => {
    // Callback para quando o endereço é atualizado
    console.log('Endereço atualizado:', address);
  };

  const handleCenterMap = () => {
    // Calcular centro baseado nos blocos visíveis
    if (filteredBlocks.length > 0) {
      const allCoords = filteredBlocks.flatMap(block => {
        try {
          const coords = typeof block.coordenadas === 'string' 
            ? JSON.parse(block.coordenadas) 
            : block.coordenadas;
          return Array.isArray(coords) ? coords : [];
        } catch {
          return [];
        }
      });
      
      if (allCoords.length > 0) {
        const avgLat = allCoords.reduce((sum, coord) => sum + coord[1], 0) / allCoords.length;
        const avgLng = allCoords.reduce((sum, coord) => sum + coord[0], 0) / allCoords.length;
        setCenterCoordinates([avgLng, avgLat]);
      }
    } else if (currentFarm?.latitude && currentFarm?.longitude) {
      setCenterCoordinates([currentFarm.longitude, currentFarm.latitude]);
    }
  };

  const handleFarmChange = (newFarmId: string) => {
    navigate(`/advanced-map-editor/${newFarmId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Carregando blocos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Painel de Controles - Esquerda */}
      <div className="w-80 bg-white shadow-lg border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Editor Avançado</h1>
          <p className="text-sm text-gray-600 mt-1">
            Blocos: {filteredBlocks.length} de {blocks.length} visíveis
          </p>
          
          {/* Seletor de Fazenda */}
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Selecionar Fazenda</label>
            <Select value={farmId || ''} onValueChange={handleFarmChange}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma fazenda" />
              </SelectTrigger>
              <SelectContent>
                {farms.map((farm) => (
                  <SelectItem key={farm.id} value={farm.id}>
                    {farm.nome} {farm.localizacao && `- ${farm.localizacao}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {/* Controles do Mapa */}
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
              selectedColors={selectedColors}
              onColorSelectionChange={setSelectedColors}
              transparency={transparency}
              onTransparencyChange={setTransparency}
              drawingMode={drawingMode}
              onDrawingModeChange={setDrawingMode}
              onCenterMap={handleCenterMap}
            />
          </div>

          {/* Busca de Localização */}
          <div className="p-4 border-t border-gray-200">
            <LocationSearch
              onLocationSelect={handleLocationSelect}
              onAddressUpdate={handleAddressUpdate}
              placeholder="Buscar localização..."
            />
          </div>

          {/* Formulário de Bloco */}
          <div className="p-4 border-t border-gray-200">
            <AdvancedBlockForm
              blockData={selectedBlock}
              onSave={handleSaveBlock}
              onCancel={() => setSelectedBlock(null)}
            />
          </div>
        </div>
      </div>

      {/* Mapa - Área Principal */}
      <div className="flex-1">
        <AdvancedMapComponent
          blocks={filteredBlocks}
          selectedColor={selectedColors[0] || '#10B981'}
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
        />
      </div>
    </div>
  );
};

export default AdvancedMapEditor;
