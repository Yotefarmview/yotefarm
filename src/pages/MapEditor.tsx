
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Map as MapIcon, Save, Settings } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import AdvancedMapComponent from '../components/mapEditor/AdvancedMapComponent';
import AdvancedBlockForm from '../components/mapEditor/AdvancedBlockForm';
import MapControls from '../components/mapEditor/MapControls';
import LocationSearch from '../components/mapEditor/LocationSearch';
import { useBlocks } from '../hooks/useBlocks';
import { useFarms } from '../hooks/useFarms';

const MapEditor: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const farmId = searchParams.get('fazenda');

  const { blocks, createBlock, updateBlock, deleteBlock } = useBlocks(farmId || undefined);
  const { farms } = useFarms();

  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  const [currentFarm, setCurrentFarm] = useState<any>(null);
  
  // Estados do mapa
  const [showSatellite, setShowSatellite] = useState(false);
  const [showBackground, setShowBackground] = useState(true);
  const [printMode, setPrintMode] = useState(false);
  const [showNDVI, setShowNDVI] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#10B981');
  const [transparency, setTransparency] = useState(0.4);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'edit' | 'delete' | null>(null);
  
  // Estados de localização
  const [centerCoordinates, setCenterCoordinates] = useState<[number, number] | undefined>();
  const [boundingBox, setBoundingBox] = useState<[number, number, number, number] | undefined>();

  // Carregar fazenda atual
  useEffect(() => {
    if (farmId && farms.length > 0) {
      const farm = farms.find(f => f.id === farmId);
      if (farm) {
        setCurrentFarm(farm);
        if (farm.latitude && farm.longitude) {
          setCenterCoordinates([farm.longitude, farm.latitude]);
        }
      }
    }
  }, [farmId, farms]);

  const handlePolygonDrawn = async (blockData: any) => {
    try {
      if (!farmId) {
        toast({
          title: "Erro",
          description: "Selecione uma fazenda primeiro",
          variant: "destructive"
        });
        return;
      }

      await createBlock({
        ...blockData,
        fazenda_id: farmId,
        coordenadas: JSON.stringify(blockData.coordinates)
      });

      toast({
        title: "Sucesso",
        description: "Bloco criado com sucesso!"
      });

      setDrawingMode(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar bloco",
        variant: "destructive"
      });
    }
  };

  const handleBlockUpdate = async (blockId: string, updates: any) => {
    try {
      await updateBlock(blockId, {
        ...updates,
        coordenadas: updates.coordinates ? JSON.stringify(updates.coordinates) : undefined
      });

      toast({
        title: "Sucesso",
        description: "Bloco atualizado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar bloco",
        variant: "destructive"
      });
    }
  };

  const handleBlockDelete = async (blockId: string) => {
    try {
      await deleteBlock(blockId);
      setSelectedBlock(null);

      toast({
        title: "Sucesso",
        description: "Bloco deletado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar bloco",
        variant: "destructive"
      });
    }
  };

  const handleBlockSelect = (block: any) => {
    setSelectedBlock(block);
    setDrawingMode('edit');
  };

  const handleBlockFormSave = async (data: any) => {
    try {
      if (selectedBlock?.id) {
        await updateBlock(selectedBlock.id, data);
      } else {
        await createBlock({
          ...data,
          fazenda_id: farmId,
          coordenadas: JSON.stringify(data.coordenadas)
        });
      }

      setSelectedBlock(null);
      setDrawingMode(null);

      toast({
        title: "Sucesso",
        description: selectedBlock?.id ? "Bloco atualizado!" : "Bloco criado!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar bloco",
        variant: "destructive"
      });
    }
  };

  const handleLocationSelect = (lat: number, lon: number, bbox?: [number, number, number, number]) => {
    setCenterCoordinates([lon, lat]);
    if (bbox) {
      setBoundingBox(bbox);
    }
  };

  const handleCenterMap = () => {
    if (currentFarm?.latitude && currentFarm?.longitude) {
      setCenterCoordinates([currentFarm.longitude, currentFarm.latitude]);
      setBoundingBox(undefined);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('mapEditor.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            Sistema técnico de mapeamento agrícola para cana-de-açúcar
          </p>
          {currentFarm && (
            <p className="text-sm text-green-600 mt-1">
              Fazenda: {currentFarm.nome} • {blocks.length} blocos mapeados
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6 text-gray-400" />
          <MapIcon className="w-8 h-8 text-green-600" />
        </div>
      </motion.div>

      {/* Busca de Localização */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
      >
        <LocationSearch
          onLocationSelect={handleLocationSelect}
          placeholder="Buscar localização (endereço, cidade, coordenadas...)"
        />
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Controles do Mapa */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-1"
        >
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
          />
        </motion.div>

        {/* Mapa Principal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-2"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Mapa Técnico Agrícola
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Precisão: Nível QGIS</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>
            
            <div className="h-[600px]">
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
              />
            </div>
          </div>
        </motion.div>

        {/* Formulário de Blocos */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="xl:col-span-1"
        >
          <AdvancedBlockForm
            blockData={selectedBlock}
            onSave={handleBlockFormSave}
            onCancel={() => {
              setSelectedBlock(null);
              setDrawingMode(null);
            }}
          />
        </motion.div>
      </div>

      {/* Instruções Técnicas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6"
      >
        <h4 className="font-bold text-green-900 mb-3 text-lg">Guia de Uso Técnico:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-semibold text-green-800 mb-2">Navegação:</h5>
            <ul className="text-green-700 space-y-1">
              <li>• Use a busca para localizar fazendas por endereço</li>
              <li>• Alterne entre vista padrão e satélite</li>
              <li>• Modo impressão remove o fundo para relatórios</li>
              <li>• NDVI mostra índice de vegetação por satélite</li>
            </ul>
          </div>
          <div>
            <h5 className="font-semibold text-green-800 mb-2">Mapeamento:</h5>
            <ul className="text-green-700 space-y-1">
              <li>• Desenhe polígonos com precisão técnica</li>
              <li>• Áreas calculadas automaticamente (m² e acres)</li>
              <li>• Edite blocos existentes arrastando vértices</li>
              <li>• Sistema de cores para classificação agronômica</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MapEditor;
