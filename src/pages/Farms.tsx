
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
import { useToast } from '@/hooks/use-toast';
import { useFarms } from '../hooks/useFarms';
import LocationSearch from '../components/mapEditor/LocationSearch';
import FarmEditDialog from '../components/FarmEditDialog';
import { Tables } from '@/integrations/supabase/types';

type Farm = Tables<'fazendas'>;

const Farms: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { farms, loading, error, createFarm, updateFarm } = useFarms();

  const [newFarm, setNewFarm] = useState({
    nome: '',
    localizacao: '',
    area_total: '',
    tipo_cana: '',
    cep: '',
    numero_fazenda: '',
    latitude: null as number | null,
    longitude: null as number | null
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handlePostalCodeSearch = async (postalCode: string) => {
    setNewFarm({...newFarm, cep: postalCode});
    
    if (postalCode.length >= 3) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(postalCode)}&limit=1&addressdetails=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          const result = data[0];
          const endereco = result.display_name;
          
          setNewFarm(prev => ({
            ...prev,
            localizacao: endereco,
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon)
          }));
          
          toast({
            title: "Código postal encontrado",
            description: `Endereço atualizado: ${endereco}`
          });
        }
      } catch (error) {
        console.error('Erro ao buscar código postal:', error);
      }
    }
  };

  const handleLocationSelect = (lat: number, lon: number) => {
    console.log('Localização selecionada:', lat, lon);
    setNewFarm(prev => ({
      ...prev,
      latitude: lat,
      longitude: lon
    }));
    
    toast({
      title: "Localização selecionada",
      description: `Coordenadas: ${lat.toFixed(6)}, ${lon.toFixed(6)}`
    });
  };

  const handleAddressUpdate = (address: string) => {
    setNewFarm(prev => ({
      ...prev,
      localizacao: address
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const areaValue = parseFloat(newFarm.area_total);
      
      // Validação para evitar overflow do campo numérico
      if (areaValue >= 100000000) { // 10^8
        toast({
          title: "Erro de Validação",
          description: "A área total deve ser menor que 100.000.000",
          variant: "destructive"
        });
        return;
      }

      // Use as coordenadas do LocationSearch se disponíveis, senão gere mock
      let latitude = newFarm.latitude;
      let longitude = newFarm.longitude;
      
      if (!latitude || !longitude) {
        // Simulate geolocation API call for coordinates (fallback)
        latitude = -21.1775 + (Math.random() - 0.5) * 0.1;
        longitude = -47.8103 + (Math.random() - 0.5) * 0.1;
      }

      const farmData = {
        nome: newFarm.nome,
        localizacao: newFarm.localizacao,
        area_total: areaValue,
        tipo_cana: newFarm.tipo_cana,
        cep: newFarm.cep,
        numero_fazenda: newFarm.numero_fazenda,
        latitude: latitude,
        longitude: longitude,
        cliente_id: null,
        data_plantio: null,
        proxima_colheita: null,
        ultima_aplicacao: null,
        observacoes: null
      };

      console.log('Enviando dados da fazenda:', farmData);
      await createFarm(farmData);
      
      setNewFarm({ 
        nome: '', 
        localizacao: '', 
        area_total: '', 
        tipo_cana: '', 
        cep: '', 
        numero_fazenda: '',
        latitude: null,
        longitude: null
      });
      setIsDialogOpen(false);
      
      toast({
        title: "Sucesso",
        description: "Fazenda criada com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao criar fazenda:', error);
      toast({
        title: "Erro",
        description: `Erro ao criar fazenda: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    }
  };

  const handleEditFarm = (farm: Farm) => {
    setEditingFarm(farm);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (farmData: Partial<Farm>) => {
    if (editingFarm) {
      await updateFarm(editingFarm.id, farmData);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-lg">Carregando fazendas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-red-600">Erro ao carregar fazendas: {error}</div>
      </div>
    );
  }

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
                <Label htmlFor="numero_fazenda">Número da Fazenda</Label>
                <Input
                  id="numero_fazenda"
                  value={newFarm.numero_fazenda}
                  onChange={(e) => setNewFarm({...newFarm, numero_fazenda: e.target.value})}
                  placeholder="Ex: FAZ001"
                />
              </div>

              <div>
                <Label htmlFor="cep">CEP / Código Postal</Label>
                <Input
                  id="cep"
                  value={newFarm.cep}
                  onChange={(e) => handlePostalCodeSearch(e.target.value)}
                  placeholder="Ex: 12345-678, SW1A 1AA, 75001"
                />
              </div>

              <div>
                <Label htmlFor="localizacao">{t('farms.location')}</Label>
                <LocationSearch
                  onLocationSelect={handleLocationSelect}
                  onAddressUpdate={handleAddressUpdate}
                  placeholder="Digite o endereço ou use o código postal acima"
                />
                <Input
                  id="localizacao"
                  value={newFarm.localizacao}
                  onChange={(e) => setNewFarm({...newFarm, localizacao: e.target.value})}
                  placeholder="Endereço completo"
                  className="mt-2"
                  required
                />
                
                {newFarm.latitude && newFarm.longitude && (
                  <div className="mt-2 text-xs text-gray-500">
                    Coordenadas salvas: {newFarm.latitude.toFixed(6)}, {newFarm.longitude.toFixed(6)}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="area_total">{t('farms.totalArea')} (hectares)</Label>
                <Input
                  id="area_total"
                  type="number"
                  step="0.01"
                  max="99999999"
                  value={newFarm.area_total}
                  onChange={(e) => setNewFarm({...newFarm, area_total: e.target.value})}
                  placeholder="Ex: 100.50"
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

      {/* Edit Dialog */}
      <FarmEditDialog
        farm={editingFarm}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveEdit}
      />

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
                {farm.numero_fazenda && (
                  <p className="text-sm text-gray-500">
                    Fazenda: {farm.numero_fazenda}
                  </p>
                )}
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <MapPin className="w-4 h-4" />
                  {farm.localizacao}
                </div>
                {farm.cep && (
                  <p className="text-xs text-gray-400 mt-1">
                    CEP: {farm.cep}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Área Total:</span>
                <span className="font-medium">{farm.area_total} hectares</span>
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
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handleEditFarm(farm)}
              >
                <Edit className="w-4 h-4 mr-2" />
                {t('farms.edit')}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {farms.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            Nenhuma fazenda cadastrada ainda
          </div>
          <p className="text-gray-400">
            Clique em "Nova Fazenda" para começar
          </p>
        </div>
      )}
    </div>
  );
};

export default Farms;
