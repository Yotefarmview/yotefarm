
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Map as MapIcon, Save, Settings, Download, Upload, Navigation, Layers } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AdvancedMapComponent from '../components/mapEditor/AdvancedMapComponent';
import LocationSearch from '../components/mapEditor/LocationSearch';
import { useBlocks } from '../hooks/useBlocks';
import { useFarms } from '../hooks/useFarms';

const AdvancedMapEditor: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  // Get coordinates from URL parameters
  const urlLat = searchParams.get('lat');
  const urlLng = searchParams.get('lng');
  const farmId = searchParams.get('fazenda');

  const { blocks, createBlock, updateBlock, deleteBlock } = useBlocks(farmId || undefined);
  const { farms } = useFarms();

  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  const [currentFarm, setCurrentFarm] = useState<any>(null);
  
  // Map states
  const [showSatellite, setShowSatellite] = useState(false);
  const [showBackground, setShowBackground] = useState(true);
  const [printMode, setPrintMode] = useState(false);
  const [showNDVI, setShowNDVI] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#10B981');
  const [transparency, setTransparency] = useState(0.4);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'edit' | 'delete' | null>(null);
  
  // Location states
  const [centerCoordinates, setCenterCoordinates] = useState<[number, number] | undefined>();
  const [boundingBox, setBoundingBox] = useState<[number, number, number, number] | undefined>();

  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    cor: '#10B981',
    data_plantio: '',
    ultima_aplicacao: '',
    proxima_colheita: '',
    observacoes: ''
  });

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

  // Load farm and coordinates from URL
  useEffect(() => {
    if (urlLat && urlLng) {
      setCenterCoordinates([parseFloat(urlLng), parseFloat(urlLat)]);
    }
    
    if (farmId && farms.length > 0) {
      const farm = farms.find(f => f.id === farmId);
      if (farm) {
        setCurrentFarm(farm);
        if (farm.latitude && farm.longitude && !urlLat && !urlLng) {
          setCenterCoordinates([farm.longitude, farm.latitude]);
        }
      }
    }
  }, [farmId, farms, urlLat, urlLng]);

  // Update form when block is selected
  useEffect(() => {
    if (selectedBlock) {
      setFormData({
        nome: selectedBlock.nome || '',
        cor: selectedBlock.cor || '#10B981',
        data_plantio: selectedBlock.data_plantio || '',
        ultima_aplicacao: selectedBlock.ultima_aplicacao?.data || '',
        proxima_colheita: selectedBlock.proxima_colheita || '',
        observacoes: ''
      });
      setSelectedColor(selectedBlock.cor || '#10B981');
    }
  }, [selectedBlock]);

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

      const newBlock = {
        ...blockData,
        fazenda_id: farmId,
        coordenadas: JSON.stringify(blockData.coordinates),
        nome: formData.nome || blockData.name,
        cor: selectedColor,
        data_plantio: formData.data_plantio || null,
        proxima_colheita: formData.proxima_colheita || null,
        ultima_aplicacao: formData.ultima_aplicacao ? {
          data: formData.ultima_aplicacao
        } : null
      };

      await createBlock(newBlock);

      toast({
        title: "Sucesso",
        description: "Bloco criado com sucesso!"
      });

      setDrawingMode(null);
      resetForm();
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
      resetForm();

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

  const handleSaveBlock = async () => {
    try {
      if (selectedBlock?.id) {
        await updateBlock(selectedBlock.id, {
          nome: formData.nome,
          cor: formData.cor,
          data_plantio: formData.data_plantio || null,
          proxima_colheita: formData.proxima_colheita || null,
          ultima_aplicacao: formData.ultima_aplicacao ? {
            data: formData.ultima_aplicacao
          } : null
        });
        
        toast({
          title: "Sucesso",
          description: "Bloco atualizado com sucesso!"
        });
      }

      setSelectedBlock(null);
      setDrawingMode(null);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar bloco",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cor: '#10B981',
      data_plantio: '',
      ultima_aplicacao: '',
      proxima_colheita: '',
      observacoes: ''
    });
    setSelectedColor('#10B981');
  };

  const handleLocationSelect = (lat: number, lon: number, bbox?: [number, number, number, number]) => {
    setCenterCoordinates([lon, lat]);
    if (bbox) {
      setBoundingBox(bbox);
    }
  };

  const exportGeoJSON = () => {
    const features = blocks.map(block => ({
      type: 'Feature',
      properties: {
        id: block.id,
        nome: block.nome,
        cor: block.cor,
        area_m2: block.area_m2,
        area_acres: block.area_acres
      },
      geometry: {
        type: 'Polygon',
        coordinates: [JSON.parse(block.coordenadas)]
      }
    }));

    const geoJSON = {
      type: 'FeatureCollection',
      features
    };

    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blocos_${currentFarm?.nome || 'fazenda'}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b border-gray-200 p-4"
      >
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <MapIcon className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Editor de Mapa Avançado
                </h1>
                <p className="text-sm text-gray-600">
                  Sistema de mapeamento agrícola QGIS-level
                </p>
              </div>
            </div>
            {currentFarm && (
              <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                {currentFarm.nome} • {blocks.length} blocos
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportGeoJSON}>
              <Download className="w-4 h-4 mr-2" />
              Exportar GeoJSON
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="flex max-w-screen-2xl mx-auto">
        {/* Map Area - 75% */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-3/4 p-4"
        >
          <Card className="h-[calc(100vh-120px)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Mapa Interativo
                </CardTitle>
                
                {/* Map Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={showSatellite ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowSatellite(!showSatellite)}
                  >
                    <Layers className="w-4 h-4 mr-2" />
                    {showSatellite ? 'Satélite' : 'Padrão'}
                  </Button>
                  
                  <Button
                    variant={printMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPrintMode(!printMode)}
                  >
                    Modo Impressão
                  </Button>
                  
                  <Button
                    variant={drawingMode === 'polygon' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDrawingMode(drawingMode === 'polygon' ? null : 'polygon')}
                  >
                    Desenhar
                  </Button>
                  
                  <Button
                    variant={drawingMode === 'edit' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDrawingMode(drawingMode === 'edit' ? null : 'edit')}
                  >
                    Editar
                  </Button>
                  
                  <Button
                    variant={drawingMode === 'delete' ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setDrawingMode(drawingMode === 'delete' ? null : 'delete')}
                  >
                    Deletar
                  </Button>
                </div>
              </div>
              
              {/* Search Bar */}
              <LocationSearch
                onLocationSelect={handleLocationSelect}
                placeholder="Buscar endereço global (CEP, cidade, coordenadas...)"
              />
            </CardHeader>
            
            <CardContent className="h-full p-0">
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
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar - 25% */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-1/4 p-4 pl-0"
        >
          <Card className="h-[calc(100vh-120px)] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedBlock ? 'Editar Bloco' : 'Novo Bloco'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Block Info Display */}
              {selectedBlock && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">Dados Calculados</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="text-green-700">Área:</span>
                      <p className="font-medium">{selectedBlock.area_m2?.toFixed(2)} m²</p>
                      <p className="font-medium">{selectedBlock.area_acres?.toFixed(4)} acres</p>
                    </div>
                    <div>
                      <span className="text-green-700">Perímetro:</span>
                      <p className="font-medium">{selectedBlock.perimetro?.toFixed(2)} m</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Bloco</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    placeholder="Ex: Talhão A1, Bloco Norte..."
                  />
                </div>

                <div>
                  <Label htmlFor="cor">Cor do Bloco</Label>
                  <Select 
                    value={formData.cor} 
                    onValueChange={(value) => {
                      setFormData({...formData, cor: value});
                      setSelectedColor(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                  </Select>
                </div>

                <div>
                  <Label htmlFor="transparencia">Transparência</Label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={transparency}
                    onChange={(e) => setTransparency(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-600">{Math.round(transparency * 100)}%</span>
                </div>

                <Separator />

                <div>
                  <Label htmlFor="data_plantio">Data do Plantio</Label>
                  <Input
                    id="data_plantio"
                    type="date"
                    value={formData.data_plantio}
                    onChange={(e) => setFormData({...formData, data_plantio: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="ultima_aplicacao">Última Aplicação</Label>
                  <Input
                    id="ultima_aplicacao"
                    type="date"
                    value={formData.ultima_aplicacao}
                    onChange={(e) => setFormData({...formData, ultima_aplicacao: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="proxima_colheita">Próxima Colheita</Label>
                  <Input
                    id="proxima_colheita"
                    type="date"
                    value={formData.proxima_colheita}
                    onChange={(e) => setFormData({...formData, proxima_colheita: e.target.value})}
                  />
                </div>

                <Separator />

                {/* Advanced Options */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showNDVI"
                      checked={showNDVI}
                      onCheckedChange={(checked) => setShowNDVI(!!checked)}
                    />
                    <Label htmlFor="showNDVI">Mostrar NDVI</Label>
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button 
                    onClick={handleSaveBlock}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={!selectedBlock}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedBlock(null);
                      setDrawingMode(null);
                      resetForm();
                    }}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Instruções:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use "Desenhar" para criar novos blocos</li>
                  <li>• Clique em blocos existentes para editar</li>
                  <li>• Use "Modo Impressão" para relatórios</li>
                  <li>• Busque por endereços na barra de pesquisa</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdvancedMapEditor;
