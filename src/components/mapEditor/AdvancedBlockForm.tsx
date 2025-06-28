
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, MapPin, Activity } from 'lucide-react';

interface AdvancedBlockFormProps {
  blockData?: {
    id?: string;
    area_m2: number;
    area_acres: number;
    perimeter: number;
    coordinates: number[][];
    nome?: string;
    cor?: string;
    data_plantio?: string;
    tipo_cana?: string;
    idade_cana?: string;
    ultima_aplicacao?: any;
    proxima_aplicacao?: string;
    proxima_colheita?: string;
    possui_dreno?: boolean;
  };
  onSave: (data: any) => void;
  onCancel?: () => void;
}

const AdvancedBlockForm: React.FC<AdvancedBlockFormProps> = ({
  blockData,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    nome: blockData?.nome || '',
    cor: blockData?.cor || '#10B981',
    data_plantio: blockData?.data_plantio || '',
    tipo_cana: blockData?.tipo_cana || '',
    idade_cana: blockData?.idade_cana || '',
    proxima_aplicacao: blockData?.proxima_aplicacao || '',
    proxima_colheita: blockData?.proxima_colheita || '',
    possui_dreno: blockData?.possui_dreno || false,
    produto_aplicado: blockData?.ultima_aplicacao?.produto || '',
    litros_aplicados: blockData?.ultima_aplicacao?.litros || '',
    valor_produto: blockData?.ultima_aplicacao?.valor || '',
    data_aplicacao: blockData?.ultima_aplicacao?.data || '',
    observacoes: ''
  });

  const colors = [
    { value: '#10B981', label: 'Green', name: 'Planted' },
    { value: '#F59E0B', label: 'Yellow', name: 'Mature' },
    { value: '#EF4444', label: 'Red', name: 'Problems' },
    { value: '#F97316', label: 'Orange', name: 'Harvesting' },
    { value: '#8B5CF6', label: 'Purple', name: 'Application' },
    { value: '#FFFFFF', label: 'White', name: 'Empty' },
    { value: '#3B82F6', label: 'Blue', name: 'Irrigation' },
    { value: '#EC4899', label: 'Pink', name: 'Test' },
    { value: '#06B6D4', label: 'Turquoise', name: 'Drain' }
  ];

  const caneTypes = [
    'SP80-1842', 'SP81-3250', 'RB92579', 'RB867515', 'SP94-2775',
    'CTC4', 'CTC9', 'CTC15', 'VAT90212', 'SP91-1285'
  ];

  const caneAges = [
    { value: 'plant-cane', label: 'Plant Cane' },
    { value: '1st-stubble', label: '1st Stubble' },
    { value: '2nd-stubble', label: '2nd Stubble' },
    { value: '3rd-stubble', label: '3rd Stubble' },
    { value: '4th-stubble', label: '4th Stubble' },
    { value: '5th-stubble', label: '5th Stubble' },
    { value: '6th-stubble', label: '6th Stubble' },
    { value: '7th-stubble', label: '7th Stubble' },
    { value: 'fallow', label: 'Fallow' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const saveData = {
      ...formData,
      area_m2: blockData?.area_m2,
      area_acres: blockData?.area_acres,
      perimetro: blockData?.perimeter,
      coordenadas: blockData?.coordinates,
      ultima_aplicacao: formData.produto_aplicado ? {
        produto: formData.produto_aplicado,
        litros: parseFloat(formData.litros_aplicados) || 0,
        valor: parseFloat(formData.valor_produto) || 0,
        data: formData.data_aplicacao
      } : null,
      transparencia: 0.4
    };
    
    onSave(saveData);
  };

  if (!blockData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum bloco selecionado
          </h3>
          <p className="text-gray-600">
            Desenhe um polígono no mapa ou selecione um bloco existente para editar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 max-h-[80vh] overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5" />
        {blockData.id ? 'Editar Bloco' : 'Novo Bloco'}
      </h3>

      {/* Informações de Área */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
        <h4 className="font-medium text-green-900 mb-2">Dados Calculados</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-green-700">Área:</span>
            <p className="font-medium">{blockData.area_m2?.toFixed(2)} m²</p>
            <p className="font-medium">{blockData.area_acres?.toFixed(4)} acres</p>
          </div>
          <div>
            <span className="text-green-700">Perímetro:</span>
            <p className="font-medium">{blockData.perimeter?.toFixed(2)} m</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identificação */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 border-b pb-2">Identificação</h4>
          
          <div>
            <Label htmlFor="nome">Nome do Bloco *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              placeholder="Ex: Bloco A1, Talhão Norte..."
              required
            />
          </div>

          <div>
            <Label htmlFor="cor">Cor de Identificação</Label>
            <Select value={formData.cor} onValueChange={(value) => setFormData({...formData, cor: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {colors.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.value }}
                      />
                      <div>
                        <span className="font-medium">{color.label}</span>
                        <span className="text-xs text-gray-500 ml-2">{color.name}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Informações Agronômicas */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 border-b pb-2">Dados Agronômicos</h4>
          
          <div>
            <Label htmlFor="data_plantio">Data do Plantio</Label>
            <Input
              id="data_plantio"
              type="date"
              value={formData.data_plantio}
              onChange={(e) => setFormData({...formData, data_plantio: e.target.value})}
            />
          </div>

          <div>
            <Label htmlFor="tipo_cana">Variedade de Cana</Label>
            <Select value={formData.tipo_cana} onValueChange={(value) => setFormData({...formData, tipo_cana: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a variedade" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {caneTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="idade_cana">Idade da Cana</Label>
            <Select value={formData.idade_cana} onValueChange={(value) => setFormData({...formData, idade_cana: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a idade da cana" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                {caneAges.map((age) => (
                  <SelectItem key={age.value} value={age.value}>
                    {age.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="proxima_colheita">Próxima Colheita</Label>
              <Input
                id="proxima_colheita"
                type="date"
                value={formData.proxima_colheita}
                onChange={(e) => setFormData({...formData, proxima_colheita: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="proxima_aplicacao">Próxima Aplicação</Label>
              <Input
                id="proxima_aplicacao"
                type="date"
                value={formData.proxima_aplicacao}
                onChange={(e) => setFormData({...formData, proxima_aplicacao: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Última Aplicação */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 border-b pb-2">Última Aplicação</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="produto_aplicado">Produto Aplicado</Label>
              <Input
                id="produto_aplicado"
                value={formData.produto_aplicado}
                onChange={(e) => setFormData({...formData, produto_aplicado: e.target.value})}
                placeholder="Ex: Herbicida, Inseticida..."
              />
            </div>

            <div>
              <Label htmlFor="data_aplicacao">Data da Aplicação</Label>
              <Input
                id="data_aplicacao"
                type="date"
                value={formData.data_aplicacao}
                onChange={(e) => setFormData({...formData, data_aplicacao: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="litros_aplicados">Litros Aplicados</Label>
              <Input
                id="litros_aplicados"
                type="number"
                step="0.01"
                value={formData.litros_aplicados}
                onChange={(e) => setFormData({...formData, litros_aplicados: e.target.value})}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="valor_produto">Valor (R$)</Label>
              <Input
                id="valor_produto"
                type="number"
                step="0.01"
                value={formData.valor_produto}
                onChange={(e) => setFormData({...formData, valor_produto: e.target.value})}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Infraestrutura */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 border-b pb-2">Infraestrutura</h4>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="possui_dreno"
              checked={formData.possui_dreno}
              onCheckedChange={(checked) => setFormData({...formData, possui_dreno: !!checked})}
            />
            <Label htmlFor="possui_dreno">Possui sistema de drenagem</Label>
          </div>
        </div>

        {/* Observações */}
        <div>
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            value={formData.observacoes}
            onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
            placeholder="Anotações adicionais sobre o bloco..."
            rows={3}
          />
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
            <Calendar className="w-4 h-4 mr-2" />
            {blockData.id ? 'Atualizar Bloco' : 'Salvar Bloco'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AdvancedBlockForm;
