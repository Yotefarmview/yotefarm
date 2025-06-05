
import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BarChart3, MapPin, Calendar, Sprout } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import ProductsChart from '../components/dashboard/ProductsChart';
import CaneDistributionChart from '../components/dashboard/CaneDistributionChart';
import BlocksTable from '../components/dashboard/BlocksTable';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('app.subtitle')}
          </p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('dashboard.totalAcres')}
          value="247.8"
          subtitle={t('common.acres')}
          icon={BarChart3}
          color="green"
          index={0}
        />
        <StatCard
          title={t('dashboard.activeBlocks')}
          value="12"
          subtitle="blocos"
          icon={MapPin}
          color="blue"
          index={1}
        />
        <StatCard
          title={t('dashboard.lastHarvest')}
          value="15/11/2024"
          subtitle="Bloco Norte A"
          icon={Calendar}
          color="yellow"
          index={2}
        />
        <StatCard
          title={t('dashboard.nextApplication')}
          value="08/12/2024"
          subtitle="Herbicida"
          icon={Sprout}
          color="purple"
          index={3}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductsChart />
        <CaneDistributionChart />
      </div>

      {/* Blocks Table */}
      <BlocksTable blocks={[]} />
    </div>
  );
};

export default Dashboard;
