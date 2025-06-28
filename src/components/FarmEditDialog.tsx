
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useToast } from '@/hooks/use-toast';
import LocationSearch from './mapEditor/LocationSearch';
import { Tables } from '@/integrations/supabase/types';

type Farm = Tables<'fazendas'>;

interface FarmEditDialogProps {
  farm: Farm | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (farmData: Partial<Farm>) => Promise<void>;
}

const FarmEditDialog: React.FC<FarmEditDialogProps> = ({
  farm,
  open,
  onOpenChange,
  onSave
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    nome: '',
    localizacao: '',
    area_total: '',
    tipo_cana: '',
    cep: '',
    numero_fazenda: '',
    latitude: null as number | null,
    longitude: null as number | null
  });

  useEffect(() => {
    if (farm) {
      setFormData({
        nome: farm.nome || '',
        localizacao: farm.localizacao || '',
        area_total: farm.area_total?.toString() || '',
        tipo_cana: farm.tipo_cana || '',
        cep: farm.cep || '',
        numero_fazenda: farm.numero_fazenda || '',
        latitude: farm.latitude ? Number(farm.latitude) : null,
        longitude: farm.longitude ? Number(farm.longitude) : null
      });
    }
  }, [farm]);

  const handlePostalCodeSearch = async (postalCode: string) => {
    setFormData({...formData, cep: postalCode});
    
    if (postalCode.length >= 3) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(postalCode)}&limit=1&addressdetails=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
          const result = data[0];
          const endereco = result.display_name;
          
          setFormData(prev => ({
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
    console.log('Coordenadas selecionadas:', lat, lon);
    setFormData(prev => ({
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
    setFormData(prev => ({
      ...prev,
      localizacao: address
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const areaValue = parseFloat(formData.area_total);
      
      if (areaValue >= 100000000) {
        toast({
          title: "Erro de Validação",
          description: "A área total deve ser menor que 100.000.000",
          variant: "destructive"
        });
        return;
      }

      const updateData = {
        nome: formData.nome,
        localizacao: formData.localizacao,
        area_total: areaValue,
        tipo_cana: formData.tipo_cana,
        cep: formData.cep,
        numero_fazenda: formData.numero_fazenda,
        latitude: formData.latitude,
        longitude: formData.longitude
      };

      await onSave(updateData);
      onOpenChange(false);
      
      toast({
        title: "Sucesso",
        description: "Fazenda atualizada com sucesso!"
      });
    } catch (error) {
      console.error('Erro ao atualizar fazenda:', error);
      toast({
        title: "Erro",
        description: `Erro ao atualizar fazenda: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Fazenda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">{t('farms.farmName')}</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="numero_fazenda">Número da Fazenda</Label>
            <Input
              id="numero_fazenda"
              value={formData.numero_fazenda}
              onChange={(e) => setFormData({...formData, numero_fazenda: e.target.value})}
              placeholder="Ex: FAZ001"
            />
          </div>

          <div>
            <Label htmlFor="cep">CEP / Código Postal</Label>
            <Input
              id="cep"
              value={formData.cep}
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
              value={formData.localizacao}
              onChange={(e) => setFormData({...formData, localizacao: e.target.value})}
              placeholder="Endereço completo"
              className="mt-2"
              required
            />
            
            {formData.latitude && formData.longitude && (
              <div className="mt-2 text-xs text-gray-500">
                Coordenadas salvas: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
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
              value={formData.area_total}
              onChange={(e) => setFormData({...formData, area_total: e.target.value})}
              placeholder="Ex: 100.50"
              required
            />
          </div>

          <div>
            <Label htmlFor="tipo_cana">{t('farms.caneType')}</Label>
            <Input
              id="tipo_cana"
              value={formData.tipo_cana}
              onChange={(e) => setFormData({...formData, tipo_cana: e.target.value})}
              placeholder="SP80-1842, RB92579, etc."
              required
            />
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
            Salvar Alterações
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FarmEditDialog;
