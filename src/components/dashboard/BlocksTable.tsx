
import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Edit, Eye } from 'lucide-react';

interface Block {
  id: string;
  nome: string;
  area_acres: number;
  produto_aplicado: string;
  data_plantio: string;
  ultima_aplicacao: string;
  proxima_colheita: string;
  cor: string;
}

interface BlocksTableProps {
  blocks: Block[];
}

const BlocksTable: React.FC<BlocksTableProps> = ({ blocks }) => {
  const { t } = useTranslation();

  const mockBlocks: Block[] = [
    {
      id: '1',
      nome: 'Bloco Norte A',
      area_acres: 12.5,
      produto_aplicado: 'Herbicida XYZ',
      data_plantio: '2024-03-15',
      ultima_aplicacao: '2024-11-20',
      proxima_colheita: '2025-07-15',
      cor: '#10B981'
    },
    {
      id: '2',
      nome: 'Bloco Sul B',
      area_acres: 8.2,
      produto_aplicado: 'Fertilizante ABC',
      data_plantio: '2024-02-10',
      ultima_aplicacao: '2024-11-18',
      proxima_colheita: '2025-06-10',
      cor: '#3B82F6'
    },
    {
      id: '3',
      nome: 'Bloco Leste C',
      area_acres: 15.7,
      produto_aplicado: 'Fungicida DEF',
      data_plantio: '2024-04-01',
      ultima_aplicacao: '2024-11-25',
      proxima_colheita: '2025-08-01',
      cor: '#F59E0B'
    }
  ];

  const displayBlocks = blocks.length > 0 ? blocks : mockBlocks;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('dashboard.blocksTable')}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                {t('dashboard.blockName')}
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                {t('dashboard.area')}
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                {t('dashboard.productApplied')}
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                {t('dashboard.plantingDate')}
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                {t('dashboard.lastHarvest')}
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                {t('dashboard.nextHarvest')}
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                {t('dashboard.blockColor')}
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700">
                {t('common.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayBlocks.map((block, index) => (
              <motion.tr
                key={block.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-3 px-4 font-medium text-gray-900">
                  {block.nome}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {block.area_acres} {t('common.acres')}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {block.produto_aplicado}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {new Date(block.data_plantio).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {new Date(block.ultima_aplicacao).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 text-gray-600">
                  {new Date(block.proxima_colheita).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: block.cor }}
                  />
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button className="p-1 text-gray-500 hover:text-blue-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-500 hover:text-green-600 transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default BlocksTable;
