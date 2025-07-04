import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  Map, 
  Palette, 
  Eye, 
  EyeOff, 
  Layers, 
  MousePointer2, 
  Pentagon, 
  Edit2, 
  Trash2, 
  Ruler,
  Printer,
  Download,
  Upload,
  Settings,
  Satellite,
  Navigation,
  Crosshair,
  Move3D
} from 'lucide-react';

import AdvancedMapComponent from '@/components/mapEditor/AdvancedMapComponent';
import LocationSearch from '@/components/mapEditor/LocationSearch';
import { useBlocks } from '@/hooks/useBlocks';
import { useFarms } from '@/hooks/useFarms';

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

interface Farm {
  id: string;
  nome: string;
  localizacao?: string;
}

const AdvancedMapEditor = () => {
  const [searchParams] = useSearchParams();
  const selectedFarmId = searchParams.get('fazenda');
  
  const { data: farms } = useFarms();
  const selectedFarm = farms?.find(farm => farm.id === selectedFarmId);
  
  const { 
    data: blocks = [], 
    addBlock, 
    updateBlock, 
    deleteBlock 
  } = useBlocks(selectedFarmId);

  const [selectedColor, setSelectedColor] = useState('#10B981');
  const [transparency, setTransparency] = useState(0.4);
  const [showSatellite, setShowSatellite] = useState(false);
  const [showBackground, setShowBackground] = useState(true);
  const [printMode, setPrintMode] = useState(false);
  const [showNDVI, setShowNDVI] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'edit' | 'delete' | 'measure' | 'multiselect' | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  const [centerCoordinates, setCenterCoordinates] = useState<[number, number] | undefined>();
  const [boundingBox, setBoundingBox] = useState<[number, number, number, number] | undefined>();

  const handlePolygonDrawn = async (blockData: any) => {
    if (!selectedFarmId) return;
    
    try {
      await addBlock.mutateAsync({
        fazenda_id: selectedFarmId,
        nome: blockData.name,
        coordenadas: blockData.coordinates,
        cor: blockData.color,
        transparencia: blockData.transparency,
        area_m2: blockData.area_m2,
        area_acres: blockData.area_acres,
        perimetro: blockData.perimeter
      });
    } catch (error) {
      console.error('Erro ao salvar bloco:', error);
    }
  };

  const handleBlockUpdate = async (blockId: string, updates: any) => {
    try {
      await updateBlock.mutateAsync({ 
        id: blockId, 
        updates 
      });
    } catch (error) {
      console.error('Erro ao atualizar bloco:', error);
    }
  };

  const handleBlockDelete = async (blockId: string) => {
    try {
      await deleteBlock.mutateAsync(blockId);
    } catch (error) {
      console.error('Erro ao deletar bloco:', error);
    }
  };

  const handleBlockSelect = (block: any) => {
    setSelectedBlock(block);
  };

  const handleLocationSelect = (lat: number, lng: number, boundingBox?: [number, number, number, number]) => {
    setCenterCoordinates([lng, lat]);
    setBoundingBox(boundingBox);
  };

  // Color options
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

  // Drawing mode options
  const drawingModes = [
    { value: null, label: 'Seleção', icon: MousePointer2, description: 'Clique para selecionar blocos' },
    { value: 'polygon', label: 'Desenhar', icon: Pentagon, description: 'Desenhe novos blocos no mapa' },
    { value: 'edit', label: 'Editar', icon: Edit2, description: 'Modifique blocos existentes' },
    { value: 'multiselect', label: 'Multiseleção', icon: MousePointer2, description: 'Selecione múltiplos blocos' },
    { value: 'measure', label: 'Medir', icon: Ruler, description: 'Meça distâncias no mapa' },
    { value: 'delete', label: 'Deletar', icon: Trash2, description: 'Remova blocos do mapa' },
  ];

  // Block statistics
  const totalArea = blocks.reduce((sum, block) => sum + (block.area_acres || 0), 0);
  const totalBlocks = blocks.length;
  const colorCounts = blocks.reduce((acc, block) => {
    const color = block.cor || '#10B981';
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Map className="w-8 h-8 text-green-600" />
                Editor Avançado de Mapa
              </h1>
              {selectedFarm && (
                <p className="text-gray-600 mt-2">
                  Fazenda: <span className="font-semibold">{selectedFarm.nome}</span>
                  {selectedFarm.localizacao && (
                    <span className="ml-2 text-sm">• {selectedFarm.localizacao}</span>
                  )}
                </p>
              )}
            </div>
            
            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{totalBlocks}</div>
                <div className="text-xs text-gray-500">Blocos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalArea.toFixed(1)}</div>
                <div className="text-xs text-gray-500">Acres</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Search Location */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    Localização
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LocationSearch onLocationSelect={handleLocationSelect} />
                </CardContent>
              </Card>

              {/* Drawing Tools */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Edit2 className="w-4 h-4" />
                    Ferramentas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {drawingModes.map((mode) => {
                    const Icon = mode.icon;
                    return (
                      <Button
                        key={mode.label}
                        variant={drawingMode === mode.value ? "default" : "outline"}
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setDrawingMode(mode.value as any)}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {mode.label}
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Block Style */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Estilo dos Blocos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs">Cor do Bloco</Label>
                    <Select value={selectedColor} onValueChange={setSelectedColor}>
                      <SelectTrigger className="w-full mt-1">
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
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs">
                      Transparência: {Math.round((1 - transparency) * 100)}%
                    </Label>
                    <Slider
                      value={[transparency]}
                      onValueChange={(value) => setTransparency(value[0])}
                      max={1}
                      min={0}
                      step={0.01}
                      className="w-full mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Map Display */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Visualização
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-background" className="text-sm">Mostrar Fundo</Label>
                    <Switch
                      id="show-background"
                      checked={showBackground}
                      onCheckedChange={setShowBackground}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-satellite" className="text-sm">Vista Satélite</Label>
                    <Switch
                      id="show-satellite"
                      checked={showSatellite}
                      onCheckedChange={setShowSatellite}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-ndvi" className="text-sm">Mostrar NDVI</Label>
                    <Switch
                      id="show-ndvi"
                      checked={showNDVI}
                      onCheckedChange={setShowNDVI}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="print-mode" className="text-sm">Modo Impressão</Label>
                    <Switch
                      id="print-mode"
                      checked={printMode}
                      onCheckedChange={setPrintMode}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Block Statistics */}
              {blocks.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Estatísticas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-700">{totalArea.toFixed(1)}</div>
                      <div className="text-xs text-green-600">Total em Acres</div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-700">Distribuição por Cor:</div>
                      {Object.entries(colorCounts).map(([color, count]) => {
                        const colorOption = colorOptions.find(opt => opt.value === color);
                        return (
                          <div key={color} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full border border-gray-300"
                                style={{ backgroundColor: color }}
                              />
                              <span className="text-xs">{colorOption?.label || 'Outro'}</span>
                            </div>
                            <span className="text-xs font-medium">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Main Map Area */}
          <div className="lg:col-span-3">
            <Card className="h-[800px]">
              <CardContent className="p-0 h-full">
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
                  onColorChange={setSelectedColor}
                  onTransparencyChange={setTransparency}
                  onToggleSatellite={() => setShowSatellite(!showSatellite)}
                  onToggleBackground={() => setShowBackground(!showBackground)}
                  onTogglePrintMode={() => setPrintMode(!printMode)}
                  onDrawingModeChange={setDrawingMode}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Selected Block Info */}
        {selectedBlock && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Bloco Selecionado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-gray-600">Nome</Label>
                  <p className="font-medium">{selectedBlock.nome}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Área</Label>
                  <p className="font-medium">{selectedBlock.area_acres?.toFixed(2)} acres</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Perímetro</Label>
                  <p className="font-medium">{selectedBlock.perimetro?.toFixed(0)} metros</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Cor</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: selectedBlock.cor }}
                    />
                    <span className="font-medium">
                      {colorOptions.find(c => c.value === selectedBlock.cor)?.label || 'Personalizada'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Como Usar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Ferramentas de Desenho:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Seleção:</strong> Clique em blocos para selecioná-los</li>
                  <li>• <strong>Desenhar:</strong> Clique no mapa para criar novos blocos</li>
                  <li>• <strong>Editar:</strong> Modifique a forma dos blocos existentes</li>
                  <li>• <strong>Multiseleção:</strong> Selecione vários blocos de uma vez</li>
                  <li>• <strong>Medir:</strong> Meça distâncias no mapa</li>
                  <li>• <strong>Deletar:</strong> Remova blocos clicando neles</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Menu de Contexto:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Botão direito:</strong> Abra o menu de contexto em qualquer lugar do mapa</li>
                  <li>• <strong>Atalhos rápidos:</strong> Mude ferramentas, cores e transparência</li>
                  <li>• <strong>Configurações:</strong> Ajuste visualização e modo de impressão</li>
                  <li>• <strong>Shift + Clique:</strong> Selecione múltiplos blocos</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedMapEditor;
