
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Plus, MapPin, Edit, Eye } from 'lucide-react';
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

interface Farm {
  id: string;
  nome: string;
  localizacao: string;
  area_total: number;
  tipo_cana: string;
  latitude?: number;
  longitude?: number;
}

const Farms: React.FC = () => {
  const { t } = useTranslation();
  const [farms, setFarms] = useState<Farm[]>([
    {
      id: '1',
      nome: 'Fazenda Santa Maria',
      localizacao: 'Ribeirão Preto, SP',
      area_total: 150.5,
      tipo_cana: 'SP80-1842',
      latitude: -21.1775,
      longitude: -47.8103
    },
    {
      id: '2',
      nome: 'Fazenda São José',
      localizacao: 'Sertãozinho, SP',
      area_total: 97.3,
      tipo_cana: 'RB92579',
      latitude: -21.1375,
      longitude: -47.9803
    }
  ]);

  const [newFarm, setNewFarm] = useState({
    nome: '',
    localizacao: '',
    area_total: '',
    tipo_cana: ''
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate geolocation API call
    const mockCoords = {
      latitude: -21.1775 + (Math.random() - 0.5) * 0.1,
      longitude: -47.8103 + (Math.random() - 0.5) * 0.1
    };

    const farm: Farm = {
      id: Date.now().toString(),
      nome: newFarm.nome,
      localizacao: newFarm.localizacao,
      area_total: parseFloat(newFarm.area_total),
      tipo_cana: newFarm.tipo_cana,
      latitude: mockCoords.latitude,
      longitude: mockCoords.longitude
    };

    setFarms([...farms, farm]);
    setNewFarm({ nome: '', localizacao: '', area_total: '', tipo_cana: '' });
    setIsDialogOpen(false);
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
            {t('farms.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas fazendas e propriedades
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              {t('farms.newFarm')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t('farms.newFarm')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">{t('farms.farmName')}</Label>
                <Input
                  id="nome"
                  value={newFarm.nome}
                  onChange={(e) => setNewFarm({...newFarm, nome: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="localizacao">{t('farms.location')}</Label>
                <Input
                  id="localizacao"
                  value={newFarm.localizacao}
                  onChange={(e) => setNewFarm({...newFarm, localizacao: e.target.value})}
                  placeholder="Cidade, Estado"
                  required
                />
              </div>
              <div>
                <Label htmlFor="area_total">{t('farms.totalArea')}</Label>
                <Input
                  id="area_total"
                  type="number"
                  step="0.1"
                  value={newFarm.area_total}
                  onChange={(e) => setNewFarm({...newFarm, area_total: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="tipo_cana">{t('farms.caneType')}</Label>
                <Input
                  id="tipo_cana"
                  value={newFarm.tipo_cana}
                  onChange={(e) => setNewFarm({...newFarm, tipo_cana: e.target.value})}
                  placeholder="SP80-1842, RB92579, etc."
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                {t('farms.save')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* Farms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {farms.map((farm, index) => (
          <motion.div
            key={farm.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {farm.nome}
                </h3>
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <MapPin className="w-4 h-4" />
                  {farm.localizacao}
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Área Total:</span>
                <span className="font-medium">{farm.area_total} acres</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo de Cana:</span>
                <span className="font-medium">{farm.tipo_cana}</span>
              </div>
              {farm.latitude && farm.longitude && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Coordenadas:</span>
                  <span className="font-medium text-xs">
                    {farm.latitude.toFixed(4)}, {farm.longitude.toFixed(4)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Eye className="w-4 h-4 mr-2" />
                {t('farms.view')}
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                {t('farms.edit')}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Farms;
