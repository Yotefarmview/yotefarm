import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MapComponent from '@/components/mapEditor/MapComponent';
import MapControls from '@/components/mapEditor/MapControls';
import LocationSearch from '@/components/mapEditor/LocationSearch';
import BlockForm from '@/components/mapEditor/BlockForm';
import ShapefileImporter from '@/components/mapEditor/ShapefileImporter';
import { useBlocks } from '@/hooks/useBlocks';
import { useFarms } from '@/hooks/useFarms';
import { toast } from '@/hooks/use-toast';

const MapEditor: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const fazendaId = searchParams.get('fazenda');
  
  const { blocks, addBlock, updateBlock, deleteBlock } = useBlocks(fazendaId);
  const { farms } = useFarms();
  
  const [selectedColor, setSelectedColor] = useState('#10B981');
  const [transparency, setTransparency] = useState(0.4);
  const [showSatellite, setShowSatellite] = useState(false);
  const [showBackground, setShowBackground] = useState(true);
  const [printMode, setPrintMode] = useState(false);
  const [showNDVI, setShowNDVI] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'edit' | 'delete' | 'measure' | null>(null);
  const [drawnPolygon, setDrawnPolygon] = useState<any>(null);
  const [centerCoordinates, setCenterCoordinates] = useState<[number, number] | undefined>();
  const [boundingBox, setBoundingBox] = useState<[number, number, number, number] | undefined>();

  const handlePolygonDrawn = useCallback((blockData: any) => {
    addBlock(blockData);
    toast({
      title: t('mapEditor.blockCreated'),
      description: t('mapEditor.blockCreatedDesc'),
    });
  }, [addBlock, t]);

  const handleBlockUpdate = useCallback((blockId: string, updates: any) => {
    updateBlock(blockId, updates);
    toast({
      title: t('mapEditor.blockUpdated'),
      description: t('mapEditor.blockUpdatedDesc'),
    });
  }, [updateBlock, t]);

  const handleBlockDelete = useCallback((blockId: string) => {
    deleteBlock(blockId);
    toast({
      title: t('mapEditor.blockDeleted'),
      description: t('mapEditor.blockDeletedDesc'),
    });
  }, [deleteBlock, t]);

  const handleLocationSearch = useCallback((coordinates: [number, number]) => {
    setCenterCoordinates(coordinates);
  }, []);

  const handleBoundingBoxSearch = useCallback((boundingBox: [number, number, number, number]) => {
    setBoundingBox(boundingBox);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white shadow-md py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-semibold text-gray-800">{t('mapEditor.title')}</h1>
        </div>
      </header>

      <div className="flex flex-grow">
        <aside className="w-80 bg-gray-100 p-4 border-r">
          <MapControls
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            transparency={transparency}
            onTransparencyChange={setTransparency}
            showSatellite={showSatellite}
            onShowSatelliteChange={setShowSatellite}
            showBackground={showBackground}
            onShowBackgroundChange={setShowBackground}
            printMode={printMode}
            onPrintModeChange={setPrintMode}
            showNDVI={showNDVI}
            onShowNDVIChange={setShowNDVI}
            drawingMode={drawingMode}
            onDrawingModeChange={setDrawingMode}
          />
          
         {/* <ShapefileImporter onBlocksImport={handleBlocksImport} /> */}
          <LocationSearch onLocationFound={handleLocationSearch} onBoundingBoxFound={handleBoundingBoxSearch} />
        </aside>

        <main className="flex-1 p-4">
          <MapComponent
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
            centerCoordinates={centerCoordinates}
            boundingBox={boundingBox}
          />
        </main>

        {/* Right Sidebar - Block Form */}
        {drawnPolygon && (
          <aside className="w-96 bg-gray-100 p-4 border-l">
            <BlockForm
              area={drawnPolygon.area}
              perimeter={drawnPolygon.perimeter}
              onSave={(blockData) => {
                addBlock(blockData);
                setDrawnPolygon(null);
              }}
            />
          </aside>
        )}
      </div>
    </div>
  );
};

export default MapEditor;
