
import { useState, useMemo } from 'react';

interface UseColorFiltersProps {
  blocks: any[];
  defaultSelectedColors?: string[];
}

export const useColorFilters = ({ blocks, defaultSelectedColors }: UseColorFiltersProps) => {
  // Get all unique colors from blocks
  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    blocks.forEach(block => {
      if (block.cor || block.color) {
        colors.add(block.cor || block.color);
      }
    });
    return Array.from(colors);
  }, [blocks]);

  // Initialize with all colors selected by default
  const [selectedColors, setSelectedColors] = useState<string[]>(
    defaultSelectedColors || availableColors
  );

  // Update selected colors when available colors change
  React.useEffect(() => {
    if (defaultSelectedColors) return;
    
    // Add any new colors that weren't previously available
    const newColors = availableColors.filter(color => !selectedColors.includes(color));
    if (newColors.length > 0) {
      setSelectedColors(prev => [...prev, ...newColors]);
    }
  }, [availableColors, selectedColors, defaultSelectedColors]);

  // Filter blocks based on selected colors
  const filteredBlocks = useMemo(() => {
    if (selectedColors.length === 0) return [];
    return blocks.filter(block => 
      selectedColors.includes(block.cor || block.color)
    );
  }, [blocks, selectedColors]);

  // Statistics
  const totalBlocks = blocks.length;
  const visibleBlocks = filteredBlocks.length;

  return {
    selectedColors,
    setSelectedColors,
    availableColors,
    filteredBlocks,
    totalBlocks,
    visibleBlocks
  };
};

export default useColorFilters;
