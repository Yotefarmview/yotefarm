
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, Sprout, Calendar, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';

interface Application {
  id: string;
  produto: string;
  quantidade: number;
  valor: number;
  bloco_alvo: string;
  data_aplicacao: string;
  proxima_aplicacao: string;
  acres_aplicados: number;
}

const Applications: React.FC = () => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState<Application[]>([
    {
      id: '1',
      produto: 'Herbicida XYZ',
      quantidade: 50,
      valor: 2500,
      bloco_alvo: 'Bloco Norte A',
      data_aplicacao: '2024-11-20',
      proxima_aplicacao: '2024-12-20',
      acres_aplicados: 25
    },
    {
      id: '2',
      produto: 'Fertilizante ABC',
      quantidade: 75,
      valor: 3200,
      bloco_alvo: 'Bloco Sul B',
      data_aplicacao: '2024-11-18',
      proxima_aplicacao: '2024-12-18',
      acres_aplicados: 35
    }
  ]);

  const [newApplication, setNewApplication] = useState({
    produto: '',
    quantidade: '',
    valor: '',
    bloco_alvo: '',
    data_aplicacao: '',
    proxima_aplicacao: '',
    acres_aplicados: ''
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const application: Application = {
      id: Date.now().toString(),
      produto: newApplication.produto,
      quantidade: parseFloat(newApplication.quantidade),
      valor: parseFloat(newApplication.valor),
      bloco_alvo: newApplication.bloco_alvo,
      data_aplicacao: newApplication.data_aplicacao,
      proxima_aplicacao: newApplication.proxima_aplicacao,
      acres_aplicados: parseFloat(newApplication.acres_aplicados)
    };

    setApplications([...applications, application]);
    setNewApplication({
      produto: '',
      quantidade: '',
      valor: '',
      bloco_alvo: '',
      data_aplicacao: '',
      proxima_aplicacao: '',
      acres_aplicados: ''
    });
    setIsDialogOpen(false);
  };

  const totalValue = applications.reduce((sum, app) => sum + app.valor, 0);
  const totalQuantity = applications.reduce((sum, app) => sum + app.quantidade, 0);
  const totalAcres = applications.reduce((sum, app) => sum + app.acres_aplicados, 0);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('applications.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            Agricultural product application control
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              {t('applications.newApplication')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('applications.newApplication')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="produto">{t('applications.product')}</Label>
                <Input
                  id="produto"
                  value={newApplication.produto}
                  onChange={(e) => setNewApplication({...newApplication, produto: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantidade">{t('applications.quantity')}</Label>
                <Input
                  id="quantidade"
                  type="number"
                  step="0.1"
                  value={newApplication.quantidade}
                  onChange={(e) => setNewApplication({...newApplication, quantidade: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="acres_aplicados">Applied Area (acres)</Label>
                <Input
                  id="acres_aplicados"
                  type="number"
                  step="0.1"
                  value={newApplication.acres_aplicados}
                  onChange={(e) => setNewApplication({...newApplication, acres_aplicados: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="valor">{t('applications.value')}</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={newApplication.valor}
                  onChange={(e) => setNewApplication({...newApplication, valor: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="bloco_alvo">{t('applications.targetBlock')}</Label>
                <Input
                  id="bloco_alvo"
                  value={newApplication.bloco_alvo}
                  onChange={(e) => setNewApplication({...newApplication, bloco_alvo: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="data_aplicacao">{t('applications.applicationDate')}</Label>
                <Input
                  id="data_aplicacao"
                  type="date"
                  value={newApplication.data_aplicacao}
                  onChange={(e) => setNewApplication({...newApplication, data_aplicacao: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="proxima_aplicacao">{t('applications.nextApplication')}</Label>
                <Input
                  id="proxima_aplicacao"
                  type="date"
                  value={newApplication.proxima_aplicacao}
                  onChange={(e) => setNewApplication({...newApplication, proxima_aplicacao: e.target.value})}
                />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                {t('applications.save')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Applied</p>
              <p className="text-2xl font-bold text-gray-900">{totalQuantity} L</p>
              <p className="text-sm text-gray-500">{totalAcres} acres</p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">$ {totalValue.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Applications</p>
              <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Applications History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {t('applications.history')}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  {t('applications.product')}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  {t('applications.quantity')}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Applied Area
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  {t('applications.value')}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  {t('applications.targetBlock')}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  {t('applications.applicationDate')}
                </th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  {t('applications.nextApplication')}
                </th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application, index) => (
                <motion.tr
                  key={application.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {application.produto}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {application.quantidade} L
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {application.acres_aplicados} acres
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    $ {application.valor.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {application.bloco_alvo}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(application.data_aplicacao).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(application.proxima_aplicacao).toLocaleDateString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Applications;
