
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { 
  MousePointer2, 
  Pentagon, 
  Edit2, 
  Trash2, 
  Ruler, 
  Save,
  Palette,
  Move,
  Eye,
  EyeOff
} from 'lucide-react';

interface MapContextMenuProps {
  children: React.ReactNode;
  drawingMode: 'polygon' | 'edit' | 'delete' | 'measure' | 'multiselect' | null;
  onModeChange: (mode: 'polygon' | 'edit' | 'delete' | 'measure' | 'multiselect' | null) => void;
  onColorChange: (color: string) => void;
  selectedColor: string;
  transparency: number;
  onTransparencyChange: (transparency: number) => void;
  showSatellite: boolean;
  onToggleSatellite: () => void;
  showBackground: boolean;
  onToggleBackground: () => void;
  printMode: boolean;
  onTogglePrintMode: () => void;
  onSaveMap?: () => void;
}

const colorOptions = [
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Amarelo' },
  { value: '#EF4444', label: 'Vermelho' },
  { value: '#F97316', label: 'Laranja' },
  { value: '#8B5CF6', label: 'Roxo' },
  { value: '#3B82F6', label: 'Azul' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#06B6D4', label: 'Turquesa' },
];

export const MapContextMenu: React.FC<MapContextMenuProps> = ({
  children,
  drawingMode,
  onModeChange,
  onColorChange,
  selectedColor,
  transparency,
  onTransparencyChange,
  showSatellite,
  onToggleSatellite,
  showBackground,
  onToggleBackground,
  printMode,
  onTogglePrintMode,
  onSaveMap
}) => {
  const handleModeChange = (mode: typeof drawingMode) => {
    onModeChange(mode);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-white border shadow-lg z-50">
        {/* Modos de Desenho */}
        <ContextMenuItem 
          onClick={() => handleModeChange(null)}
          className={drawingMode === null ? 'bg-blue-50 text-blue-700' : ''}
        >
          <MousePointer2 className="w-4 h-4 mr-2" />
          Modo Seleção
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => handleModeChange('polygon')}
          className={drawingMode === 'polygon' ? 'bg-blue-50 text-blue-700' : ''}
        >
          <Pentagon className="w-4 h-4 mr-2" />
          Desenhar Bloco
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => handleModeChange('edit')}
          className={drawingMode === 'edit' ? 'bg-blue-50 text-blue-700' : ''}
        >
          <Edit2 className="w-4 h-4 mr-2" />
          Editar Bloco
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => handleModeChange('multiselect')}
          className={drawingMode === 'multiselect' ? 'bg-blue-50 text-blue-700' : ''}
        >
          <MousePointer2 className="w-4 h-4 mr-2" />
          Multiseleção
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => handleModeChange('measure')}
          className={drawingMode === 'measure' ? 'bg-blue-50 text-blue-700' : ''}
        >
          <Ruler className="w-4 h-4 mr-2" />
          Medir Distância
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={() => handleModeChange('delete')}
          className={drawingMode === 'delete' ? 'bg-red-50 text-red-700' : ''}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Deletar Bloco
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* Cores */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center">
            <Palette className="w-4 h-4 mr-2" />
            Cor do Bloco
            <div 
              className="w-4 h-4 rounded-full border border-gray-300 ml-auto"
              style={{ backgroundColor: selectedColor }}
            />
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="bg-white border shadow-lg z-50">
            {colorOptions.map((color) => (
              <ContextMenuItem 
                key={color.value}
                onClick={() => onColorChange(color.value)}
                className={selectedColor === color.value ? 'bg-blue-50' : ''}
              >
                <div 
                  className="w-4 h-4 rounded-full border border-gray-300 mr-2"
                  style={{ backgroundColor: color.value }}
                />
                {color.label}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Transparência */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="flex items-center">
            <Eye className="w-4 h-4 mr-2" />
            Transparência ({Math.round((1 - transparency) * 100)}%)
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="bg-white border shadow-lg z-50">
            <ContextMenuItem onClick={() => onTransparencyChange(0)}>
              Opaco (100%)
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onTransparencyChange(0.2)}>
              Pouco Transparente (80%)
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onTransparencyChange(0.4)}>
              Médio (60%)
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onTransparencyChange(0.6)}>
              Transparente (40%)
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onTransparencyChange(0.8)}>
              Muito Transparente (20%)
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* Visualização */}
        <ContextMenuItem onClick={onToggleBackground}>
          {showBackground ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showBackground ? 'Ocultar Fundo' : 'Mostrar Fundo'}
        </ContextMenuItem>
        
        <ContextMenuItem onClick={onToggleSatellite}>
          {showSatellite ? <Move className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
          {showSatellite ? 'Vista Normal' : 'Vista Satélite'}
        </ContextMenuItem>
        
        <ContextMenuItem onClick={onTogglePrintMode}>
          <Eye className="w-4 h-4 mr-2" />
          {printMode ? 'Sair do Modo Impressão' : 'Modo Impressão'}
        </ContextMenuItem>

        {onSaveMap && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onSaveMap}>
              <Save className="w-4 h-4 mr-2" />
              Salvar Mapa
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
