import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useBlocks } from '@/hooks/useBlocks';
import { useFarms } from '@/hooks/useFarms';
import AdvancedMapComponent from '@/components/mapEditor/AdvancedMapComponent';
import MapControls from '@/components/mapEditor/MapControls';
import AdvancedBlockForm from '@/components/mapEditor/AdvancedBlockForm';
import LocationSearch from '@/components/mapEditor/LocationSearch';
import { useToast } from '@/hooks/use-toast';

const AdvancedMapEditor: React.FC = () => {
  const { farmId } = useParams<{ farmId: string }>();
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
  ]); // Todas as cores selecionadas por padrão
  const [transparency, setTransparency] = useState(0.4);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'edit' | 'delete' | 'measure' | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(farmId || null);
  
  // Estados para localização
  const [centerCoordinates, setCenterCoordinates] = useState<[number, number] | undefined>();
  const [boundingBox, setBoundingBox] = useState<[number, number, number, number] | undefined>();
  
  // Estados para formulário
  const [selectedBlock, setSelectedBlock] = useState<any>(null);

  // Filtrar blocos baseado nas cores selecionadas
  const filteredBlocks = blocks.filter(block => 
    selectedColors.includes(block.cor || '#10B981')
  );

  const handlePolygonDrawn = async (blockData: any) => {
    try {
      const newBlock = await createBlock({
        fazenda_id: selectedFarmId!,
        nome: blockData.name,
        cor: blockData.color,
        coordenadas: blockData.coordinates,
        area_m2: blockData.area_m2,
        area_acres: blockData.area_acres,
        perimetro: blockData.perimeter,
        transparencia: blockData.transparency,
        // Campos obrigatórios adicionais
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

  const handleLocationFound = (coordinates: [number, number]) => {
    setCenterCoordinates(coordinates);
    setBoundingBox(undefined);
  };

  const handleBoundingBoxFound = (bbox: [number, number, number, number]) => {
    setBoundingBox(bbox);
    setCenterCoordinates(undefined);
  };

  const handleFarmSelect = (farmId: string) => {
    setSelectedFarmId(farmId);
    const selectedFarm = farms.find(farm => farm.id === farmId);
    
    if (selectedFarm && selectedFarm.latitude && selectedFarm.longitude) {
      setCenterCoordinates([selectedFarm.longitude, selectedFarm.latitude]);
      setBoundingBox(undefined);
      
      toast({
        title: "Fazenda selecionada",
        description: `Direcionando para ${selectedFarm.nome}`
      });
    }
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
    }
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
      {/* Mapa - Área Principal */}
      <div className="flex-1 relative">
        {/* Controles Flutuantes */}
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Controles do Mapa</h2>
          
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
            farms={farms}
            selectedFarmId={selectedFarmId}
            onFarmSelect={handleFarmSelect}
          />
          
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Buscar Localização</h3>
            <LocationSearch
              onLocationSelect={handleLocationFound}
              onBoundingBoxSelect={handleBoundingBoxFound}
            />
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>Blocos: {filteredBlocks.length} de {blocks.length} visíveis</p>
          </div>
        </div>

        {/* Formulário de Bloco - Flutuante no canto direito */}
        {selectedBlock && (
          <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-sm">
            <AdvancedBlockForm
              blockData={selectedBlock}
              onSave={handleSaveBlock}
              onCancel={() => setSelectedBlock(null)}
            />
          </div>
        )}

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
