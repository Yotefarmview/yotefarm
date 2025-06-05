
import React from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTranslation } from 'react-i18next';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ProductsChart: React.FC = () => {
  const { t } = useTranslation();

  const data = {
    labels: ['Herbicida', 'Fungicida', 'Inseticida', 'Fertilizante', 'Regulador'],
    datasets: [
      {
        label: t('common.liters'),
        data: [120, 85, 65, 200, 45],
        backgroundColor: [
          '#10B981',
          '#3B82F6',
          '#F59E0B',
          '#8B5CF6',
          '#EF4444'
        ],
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#F3F4F6',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t('dashboard.productsApplied')}
      </h3>
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>
    </motion.div>
  );
};

export default ProductsChart;
