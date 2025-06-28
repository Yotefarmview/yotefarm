
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface MapControlsProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  transparency: number;
  onTransparencyChange: (value: number) => void;
  showSatellite: boolean;
  onShowSatelliteChange: (show: boolean) => void;
  showBackground: boolean;
  onShowBackgroundChange: (show: boolean) => void;
  printMode: boolean;
  onPrintModeChange: (print: boolean) => void;
  showNDVI: boolean;
  onShowNDVIChange: (show: boolean) => void;
  drawingMode: 'polygon' | 'edit' | 'delete' | 'measure' | null;
  onDrawingModeChange: (mode: 'polygon' | 'edit' | 'delete' | 'measure' | null) => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  showSatellite,
  onShowSatelliteChange,
  showBackground,
  onShowBackgroundChange,
  printMode,
  onPrintModeChange,
  showNDVI,
  onShowNDVIChange,
  selectedColor,
  onColorChange,
  transparency,
  onTransparencyChange,
  drawingMode,
  onDrawingModeChange
}) => {
  const { t } = useTranslation();

  const colors = [
    { value: '#10B981', label: 'Green' },
    { value: '#F59E0B', label: 'Yellow' },
    { value: '#EF4444', label: 'Red' },
    { value: '#F97316', label: 'Orange' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#FFFFFF', label: 'White' },
    { value: '#3B82F6', label: 'Blue' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#06B6D4', label: 'Turquoise' }
  ];

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
            onClick={() => onShowSatelliteChange(!showSatellite)}
            className="flex items-center gap-2"
          >
            {showSatellite ? <Satellite className="w-4 h-4" /> : <Map className="w-4 h-4" />}
            {showSatellite ? 'Satélite' : 'Mapa'}
          </Button>

          <Button
            variant={printMode ? "default" : "outline"}
            size="sm"
            onClick={() => onPrintModeChange(!printMode)}
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
            onClick={() => onShowBackgroundChange(!showBackground)}
            className="flex items-center gap-2"
          >
            {showBackground ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Fundo
          </Button>

          <Button
            variant={showNDVI ? "default" : "outline"}
            size="sm"
            onClick={() => onShowNDVIChange(!showNDVI)}
            className="flex items-center gap-2"
          >
            <Layers className="w-4 h-4" />
            NDVI
          </Button>
        </div>
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

      {/* Configurações de Cor */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Cor do Bloco
        </h4>
        
        <Select value={selectedColor} onValueChange={onColorChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {colors.map((color) => (
              <SelectItem key={color.value} value={color.value}>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: color.value }}
                  />
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
