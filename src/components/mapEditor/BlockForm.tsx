
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface BlockFormProps {
  area: number;
  perimeter: number;
  onSave: (blockData: any) => void;
}

const BlockForm: React.FC<BlockFormProps> = ({ area, perimeter, onSave }) => {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    nome: '',
    cor: '#10B981',
    data_plantio: '',
    ultima_aplicacao: '',
    produto_aplicado: '',
    proxima_aplicacao: '',
    proxima_colheita: '',
    tipo_cana: '',
    possui_dreno: false
  });

  const colors = [
    { value: '#10B981', label: 'Verde' },
    { value: '#F59E0B', label: 'Amarelo' },
    { value: '#EF4444', label: 'Vermelho' },
    { value: '#F97316', label: 'Laranja' },
    { value: '#8B5CF6', label: 'Roxo' },
    { value: '#FFFFFF', label: 'Branco' },
    { value: '#3B82F6', label: 'Azul' },
    { value: '#EC4899', label: 'Rosa' },
    { value: '#06B6D4', label: 'Turquesa' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const blockData = {
      ...formData,
      area_m2: area,
      area_acres: area * 0.000247105, // Convert m² to acres
      perimetro: perimeter
    };
    
    onSave(blockData);
  };

  const areaInAcres = area * 0.000247105;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t('mapEditor.blockForm')}
      </h3>

      {/* Area Information */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">{t('mapEditor.area')}:</span>
            <p className="font-medium">{area.toFixed(2)} m²</p>
            <p className="font-medium">{areaInAcres.toFixed(2)} acres</p>
          </div>
          <div>
            <span className="text-gray-600">{t('mapEditor.perimeter')}:</span>
            <p className="font-medium">{perimeter.toFixed(2)} m</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="nome">{t('mapEditor.blockName')}</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({...formData, nome: e.target.value})}
            required
          />
        </div>

        <div>
          <Label htmlFor="cor">{t('mapEditor.color')}</Label>
          <Select value={formData.cor} onValueChange={(value) => setFormData({...formData, cor: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colors.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: color.value }}
                    />
                    {color.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="data_plantio">{t('mapEditor.plantingDate')}</Label>
          <Input
            id="data_plantio"
            type="date"
            value={formData.data_plantio}
            onChange={(e) => setFormData({...formData, data_plantio: e.target.value})}
          />
        </div>

        <div>
          <Label htmlFor="produto_aplicado">{t('mapEditor.productApplied')}</Label>
          <Input
            id="produto_aplicado"
            value={formData.produto_aplicado}
            onChange={(e) => setFormData({...formData, produto_aplicado: e.target.value})}
          />
        </div>

        <div>
          <Label htmlFor="tipo_cana">{t('mapEditor.caneType')}</Label>
          <Input
            id="tipo_cana"
            value={formData.tipo_cana}
            onChange={(e) => setFormData({...formData, tipo_cana: e.target.value})}
            placeholder="SP80-1842, RB92579, etc."
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="possui_dreno"
            checked={formData.possui_dreno}
            onChange={(e) => setFormData({...formData, possui_dreno: e.target.checked})}
            className="rounded"
          />
          <Label htmlFor="possui_dreno">{t('mapEditor.hasDrain')}</Label>
        </div>

        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
          {t('mapEditor.save')}
        </Button>
      </form>
    </div>
  );
};

export default BlockForm;
