
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Map as MapIcon, Save } from 'lucide-react';
import MapComponent from '../components/mapEditor/MapComponent';
import BlockForm from '../components/mapEditor/BlockForm';

const MapEditor: React.FC = () => {
  const { t } = useTranslation();
  const [currentPolygon, setCurrentPolygon] = useState<{
    area: number;
    perimeter: number;
    coordinates: number[][];
  } | null>(null);
  const [selectedColor, setSelectedColor] = useState('#10B981');

  const handlePolygonDrawn = (area: number, perimeter: number, coordinates: number[][]) => {
    setCurrentPolygon({ area, perimeter, coordinates });
  };

  const handleSaveBlock = (blockData: any) => {
    console.log('Saving block:', blockData);
    // Here you would save to Supabase
    setCurrentPolygon(null);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('mapEditor.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            Desenhe e gerencie blocos de plantio com precisão técnica
          </p>
        </div>
        <MapIcon className="w-8 h-8 text-green-600" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Mapa Técnico
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Cor do bloco:</span>
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-8 h-8 rounded border border-gray-300"
                />
              </div>
            </div>
            <MapComponent 
              onPolygonDrawn={handlePolygonDrawn}
              selectedColor={selectedColor}
            />
          </div>
        </motion.div>

        {/* Form Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          {currentPolygon ? (
            <BlockForm 
              area={currentPolygon.area}
              perimeter={currentPolygon.perimeter}
              onSave={handleSaveBlock}
            />
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('mapEditor.blockForm')}
              </h3>
              <p className="text-gray-600 text-center py-8">
                Desenhe um polígono no mapa para começar a definir um bloco
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-4"
      >
        <h4 className="font-medium text-blue-900 mb-2">Instruções de Uso:</h4>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Clique no mapa para começar a desenhar um polígono</li>
          <li>• Clique duplo para finalizar o desenho</li>
          <li>• Use o botão "Remover Fundo" para visualizar apenas os blocos</li>
          <li>• As áreas são calculadas automaticamente em m² e acres</li>
          <li>• Você pode modificar os polígonos após desenhar</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default MapEditor;
