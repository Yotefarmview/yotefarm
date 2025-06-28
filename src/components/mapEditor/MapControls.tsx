
import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Map, 
  Satellite, 
  Eye, 
  EyeOff, 
  Printer, 
  Layers, 
  Target,
  Palette,
  Square,
  Edit3,
  Trash2,
  Ruler
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';

interface MapControlsProps {
  showSatellite: boolean;
  onToggleSatellite: () => void;
  showBackground: boolean;
  onToggleBackground: () => void;
  printMode: boolean;
  onTogglePrintMode: () => void;
  showNDVI: boolean;
  onToggleNDVI: () => void;
  selectedColors: string[];
  onColorSelectionChange: (colors: string[]) => void;
  transparency: number;
  onTransparencyChange: (value: number) => void;
  drawingMode: 'polygon' | 'edit' | 'delete' | 'measure' | null;
  onDrawingModeChange: (mode: 'polygon' | 'edit' | 'delete' | 'measure' | null) => void;
  onCenterMap: () => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  showSatellite,
  onToggleSatellite,
  showBackground,
  onToggleBackground,
  printMode,
  onTogglePrintMode,
  showNDVI,
  onToggleNDVI,
  selectedColors,
  onColorSelectionChange,
  transparency,
  onTransparencyChange,
  drawingMode,
  onDrawingModeChange,
  onCenterMap
}) => {
  const { t } = useTranslation();

  const colors = [
    { value: '#10B981', label: 'Green', name: 'Verde' },
    { value: '#F59E0B', label: 'Yellow', name: 'Amarelo' },
    { value: '#EF4444', label: 'Red', name: 'Vermelho' },
    { value: '#F97316', label: 'Orange', name: 'Laranja' },
    { value: '#8B5CF6', label: 'Purple', name: 'Roxo' },
    { value: '#FFFFFF', label: 'White', name: 'Branco' },
    { value: '#3B82F6', label: 'Blue', name: 'Azul' },
    { value: '#EC4899', label: 'Pink', name: 'Rosa' },
    { value: '#06B6D4', label: 'Turquoise', name: 'Turquesa' }
  ];

  const handleColorToggle = (colorValue: string) => {
    const isSelected = selectedColors.includes(colorValue);
    if (isSelected) {
      // Remove cor da seleção
      onColorSelectionChange(selectedColors.filter(c => c !== colorValue));
    } else {
      // Adiciona cor à seleção
      onColorSelectionChange([...selectedColors, colorValue]);
    }
  };

  const handleSelectAll = () => {
    if (selectedColors.length === colors.length) {
      // Se todas estão selecionadas, desseleciona todas
      onColorSelectionChange([]);
    } else {
      // Seleciona todas
      onColorSelectionChange(colors.map(c => c.value));
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Controles do Mapa
      </h3>

      {/* Visualização */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Visualização</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={showSatellite ? "default" : "outline"}
            size="sm"
            onClick={onToggleSatellite}
            className="flex items-center gap-2"
          >
            {showSatellite ? <Satellite className="w-4 h-4" /> : <Map className="w-4 h-4" />}
            {showSatellite ? 'Satélite' : 'Mapa'}
          </Button>

          <Button
            variant={printMode ? "default" : "outline"}
            size="sm"
            onClick={onTogglePrintMode}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Impressão
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={showBackground ? "default" : "outline"}
            size="sm"
            onClick={onToggleBackground}
            className="flex items-center gap-2"
          >
            {showBackground ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Fundo
          </Button>

          <Button
            variant={showNDVI ? "default" : "outline"}
            size="sm"
            onClick={onToggleNDVI}
            className="flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            NDVI
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onCenterMap}
          className="w-full flex items-center gap-2"
        >
          <Target className="w-4 h-4" />
          Centralizar
        </Button>
      </div>

      {/* Ferramentas de Desenho */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Ferramentas</h4>
        
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={drawingMode === 'polygon' ? "default" : "outline"}
            size="sm"
            onClick={() => onDrawingModeChange(drawingMode === 'polygon' ? null : 'polygon')}
            className="flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Desenhar
          </Button>

          <Button
            variant={drawingMode === 'edit' ? "default" : "outline"}
            size="sm"
            onClick={() => onDrawingModeChange(drawingMode === 'edit' ? null : 'edit')}
            className="flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Editar
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={drawingMode === 'delete' ? "destructive" : "outline"}
            size="sm"
            onClick={() => onDrawingModeChange(drawingMode === 'delete' ? null : 'delete')}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Deletar
          </Button>

          <Button
            variant={drawingMode === 'measure' ? "default" : "outline"}
            size="sm"
            onClick={() => onDrawingModeChange(drawingMode === 'measure' ? null : 'measure')}
            className="flex items-center gap-2"
          >
            <Ruler className="w-4 h-4" />
            Medir
          </Button>
        </div>
      </div>

      {/* Filtros de Cor - Sistema de Layers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Filtros por Cor
          </h4>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs px-2 py-1 h-6"
          >
            {selectedColors.length === colors.length ? 'Desmarcar Todas' : 'Marcar Todas'}
          </Button>
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {colors.map((color) => (
            <div key={color.value} className="flex items-center space-x-2">
              <Checkbox
                id={`color-${color.value}`}
                checked={selectedColors.includes(color.value)}
                onCheckedChange={() => handleColorToggle(color.value)}
              />
              <div 
                className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                style={{ backgroundColor: color.value }}
              />
              <label
                htmlFor={`color-${color.value}`}
                className="text-sm font-medium cursor-pointer flex-1"
              >
                {color.name}
              </label>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
          <strong>Dica:</strong> Marque as cores que deseja visualizar no mapa. 
          Blocos com cores desmarcadas ficarão ocultos.
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-600">
            Transparência: {Math.round((1 - transparency) * 100)}%
          </label>
          <Slider
            value={[transparency]}
            onValueChange={(value) => onTransparencyChange(value[0])}
            max={1}
            min={0}
            step={0.01}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default MapControls;
