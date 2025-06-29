
import React, { useState } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ColorFilterDropdownProps {
  visibleColors: string[];
  onColorVisibilityChange: (colors: string[]) => void;
}

const ColorFilterDropdown: React.FC<ColorFilterDropdownProps> = ({
  visibleColors,
  onColorVisibilityChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

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

  const handleColorVisibilityToggle = (colorValue: string, checked: boolean) => {
    let newVisibleColors;
    if (checked) {
      newVisibleColors = [...visibleColors, colorValue];
    } else {
      newVisibleColors = visibleColors.filter(color => color !== colorValue);
    }
    onColorVisibilityChange(newVisibleColors);
  };

  const toggleAllColors = () => {
    if (visibleColors.length === colors.length) {
      onColorVisibilityChange([]);
    } else {
      onColorVisibilityChange(colors.map(c => c.value));
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        Filtrar Cores
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-sm font-medium text-gray-700">
              Filtro de Cores
            </h5>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllColors}
              className="text-xs px-2 py-1 h-6"
            >
              {visibleColors.length === colors.length ? 'Ocultar Todas' : 'Mostrar Todas'}
            </Button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {colors.map((color) => (
              <div key={color.value} className="flex items-center space-x-3">
                <Checkbox
                  id={`dropdown-color-${color.value}`}
                  checked={visibleColors.includes(color.value)}
                  onCheckedChange={(checked) => handleColorVisibilityToggle(color.value, !!checked)}
                />
                <div className="flex items-center gap-2 flex-1">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0"
                    style={{ backgroundColor: color.value }}
                  />
                  <Label 
                    htmlFor={`dropdown-color-${color.value}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    <span className="font-medium">{color.label}</span>
                    <span className="text-xs text-gray-500 ml-1">({color.name})</span>
                  </Label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overlay para fechar o dropdown quando clicar fora */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default ColorFilterDropdown;
