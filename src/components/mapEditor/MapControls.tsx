
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
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface MapControlsProps {
  showSatellite: boolean;
  onToggleSatellite: () => void;
  showBackground: boolean;
  onToggleBackground: () => void;
  printMode: boolean;
  onTogglePrintMode: () => void;
  showNDVI: boolean;
  onToggleNDVI: () => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  transparency: number;
  onTransparencyChange: (value: number) => void;
  drawingMode: 'polygon' | 'edit' | 'delete' | null;
  onDrawingModeChange: (mode: 'polygon' | 'edit' | 'delete' | null) => void;
  onCenterMap: () => void;
  visibleColors: string[];
  onVisibleColorsChange: (colors: string[]) => void;
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
  selectedColor,
  onColorChange,
  transparency,
  onTransparencyChange,
  drawingMode,
  onDrawingModeChange,
  onCenterMap,
  visibleColors,
  onVisibleColorsChange
}) => {
  const { t } = useTranslation();

  const colors = [
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

  const handleColorVisibilityChange = (color: string, checked: boolean) => {
    if (checked) {
      onVisibleColorsChange([...visibleColors, color]);
    } else {
      onVisibleColorsChange(visibleColors.filter(c => c !== color));
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
        
        <div className="grid grid-cols-3 gap-2">
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

          <Button
            variant={drawingMode === 'delete' ? "destructive" : "outline"}
            size="sm"
            onClick={() => onDrawingModeChange(drawingMode === 'delete' ? null : 'delete')}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Deletar
          </Button>
        </div>
      </div>

      {/* Seleção de Cor para Desenho */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Cor para Desenhar
        </h4>
        
        <div className="grid grid-cols-3 gap-2">
          {colors.map((color) => (
            <button
              key={color.value}
              onClick={() => onColorChange(color.value)}
              className={`p-2 rounded border-2 transition-all ${
                selectedColor === color.value 
                  ? 'border-gray-900 ring-2 ring-gray-300' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color.value }}
              title={`${color.label} - ${color.name}`}
            >
              <span className="sr-only">{color.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Layers de Cores Visíveis */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Layers Visíveis
        </h4>
        
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {colors.map((color) => (
            <div key={color.value} className="flex items-center space-x-3">
              <Checkbox
                id={`color-${color.value}`}
                checked={visibleColors.includes(color.value)}
                onCheckedChange={(checked) => handleColorVisibilityChange(color.value, !!checked)}
              />
              <div 
                className="w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: color.value }}
              />
              <Label 
                htmlFor={`color-${color.value}`}
                className="text-xs cursor-pointer flex-1"
              >
                <span className="font-medium">{color.label}</span>
                <span className="text-gray-500 ml-1">{color.name}</span>
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Transparência */}
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
  );
};

export default MapControls;
