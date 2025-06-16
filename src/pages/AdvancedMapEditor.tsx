import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  MapPin, 
  Pencil, 
  Trash2, 
  MousePointer, 
  Square, 
  Edit,
  Eye,
  EyeOff,
  Palette,
  Layers,
  Settings,
  Download,
  Upload,
  Ruler,
  Save,
  X,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useFarms } from '@/hooks/useFarms';
import { useBlocks } from '@/hooks/useBlocks';
import AdvancedMapComponent from '@/components/mapEditor/AdvancedMapComponent';
import LocationSearch from '@/components/mapEditor/LocationSearch';
import AdvancedBlockForm from '@/components/mapEditor/AdvancedBlockForm';
import { saveAs } from 'file-saver';
import * as shpwrite from 'shp-write';
import * as shp from 'shpjs';

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
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [selectedFarm, setSelectedFarm] = useState<any | null>(null);
  const [centerCoordinates, setCenterCoordinates] = useState<[number, number] | null>(null);
  const [boundingBox, setBoundingBox] = useState<[number, number, number, number] | null>(null);
  const [selectedColor, setSelectedColor] = useState('#10B981');
  const [transparency, setTransparency] = useState(0.4);
  const [showSatellite, setShowSatellite] = useState(false);
  const [showBackground, setShowBackground] = useState(true);
  const [printMode, setPrintMode] = useState(false);
  const [showNDVI, setShowNDVI] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'edit' | 'delete' | 'measure' | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<any | null>(null);
  const [isBlockFormOpen, setIsBlockFormOpen] = useState(false);

  const { farms, isLoading: isLoadingFarms, isError: isErrorFarms } = useFarms();
  const { 
    blocks, 
    isLoading: isLoadingBlocks, 
    isError: isErrorBlocks,
    createBlock,
    updateBlock,
    deleteBlock
  } = useBlocks(selectedFarmId);

  useEffect(() => {
    if (farms && farms.length > 0 && !selectedFarmId) {
      const firstFarm = farms[0];
      setSelectedFarmId(firstFarm.id);
      setSelectedFarm(firstFarm);
    }
  }, [farms, selectedFarmId]);

  useEffect(() => {
    if (selectedFarmId) {
      const farm = farms?.find(farm => farm.id === selectedFarmId);
      setSelectedFarm(farm);
    }
  }, [selectedFarmId, farms]);

  const handleFarmChange = (farmId: string) => {
    setSelectedFarmId(farmId);
    const farm = farms?.find(farm => farm.id === farmId);
    setSelectedFarm(farm);
    setCenterCoordinates(farm?.center_coordinates ? [farm.center_coordinates[1], farm.center_coordinates[0]] : null);
    setBoundingBox(farm?.bounding_box ? [farm.bounding_box[0], farm.bounding_box[1], farm.bounding_box[2], farm.bounding_box[3]] : null);
  };

  const handlePolygonDrawn = async (blockData: BlockData) => {
    if (!selectedFarmId) {
      toast.error("Selecione uma fazenda antes de desenhar um bloco.");
      return;
    }

    try {
      const newBlock = {
        ...blockData,
        fazenda_id: selectedFarmId,
      };
      await createBlock(newBlock);
      toast.success("Bloco criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar bloco:", error);
      toast.error("Erro ao criar bloco. Tente novamente.");
    }
  };

  const handleBlockUpdate = async (blockId: string, updates: Partial<BlockData>) => {
    try {
      await updateBlock(blockId, updates);
      toast.success("Bloco atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar bloco:", error);
      toast.error("Erro ao atualizar bloco. Tente novamente.");
    }
  };

  const handleBlockDelete = async (blockId: string) => {
    try {
      await deleteBlock(blockId);
      toast.success("Bloco deletado com sucesso!");
    } catch (error) {
      console.error("Erro ao deletar bloco:", error);
      toast.error("Erro ao deletar bloco. Tente novamente.");
    }
  };

  const handleBlockSelect = (block: any) => {
    setSelectedBlock(block);
  };

  // Export handlers
  const handleExportGeoJSON = async () => {
    if (blocks.length === 0) {
      toast.error("Não há blocos para exportar");
      return;
    }

    try {
      const features = blocks.map(block => ({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [block.coordenadas]
        },
        properties: {
          id: block.id,
          nome: block.nome,
          area_m2: block.area_m2,
          area_acres: block.area_acres,
          perimetro: block.perimetro,
          cor: block.cor,
          transparencia: block.transparencia,
          fazenda_id: block.fazenda_id,
          produto: block.produto,
          data_plantio: block.data_plantio,
          data_colheita: block.data_colheita,
          observacoes: block.observacoes
        }
      }));

      const geojson = {
        type: "FeatureCollection",
        features: features
      };

      const blob = new Blob([JSON.stringify(geojson, null, 2)], { 
        type: 'application/json' 
      });
      
      saveAs(blob, `blocos_${new Date().toISOString().split('T')[0]}.geojson`);
      toast.success("Arquivo GeoJSON gerado com sucesso!");
    } catch (error) {
      console.error('Erro ao exportar GeoJSON:', error);
      toast.error("Não foi possível gerar o arquivo. Tente novamente.");
    }
  };

  const handleExportShapefile = async () => {
    if (blocks.length === 0) {
      toast.error("Não há blocos para exportar");
      return;
    }

    try {
      const features = blocks.map(block => ({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [block.coordenadas]
        },
        properties: {
          id: block.id,
          nome: block.nome || '',
          area_m2: block.area_m2 || 0,
          area_acres: block.area_acres || 0,
          perimetro: block.perimetro || 0,
          cor: block.cor || '',
          fazenda_id: block.fazenda_id || '',
          produto: block.produto || '',
          data_plant: block.data_plantio || '',
          data_colh: block.data_colheita || '',
          observ: block.observacoes || ''
        }
      }));

      const geojson = {
        type: "FeatureCollection",
        features: features
      };

      // Gerar Shapefile usando shp-write
      const options = {
        folder: 'blocos',
        types: {
          polygon: 'blocos'
        }
      };

      shpwrite.download(geojson, options);
      toast.success("Arquivo Shapefile gerado com sucesso!");
    } catch (error) {
      console.error('Erro ao exportar Shapefile:', error);
      toast.error("Não foi possível gerar o arquivo. Tente novamente.");
    }
  };

  // Import handlers
  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
      handleImportGeoJSON(file);
    } else if (fileName.endsWith('.zip')) {
      handleImportShapefile(file);
    } else {
      toast.error("Formato inválido. Aceito apenas .geojson, .json ou .zip contendo shapefile.");
    }

    // Reset input
    event.target.value = '';
  };

  const handleImportGeoJSON = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const geojson = JSON.parse(content);
        
        if (geojson.type !== 'FeatureCollection' || !geojson.features) {
          throw new Error('Formato GeoJSON inválido');
        }

        const importedBlocks = geojson.features.map((feature: any, index: number) => {
          const coords = feature.geometry.coordinates[0];
          const props = feature.properties || {};
          
          return {
            nome: props.nome || `Bloco Importado ${index + 1}`,
            coordenadas: coords,
            area_m2: props.area_m2 || 0,
            area_acres: props.area_acres || 0,
            perimetro: props.perimetro || 0,
            cor: props.cor || '#10B981',
            transparencia: props.transparencia || 0.4,
            fazenda_id: selectedFarm?.id || null,
            produto: props.produto || null,
            data_plantio: props.data_plantio || props.data_plant || null,
            data_colheita: props.data_colheita || props.data_colh || null,
            observacoes: props.observacoes || props.observ || null
          };
        });

        // Salvar blocos no banco
        for (const block of importedBlocks) {
          await createBlock(block);
        }

        // Centralizar mapa nos blocos importados
        if (importedBlocks.length > 0) {
          const firstBlock = importedBlocks[0];
          const center = firstBlock.coordenadas[0];
          setCenterCoordinates([center[0], center[1]]);
        }

        toast.success(`${importedBlocks.length} blocos importados com sucesso!`);
      } catch (error) {
        console.error('Erro ao importar GeoJSON:', error);
        toast.error("Formato inválido ou arquivos incompletos.");
      }
    };

    reader.readAsText(file);
  };

  const handleImportShapefile = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const geojson = await shp(arrayBuffer);
      
      if (!geojson.features || geojson.features.length === 0) {
        throw new Error('Shapefile vazio ou inválido');
      }

      const importedBlocks = geojson.features.map((feature: any, index: number) => {
        const coords = feature.geometry.coordinates[0];
        const props = feature.properties || {};
        
        return {
          nome: props.nome || props.name || `Bloco Importado ${index + 1}`,
          coordenadas: coords,
          area_m2: props.area_m2 || props.area || 0,
          area_acres: props.area_acres || props.acres || 0,
          perimetro: props.perimetro || props.perimeter || 0,
          cor: props.cor || props.color || '#10B981',
          transparencia: props.transparencia || 0.4,
          fazenda_id: selectedFarm?.id || null,
          produto: props.produto || props.product || null,
          data_plantio: props.data_plant || props.plant_date || null,
          data_colheita: props.data_colh || props.harvest_date || null,
          observacoes: props.observ || props.notes || null
        };
      });

      // Salvar blocos no banco
      for (const block of importedBlocks) {
        await createBlock(block);
      }

      // Centralizar mapa nos blocos importados
      if (importedBlocks.length > 0) {
        const firstBlock = importedBlocks[0];
        const center = firstBlock.coordenadas[0];
        setCenterCoordinates([center[0], center[1]]);
      }

      toast.success(`${importedBlocks.length} blocos importados com sucesso!`);
    } catch (error) {
      console.error('Erro ao importar Shapefile:', error);
      toast.error("Formato inválido ou arquivos incompletos.");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 h-full">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <MapPin className="w-5 h-5 text-gray-500" />
            <h1 className="text-2xl font-semibold">Editor de Mapa Avançado</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => setPrintMode(!printMode)} variant="outline">
              {printMode ? 'Desativar Modo Impressão' : 'Ativar Modo Impressão'}
            </Button>
            <a
              href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Precisa de ajuda?
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Fazenda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingFarms ? (
                  <p>Carregando fazendas...</p>
                ) : isErrorFarms ? (
                  <p>Erro ao carregar fazendas.</p>
                ) : (
                  <Select value={selectedFarmId || ''} onValueChange={handleFarmChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma fazenda" />
                    </SelectTrigger>
                    <SelectContent>
                      {farms?.map((farm) => (
                        <SelectItem key={farm.id} value={farm.id}>
                          {farm.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {selectedFarm && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900 mb-2">Dados da Fazenda</h4>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div>
                        <span className="text-green-700">Nome:</span>
                        <p className="font-medium">{selectedFarm.nome}</p>
                      </div>
                      <div>
                        <span className="text-green-700">Localização:</span>
                        <p className="font-medium">{selectedFarm.localizacao}</p>
                      </div>
                      <div>
                        <span className="text-green-700">Área Total:</span>
                        <p className="font-medium">{selectedFarm.area_total} hectares</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Pencil className="w-5 h-5" />
                  Desenho
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Cor do Bloco</Label>
                  <Input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transparency-slider">
                    Transparência: {Math.round((1 - transparency) * 100)}%
                  </Label>
                  <Slider
                    id="transparency-slider"
                    value={[transparency]}
                    onValueChange={(value) => setTransparency(value[0])}
                    max={1}
                    min={0}
                    step={0.01}
                    className="w-full mt-2"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => setDrawingMode('polygon')}
                    variant={drawingMode === 'polygon' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Desenhar
                  </Button>
                  <Button
                    onClick={() => setDrawingMode('edit')}
                    variant={drawingMode === 'edit' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Button>
                  <Button
                    onClick={() => setDrawingMode('delete')}
                    variant={drawingMode === 'delete' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Deletar
                  </Button>
                  <Button
                    onClick={() => setDrawingMode('measure')}
                    variant={drawingMode === 'measure' ? 'default' : 'outline'}
                    className="flex items-center gap-2"
                  >
                    <Ruler className="w-4 h-4" />
                    Medir
                  </Button>
                  <Button
                    onClick={() => setDrawingMode(null)}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <MousePointer className="w-4 h-4" />
                    Limpar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Camadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="background-switch">Mostrar Fundo</Label>
                  <Switch
                    id="background-switch"
                    checked={showBackground}
                    onCheckedChange={setShowBackground}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="satellite-switch">Mostrar Satélite</Label>
                  <Switch
                    id="satellite-switch"
                    checked={showSatellite}
                    onCheckedChange={setShowSatellite}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="ndvi-switch">Mostrar NDVI</Label>
                  <Switch id="ndvi-switch" checked={showNDVI} onCheckedChange={setShowNDVI} />
                </div>
              </CardContent>
            </Card>

            {/* Export/Import Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Exportar/Importar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Exportar Blocos</Label>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleExportGeoJSON}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={blocks?.length === 0}
                    >
                      GeoJSON
                    </Button>
                    <Button
                      onClick={handleExportShapefile}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      disabled={blocks?.length === 0}
                    >
                      Shapefile
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Importar Arquivo</Label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".geojson,.json,.zip"
                      onChange={handleImportFile}
                      className="cursor-pointer"
                    />
                    <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                  <p className="text-xs text-gray-500">
                    Aceita .geojson, .json ou .zip (shapefile)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Ajustes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  Salvar Configurações
                </Button>
                <Button variant="destructive" className="w-full">
                  Resetar Configurações
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 h-full">
            <Card className="h-full">
              <LocationSearch setCenterCoordinates={setCenterCoordinates} setBoundingBox={setBoundingBox} />
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
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdvancedMapEditor;
