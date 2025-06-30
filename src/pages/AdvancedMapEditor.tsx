import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import AdvancedMapComponent from '@/components/mapEditor/AdvancedMapComponent';
import MapControls from '@/components/mapEditor/MapControls';
import AdvancedBlockForm from '@/components/mapEditor/AdvancedBlockForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ruler, Plus } from 'lucide-react';

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
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // Map controls state
  const [showSatellite, setShowSatellite] = useState(false);
  const [showBackground, setShowBackground] = useState(true);
  const [printMode, setPrintMode] = useState(false);
  const [showNDVI, setShowNDVI] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#10B981');
  const [transparency, setTransparency] = useState(0.4);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'edit' | 'delete' | 'measure' | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [quickBlockName, setQuickBlockName] = useState('');
  const [quickBlockColor, setQuickBlockColor] = useState('#10B981');
  
  // New state for visible colors/layers
  const [visibleColors, setVisibleColors] = useState<string[]>([
    '#10B981', '#F59E0B', '#EF4444', '#F97316', '#8B5CF6', 
    '#FFFFFF', '#3B82F6', '#EC4899', '#06B6D4'
  ]);

  const [centerCoordinates, setCenterCoordinates] = useState<[number, number] | undefined>(undefined);
  const [boundingBox, setBoundingBox] = useState<[number, number, number, number] | undefined>(undefined);

  const handleBoundingBoxChange = (newBoundingBox: [number, number, number, number] | undefined) => {
    setBoundingBox(newBoundingBox);
  };

  const handleCenterCoordinatesChange = (newCenterCoordinates: [number, number] | undefined) => {
    setCenterCoordinates(newCenterCoordinates);
  };

  const { data: blocks = [], isLoading, refetch } = useQuery({
    queryKey: ['blocks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blocos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar blocos:', error);
        throw error;
      }

      return data || [];
    },
  });

  const handlePolygonDrawn = useCallback(async (blockData: BlockData) => {
    console.log('Novo polígono desenhado:', blockData);

    try {
      const finalBlockData = {
        nome: quickBlockName || blockData.name,
        cor: quickBlockColor,
        transparencia: transparency,
        coordenadas: JSON.stringify(blockData.coordinates),
        area_m2: blockData.area_m2,
        area_acres: blockData.area_acres,
        perimetro: blockData.perimeter
      };

      const { data, error } = await supabase
        .from('blocos')
        .insert([finalBlockData])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar bloco:', error);
        toast({
          title: "Erro ao salvar bloco",
          description: "Houve um problema ao salvar o bloco no banco de dados.",
          variant: "destructive",
        });
        return;
      }

      console.log('Bloco salvo com sucesso:', data);
      
      toast({
        title: "Bloco criado com sucesso!",
        description: `${finalBlockData.nome} foi criado com ${blockData.area_acres.toFixed(1)} acres.`,
      });

      refetch();
      setQuickBlockName('');
      setDrawingMode(null);
    } catch (error) {
      console.error('Erro ao criar bloco:', error);
      toast({
        title: "Erro ao criar bloco",
        description: "Houve um problema ao criar o bloco.",
        variant: "destructive",
      });
    }
  }, [quickBlockName, quickBlockColor, transparency, toast, refetch]);

  const handleBlockUpdate = useCallback(async (blockId: string, updates: Partial<BlockData>) => {
    console.log('Atualizando bloco:', blockId, updates);

    try {
      const updateData: any = {};
      
      if (updates.name || updates.nome) {
        updateData.nome = updates.name || updates.nome;
      }
      if (updates.color || updates.cor) {
        updateData.cor = updates.color || updates.cor;
      }
      if (updates.transparency !== undefined) {
        updateData.transparencia = updates.transparency;
      }
      if (updates.coordinates) {
        updateData.coordenadas = JSON.stringify(updates.coordinates);
      }
      if (updates.area_m2 !== undefined) {
        updateData.area_m2 = updates.area_m2;
      }
      if (updates.area_acres !== undefined) {
        updateData.area_acres = updates.area_acres;
      }
      if (updates.perimeter !== undefined) {
        updateData.perimetro = updates.perimeter;
      }

      const { error } = await supabase
        .from('blocos')
        .update(updateData)
        .eq('id', blockId);

      if (error) {
        console.error('Erro ao atualizar bloco:', error);
        toast({
          title: "Erro ao atualizar bloco",
          description: "Houve um problema ao atualizar o bloco.",
          variant: "destructive",
        });
        return;
      }

      console.log('Bloco atualizado com sucesso');
      
      toast({
        title: "Bloco atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });

      refetch();
    } catch (error) {
      console.error('Erro ao atualizar bloco:', error);
      toast({
        title: "Erro ao atualizar bloco",
        description: "Houve um problema ao atualizar o bloco.",
        variant: "destructive",
      });
    }
  }, [toast, refetch]);

  const handleBlockDelete = useCallback(async (blockId: string) => {
    console.log('Deletando bloco:', blockId);

    try {
      const { error } = await supabase
        .from('blocos')
        .delete()
        .eq('id', blockId);

      if (error) {
        console.error('Erro ao deletar bloco:', error);
        toast({
          title: "Erro ao deletar bloco",
          description: "Houve um problema ao deletar o bloco.",
          variant: "destructive",
        });
        return;
      }

      console.log('Bloco deletado com sucesso');
      
      toast({
        title: "Bloco deletado!",
        description: "O bloco foi removido com sucesso.",
      });

      refetch();
    } catch (error) {
      console.error('Erro ao deletar bloco:', error);
      toast({
        title: "Erro ao deletar bloco",
        description: "Houve um problema ao deletar o bloco.",
        variant: "destructiveError",
      });
    }
  }, [toast, refetch]);

  const handleBlockSelect = useCallback((block: any) => {
    setSelectedBlock(block);
  }, []);

  const centerMap = useCallback(() => {
    console.log('Centralizar mapa solicitado');
  }, []);

  const colorOptions = [
    { value: '#10B981', label: 'Verde' },
    { value: '#F59E0B', label: 'Amarelo' },
    { value: '#EF4444', label: 'Vermelho' },
    { value: '#F97316', label: 'Laranja' },
    { value: '#8B5CF6', label: 'Roxo' },
    { value: '#FFFFFF', label: 'Branco' },
    { value: '#3B82F6', label: 'Azul' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#06B6D4', label: 'Turquesa' }
  ];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-full flex flex-col">
        {/* Header com controles rápidos */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Editor de Mapa Avançado
            </h1>
            <div className="flex items-center gap-4">
              <Button
                variant={drawingMode === 'measure' ? "default" : "outline"}
                size="sm"
                onClick={() => setDrawingMode(drawingMode === 'measure' ? null : 'measure')}
                className="flex items-center gap-2"
              >
                <Ruler className="w-4 h-4" />
                Medir
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowBlockForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo Bloco
              </Button>
            </div>
          </div>

          {/* Controles rápidos para desenho */}
          {drawingMode === 'polygon' && (
            <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <Label htmlFor="quick-name" className="text-sm font-medium">
                  Nome:
                </Label>
                <Input
                  id="quick-name"
                  value={quickBlockName}
                  onChange={(e) => setQuickBlockName(e.target.value)}
                  placeholder="Nome do bloco"
                  className="w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">Cor:</Label>
                <div className="flex gap-1">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setQuickBlockColor(color.value)}
                      className={`w-6 h-6 rounded border-2 ${
                        quickBlockColor === color.value 
                          ? 'border-gray-900' 
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              <div className="text-sm text-green-700">
                <strong>Modo Desenho Ativo:</strong> Clique no mapa para desenhar um polígono
              </div>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 flex gap-4 p-4">
          {/* Controls sidebar */}
          <div className="w-80 flex-shrink-0 space-y-4">
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
              onTransparencyChange={(value) => setTransparency(value)}
              drawingMode={drawingMode}
              onDrawingModeChange={setDrawingMode}
              onCenterMap={centerMap}
              visibleColors={visibleColors}
              onVisibleColorsChange={setVisibleColors}
            />
          </div>

          {/* Map */}
          <div className="flex-1">
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

      {showBlockForm && (
        <AdvancedBlockForm
          onClose={() => setShowBlockForm(false)}
          onSave={(blockData) => {
            console.log('Bloco salvo pelo formulário:', blockData);
            setShowBlockForm(false);
            refetch();
          }}
        />
      )}
    </Layout>
  );
};

export default AdvancedMapEditor;
