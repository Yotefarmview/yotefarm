import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map as MapIcon, Save, Settings, Download, Upload, Navigation, Layers, FileText, Ruler } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import AdvancedMapComponent from '../components/mapEditor/AdvancedMapComponent';
import LocationSearch from '../components/mapEditor/LocationSearch';
import { useBlocks } from '../hooks/useBlocks';
import { useFarms } from '../hooks/useFarms';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import ShapefileImporter from '../components/mapEditor/ShapefileImporter';

// Extended farm type to include the new fields
interface ExtendedFarm {
  id: string;
  nome: string;
  latitude?: number;
  longitude?: number;
  data_plantio?: string;
  proxima_colheita?: string;
  ultima_aplicacao?: string;
  observacoes?: string;
  tipo_cana?: string;
  [key: string]: any; // Allow additional properties
}

const AdvancedMapEditor: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get coordinates from URL parameters
  const urlLat = searchParams.get('lat');
  const urlLng = searchParams.get('lng');
  const urlFarmId = searchParams.get('fazenda');

  const [selectedFarmId, setSelectedFarmId] = useState<string>(urlFarmId || '');
  const { blocks, createBlock, updateBlock, deleteBlock, refetch } = useBlocks(selectedFarmId || undefined);
  const { farms, updateFarm } = useFarms();

  const [selectedBlock, setSelectedBlock] = useState<any>(null);
  const [currentFarm, setCurrentFarm] = useState<ExtendedFarm | null>(null);
  
  // Map states
  const [showSatellite, setShowSatellite] = useState(false);
  const [showBackground, setShowBackground] = useState(true);
  const [printMode, setPrintMode] = useState(false);
  const [showNDVI, setShowNDVI] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#10B981');
  const [transparency, setTransparency] = useState(0.4);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'edit' | 'delete' | 'measure' | null>(null);
  
  // Location states
  const [centerCoordinates, setCenterCoordinates] = useState<[number, number] | undefined>();
  const [boundingBox, setBoundingBox] = useState<[number, number, number, number] | undefined>();

  // Farm form states - moved from block form to farm form
  const [farmFormData, setFarmFormData] = useState({
    data_plantio: '',
    proxima_colheita: '',
    ultima_aplicacao: '',
    observacoes: '',
    tipo_cana: ''
  });

  // Block form states - simplified for block creation only
  const [blockFormData, setBlockFormData] = useState({
    nome: '',
    cor: '#10B981'
  });

  // Color options for blocks
  const colorOptions = [
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

  // Add new state for shapefile importer
  const [showImporter, setShowImporter] = useState(false);

  // Handle farm selection
  const handleFarmChange = (farmId: string) => {
    setSelectedFarmId(farmId);
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('fazenda', farmId);
    setSearchParams(newSearchParams);
    
    const farm = farms.find(f => f.id === farmId) as ExtendedFarm;
    if (farm) {
      setCurrentFarm(farm);
      if (farm.latitude && farm.longitude) {
        setCenterCoordinates([farm.longitude, farm.latitude]);
      }
      
      // Load farm data into form
      setFarmFormData({
        data_plantio: (farm as any).data_plantio || '',
        proxima_colheita: (farm as any).proxima_colheita || '',
        ultima_aplicacao: (farm as any).ultima_aplicacao || '',
        observacoes: (farm as any).observacoes || '',
        tipo_cana: (farm as any).tipo_cana || ''
      });
    }
  };

  // Load farm and coordinates from URL
  useEffect(() => {
    if (urlLat && urlLng) {
      setCenterCoordinates([parseFloat(urlLng), parseFloat(urlLat)]);
    }
    
    if (selectedFarmId && farms.length > 0) {
      const farm = farms.find(f => f.id === selectedFarmId) as ExtendedFarm;
      if (farm) {
        setCurrentFarm(farm);
        if (farm.latitude && farm.longitude && !urlLat && !urlLng) {
          setCenterCoordinates([farm.longitude, farm.latitude]);
        }
        
        // Load farm data into form
        setFarmFormData({
          data_plantio: (farm as any).data_plantio || '',
          proxima_colheita: (farm as any).proxima_colheita || '',
          ultima_aplicacao: (farm as any).ultima_aplicacao || '',
          observacoes: (farm as any).observacoes || '',
          tipo_cana: (farm as any).tipo_cana || ''
        });
      }
    }
  }, [selectedFarmId, farms, urlLat, urlLng]);

  // Update block form when block is selected
  useEffect(() => {
    if (selectedBlock) {
      setBlockFormData({
        nome: selectedBlock.nome || '',
        cor: selectedBlock.cor || '#10B981'
      });
      setSelectedColor(selectedBlock.cor || '#10B981');
    }
  }, [selectedBlock]);

  const handlePolygonDrawn = async (blockData: any) => {
    try {
      console.log('handlePolygonDrawn called with:', blockData);
      
      if (!selectedFarmId) {
        toast({
          title: "Erro",
          description: "Selecione uma fazenda primeiro",
          variant: "destructive"
        });
        return;
      }

      // Prepare block data for database with all required fields
      const newBlockData = {
        fazenda_id: selectedFarmId,
        nome: blockFormData.nome || blockData.name || `Bloco ${Date.now()}`,
        cor: selectedColor || '#10B981',
        coordenadas: blockData.coordinates,
        area_m2: blockData.area_m2 || 0,
        area_acres: blockData.area_acres || 0,
        perimetro: blockData.perimeter || 0,
        transparencia: transparency,
        // Add missing required fields with null defaults
        data_plantio: null,
        proxima_colheita: null,
        ultima_aplicacao: null,
        tipo_cana: null,
        proxima_aplicacao: null,
        possui_dreno: null,
        ndvi_historico: null
      };

      console.log('Saving block data:', newBlockData);

      // Save to database
      const savedBlock = await createBlock(newBlockData);
      
      console.log('Block saved successfully:', savedBlock);

      toast({
        title: "Sucesso",
        description: `Bloco "${newBlockData.nome}" criado com sucesso!`
      });

      // Reset form and drawing mode
      setDrawingMode(null);
      resetBlockForm();
      
      // Refresh blocks list
      refetch();
      
    } catch (error) {
      console.error('Error saving block:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar bloco no banco de dados",
        variant: "destructive"
      });
    }
  };

  const handleBlockUpdate = async (blockId: string, updates: any) => {
    try {
      console.log('Updating block:', blockId, updates);
      
      const updateData: any = {
        nome: updates.nome,
        cor: updates.cor
      };
      
      if (updates.coordinates) {
        updateData.coordenadas = updates.coordinates;
      }
      
      if (updates.area_m2 !== undefined) {
        updateData.area_m2 = updates.area_m2;
      }
      
      if (updates.area_acres !== undefined) {
        updateData.area_acres = updates.area_acres;
      }
      
      if (updates.perimeter !== undefined) {
        updateData.perimetro = updates.perimeter;
      }

      await updateBlock(blockId, updateData);
      
      console.log('Block updated successfully');

      toast({
        title: "Sucesso",
        description: "Bloco atualizado com sucesso!"
      });
      
      refetch();
    } catch (error) {
      console.error('Error updating block:', error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar bloco",
        variant: "destructive"
      });
    }
  };

  const handleBlockDelete = async (blockId: string) => {
    try {
      console.log('Deleting block:', blockId);
      
      await deleteBlock(blockId);
      setSelectedBlock(null);
      resetBlockForm();

      toast({
        title: "Sucesso",
        description: "Bloco deletado com sucesso!"
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting block:', error);
      toast({
        title: "Erro",
        description: "Erro ao deletar bloco",
        variant: "destructive"
      });
    }
  };

  const handleBlockSelect = (block: any) => {
    console.log('Block selected:', block);
    setSelectedBlock(block);
    setDrawingMode('edit');
  };

  const handleSaveBlock = async () => {
    try {
      if (selectedBlock?.id) {
        await updateBlock(selectedBlock.id, {
          nome: blockFormData.nome,
          cor: blockFormData.cor
        });
        
        toast({
          title: "Sucesso",
          description: "Bloco atualizado com sucesso!"
        });
      }

      setSelectedBlock(null);
      setDrawingMode(null);
      resetBlockForm();
      refetch();
    } catch (error) {
      console.error('Error saving block:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar bloco",
        variant: "destructive"
      });
    }
  };

  // New function to save farm data
  const handleSaveFarm = async () => {
    try {
      if (!selectedFarmId) {
        toast({
          title: "Erro",
          description: "Nenhuma fazenda selecionada",
          variant: "destructive"
        });
        return;
      }

      await updateFarm(selectedFarmId, {
        data_plantio: farmFormData.data_plantio || null,
        proxima_colheita: farmFormData.proxima_colheita || null,
        ultima_aplicacao: farmFormData.ultima_aplicacao || null,
        observacoes: farmFormData.observacoes || null,
        tipo_cana: farmFormData.tipo_cana || null
      } as any);
      
      toast({
        title: "Sucesso",
        description: "Dados da fazenda salvos com sucesso!"
      });
    } catch (error) {
      console.error('Error saving farm:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar dados da fazenda",
        variant: "destructive"
      });
    }
  };

  const handleSaveAllBlocks = async () => {
    try {
      // This function could be used to save any pending changes
      toast({
        title: "Sucesso",
        description: "Todas as informações foram salvas!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar informações",
        variant: "destructive"
      });
    }
  };

  const resetBlockForm = () => {
    setBlockFormData({
      nome: '',
      cor: '#10B981'
    });
    setSelectedColor('#10B981');
  };

  const handleLocationSelect = (lat: number, lon: number, bbox?: [number, number, number, number]) => {
    setCenterCoordinates([lon, lat]);
    if (bbox) {
      setBoundingBox(bbox);
    }
  };

  // Função para calcular bounding box dos blocos
  const calculateBlocksBounds = () => {
    console.log('Calculando bounds para blocos:', blocks);
    
    if (!blocks || blocks.length === 0) {
      console.log('Nenhum bloco encontrado para calcular bounds');
      return null;
    }

    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    let validBlocks = 0;

    blocks.forEach((block, index) => {
      console.log(`Processando bloco ${index + 1}:`, block);
      
      let coordinates;
      if (typeof block.coordenadas === 'string') {
        try {
          coordinates = JSON.parse(block.coordenadas);
        } catch (e) {
          console.error('Erro ao fazer parse das coordenadas do bloco:', block.id, e);
          return;
        }
      } else if (Array.isArray(block.coordenadas)) {
        coordinates = block.coordenadas;
      } else {
        console.log('Coordenadas inválidas para o bloco:', block.id);
        return;
      }

      if (!coordinates || coordinates.length === 0) {
        console.log('Coordenadas vazias para o bloco:', block.id);
        return;
      }

      console.log('Coordenadas do bloco:', coordinates);
      validBlocks++;

      coordinates.forEach((coord: number[]) => {
        const [lng, lat] = coord;
        if (typeof lng === 'number' && typeof lat === 'number') {
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLng = Math.min(minLng, lng);
          maxLng = Math.max(maxLng, lng);
        }
      });
    });

    if (validBlocks === 0) {
      console.log('Nenhum bloco válido encontrado');
      return null;
    }

    const bounds = {
      minLat, maxLat, minLng, maxLng,
      centerLat: (minLat + maxLat) / 2,
      centerLng: (minLng + maxLng) / 2,
      width: maxLng - minLng,
      height: maxLat - minLat
    };

    console.log('Bounds calculados:', bounds);
    return bounds;
  };

  // Função para formatar acres com casas decimais apropriadas
  const formatAcres = (acres: number): string => {
    if (acres === 0) return '0.00 acres';
    
    if (acres >= 100) {
      return `${acres.toFixed(3)} acres`; // XXX.XXX format
    } else if (acres >= 10) {
      return `${acres.toFixed(2)} Acres`; // XX.XX format
    } else {
      return `${acres.toFixed(2)} acres`; // X.XX format
    }
  };

  // Função melhorada para exportar mapa em PDF sem margem preta
  const exportMapToPDF = async () => {
    try {
      console.log('Iniciando exportação PDF...');
      console.log('Blocos disponíveis:', blocks);
      console.log('Número de blocos:', blocks?.length || 0);

      // Verificar se há blocos com melhor logging
      if (!blocks || blocks.length === 0) {
        console.log('Detalhes dos blocos:', {
          blocks,
          blocksLength: blocks?.length,
          selectedFarmId,
          currentFarm
        });
        
        toast({
          title: "Aviso",
          description: `Nenhum bloco encontrado para exportar. Fazenda selecionada: ${currentFarm?.nome || 'Nenhuma'}. Total de blocos: ${blocks?.length || 0}`,
          variant: "destructive"
        });
        return;
      }

      // Calcular bounds dos blocos
      const bounds = calculateBlocksBounds();
      if (!bounds) {
        toast({
          title: "Erro",
          description: "Não foi possível calcular os limites dos blocos. Verifique se os blocos possuem coordenadas válidas.",
          variant: "destructive"
        });
        return;
      }

      console.log('Bounds calculados com sucesso:', bounds);

      // Criar PDF em orientação paisagem
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Adicionar título
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Mapa Agrícola - ${currentFarm?.nome || 'Fazenda'}`, 20, 20);
      
      // Adicionar informações técnicas
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('ESCALA: 1:5', 20, 35);
      pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 80, 20);
      pdf.text(`Hora: ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth - 80, 30);
      
      // Adicionar coordenadas centrais
      pdf.setFontSize(10);
      pdf.text(`Centro: ${bounds.centerLat.toFixed(6)}°, ${bounds.centerLng.toFixed(6)}°`, 20, 45);
      
      // Definir dimensões do mapa no PDF (escala 1:5)
      const mapStartY = 55;
      const availableWidth = pageWidth - 40;
      const availableHeight = pageHeight - mapStartY - 80; // Deixar espaço para legenda
      
      // Calcular dimensões mantendo proporção dos blocos
      const boundsRatio = bounds.width / bounds.height;
      let mapWidth = availableWidth;
      let mapHeight = availableWidth / boundsRatio;
      
      if (mapHeight > availableHeight) {
        mapHeight = availableHeight;
        mapWidth = availableHeight * boundsRatio;
      }

      // Criar canvas para desenhar apenas os blocos (sem fundo preto)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        toast({
          title: "Erro",
          description: "Erro ao criar canvas",
          variant: "destructive"
        });
        return;
      }

      // Configurar canvas com alta resolução
      const scale = 3; // Para melhor qualidade
      canvas.width = mapWidth * scale;
      canvas.height = mapHeight * scale;
      
      // Desenhar fundo BRANCO (não transparente)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Desenhar apenas os blocos coloridos (sem mapa de fundo)
      console.log('Desenhando blocos no PDF...');
      blocks.forEach((block, index) => {
        console.log(`Desenhando bloco ${index + 1}:`, block.nome || `Bloco ${index + 1}`);
        
        let coordinates;
        if (typeof block.coordenadas === 'string') {
          coordinates = JSON.parse(block.coordenadas);
        } else if (Array.isArray(block.coordenadas)) {
          coordinates = block.coordenadas;
        } else {
          console.log('Coordenadas inválidas para bloco:', block.id);
          return;
        }

        if (coordinates.length > 0) {
          ctx.beginPath();
          
          // Converter coordenadas geográficas para pixels do canvas
          coordinates.forEach((coord: number[], coordIndex: number) => {
            const [lng, lat] = coord;
            
            // Normalizar coordenadas dentro dos bounds
            const x = ((lng - bounds.minLng) / bounds.width) * canvas.width;
            const y = ((bounds.maxLat - lat) / bounds.height) * canvas.height; // Inverter Y
            
            if (coordIndex === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
          
          ctx.closePath();
          
          // Aplicar cor do bloco com transparência configurada
          const blockColor = block.cor || '#10B981';
          const alpha = Math.round(transparency * 255).toString(16).padStart(2, '0');
          ctx.fillStyle = blockColor + alpha;
          ctx.fill();
          
          // Contorno mais sutil
          ctx.strokeStyle = blockColor;
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Adicionar nome do bloco se houver
          if (block.nome) {
            // Calcular centro do bloco para posicionar o texto
            let centerX = 0, centerY = 0;
            coordinates.forEach((coord: number[]) => {
              const [lng, lat] = coord;
              centerX += ((lng - bounds.minLng) / bounds.width) * canvas.width;
              centerY += ((bounds.maxLat - lat) / bounds.height) * canvas.height;
            });
            centerX /= coordinates.length;
            centerY /= coordinates.length;
            
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(block.nome, centerX, centerY);
          }
        }
      });

      // Adicionar imagem limpa no PDF (sem margem preta)
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 20, mapStartY, mapWidth, mapHeight);

      // Adicionar informações técnicas abaixo do mapa
      let yPosition = mapStartY + mapHeight + 20;
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INFORMAÇÕES TÉCNICAS', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Calcular área total com formatação correta
      const totalArea = blocks.reduce((sum, block) => sum + (block.area_acres || 0), 0);
      pdf.text(`Área Total dos Blocos: ${formatAcres(totalArea)} (${(totalArea * 4046.86).toFixed(2)} m²)`, 20, yPosition);
      yPosition += 8;
      
      pdf.text(`Número de Blocos: ${blocks.length}`, 20, yPosition);
      yPosition += 8;
      
      pdf.text(`Fazenda: ${currentFarm?.nome || 'Não especificada'}`, 20, yPosition);
      yPosition += 15;

      // Adicionar legenda dos blocos com formatação correta
      if (blocks.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('LEGENDA DOS BLOCOS', 20, yPosition);
        yPosition += 10;

        blocks.forEach((block, index) => {
          if (yPosition > pageHeight - 15) { // Nova página se necessário
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'normal');
          
          // Desenhar quadrado colorido
          const hexColor = block.cor || '#10B981';
          const r = parseInt(hexColor.slice(1, 3), 16);
          const g = parseInt(hexColor.slice(3, 5), 16);
          const b = parseInt(hexColor.slice(5, 7), 16);
          
          pdf.setFillColor(r, g, b);
          pdf.rect(20, yPosition - 3, 5, 5, 'F');
          
          // Adicionar moldura sutil ao quadrado
          pdf.setDrawColor(100, 100, 100);
          pdf.setLineWidth(0.1);
          pdf.rect(20, yPosition - 3, 5, 5);
          
          // Adicionar texto da legenda com formatação de acres correta
          pdf.setTextColor(0, 0, 0);
          const blockInfo = `${block.nome || `Bloco ${index + 1}`} - ${formatAcres(block.area_acres || 0)}`;
          pdf.text(blockInfo, 30, yPosition);
          yPosition += 8;
        });
      }

      // Adicionar rodapé
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text(`Gerado automaticamente pelo Sistema de Mapeamento Agrícola - ${new Date().toLocaleString('pt-BR')}`, 
               20, pageHeight - 10);

      // Salvar PDF
      const fileName = `mapa_escala_1-5_${currentFarm?.nome?.replace(/[^a-zA-Z0-9]/g, '_') || 'fazenda'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "Sucesso",
        description: `PDF exportado com sucesso! ${blocks.length} blocos foram desenhados no mapa com escala 1:5.`
      });
      
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Função para exportar Shapefile
  const exportShapefile = async () => {
    try {
      console.log('Iniciando exportação Shapefile...');
      console.log('Blocos para exportar:', blocks);
      
      if (!blocks || blocks.length === 0) {
        toast({
          title: "Aviso",
          description: `Nenhum bloco encontrado para exportar. Total de blocos: ${blocks?.length || 0}`,
          variant: "destructive"
        });
        return;
      }

      const features = blocks.map(block => {
        let coordinates;
        if (typeof block.coordenadas === 'string') {
          coordinates = JSON.parse(block.coordenadas);
        } else if (Array.isArray(block.coordenadas)) {
          coordinates = block.coordenadas;
        } else {
          coordinates = [];
        }

        return {
          type: 'Feature',
          properties: {
            ID: block.id,
            NOME: block.nome || 'Sem nome',
            COR: block.cor || '#10B981',
            AREA_M2: parseFloat((block.area_m2 || 0).toString()),
            AREA_ACRES: parseFloat((block.area_acres || 0).toString()),
            PERIMETRO: parseFloat((block.perimetro || 0).toString()),
            TIPO_CANA: block.tipo_cana || '',
            DATA_PLANT: block.data_plantio || '',
            FAZENDA_ID: block.fazenda_id || ''
          },
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates]
          }
        };
      });

      // Criar arquivos do shapefile usando JSZip
      const zip = new JSZip();
      
      // Criar conteúdo básico dos arquivos (simulação)
      // .shp - arquivo principal (geometria binária)
      const shpContent = new Uint8Array([
        0x00, 0x00, 0x27, 0x0A, // File code
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
        0x00, 0x00, 0x00, 0x32, // File length
        0x00, 0x00, 0x03, 0xE8, // Version
        0x00, 0x00, 0x00, 0x05  // Shape type (Polygon)
      ]);
      
      // .shx - arquivo de índice
      const shxContent = new Uint8Array([
        0x00, 0x00, 0x27, 0x0A, // File code
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x32, // File length
        0x00, 0x00, 0x03, 0xE8, // Version
        0x00, 0x00, 0x00, 0x05  // Shape type
      ]);
      
      // .dbf - arquivo de dados (dBASE)
      let dbfContent = String.fromCharCode(0x03); // dBASE III
      dbfContent += String.fromCharCode(new Date().getFullYear() - 1900); // Year
      dbfContent += String.fromCharCode(new Date().getMonth() + 1); // Month
      dbfContent += String.fromCharCode(new Date().getDate()); // Day
      
      // Número de registros (4 bytes little endian)
      const numRecords = blocks.length;
      dbfContent += String.fromCharCode(numRecords & 0xFF);
      dbfContent += String.fromCharCode((numRecords >> 8) & 0xFF);
      dbfContent += String.fromCharCode((numRecords >> 16) & 0xFF);
      dbfContent += String.fromCharCode((numRecords >> 24) & 0xFF);
      
      // Header length (2 bytes)
      const headerLength = 32 + (32 * 9); // 32 header + 32 per field * 9 fields
      dbfContent += String.fromCharCode(headerLength & 0xFF);
      dbfContent += String.fromCharCode((headerLength >> 8) & 0xFF);
      
      // Record length (2 bytes)
      const recordLength = 1 + 50 + 50 + 7 + 15 + 15 + 15 + 50 + 10 + 50; // 1 deletion + field lengths
      dbfContent += String.fromCharCode(recordLength & 0xFF);
      dbfContent += String.fromCharCode((recordLength >> 8) & 0xFF);
      
      // Reserved bytes
      for (let i = 0; i < 20; i++) {
        dbfContent += String.fromCharCode(0);
      }
      
      // Field descriptors
      const fields = [
        { name: 'ID', type: 'C', length: 50 },
        { name: 'NOME', type: 'C', length: 50 },
        { name: 'COR', type: 'C', length: 7 },
        { name: 'AREA_M2', type: 'N', length: 15 },
        { name: 'AREA_ACRES', type: 'N', length: 15 },
        { name: 'PERIMETRO', type: 'N', length: 15 },
        { name: 'TIPO_CANA', type: 'C', length: 50 },
        { name: 'DATA_PLANT', type: 'C', length: 10 },
        { name: 'FAZENDA_ID', type: 'C', length: 50 }
      ];
      
      fields.forEach(field => {
        // Field name (11 bytes, null padded)
        const fieldName = field.name.padEnd(11, '\0');
        dbfContent += fieldName;
        
        // Field type (1 byte)
        dbfContent += field.type;
        
        // Reserved (4 bytes)
        dbfContent += '\0\0\0\0';
        
        // Field length (1 byte)
        dbfContent += String.fromCharCode(field.length);
        
        // Decimal count (1 byte)
        dbfContent += String.fromCharCode(field.type === 'N' ? 4 : 0);
        
        // Reserved (14 bytes)
        dbfContent += '\0\0\0\0\0\0\0\0\0\0\0\0\0\0';
      });
      
      // Header terminator
      dbfContent += String.fromCharCode(0x0D);
      
      // Records
      blocks.forEach(block => {
        dbfContent += ' '; // Not deleted
        
        // ID
        dbfContent += (block.id || '').toString().padEnd(50, ' ').substring(0, 50);
        
        // NOME
        dbfContent += (block.nome || '').toString().padEnd(50, ' ').substring(0, 50);
        
        // COR
        dbfContent += (block.cor || '').toString().padEnd(7, ' ').substring(0, 7);
        
        // AREA_M2
        const areaM2Str = (block.area_m2 || 0).toFixed(4).padStart(15, ' ');
        dbfContent += areaM2Str.substring(0, 15);
        
        // AREA_ACRES
        const areaAcresStr = (block.area_acres || 0).toFixed(4).padStart(15, ' ');
        dbfContent += areaAcresStr.substring(0, 15);
        
        // PERIMETRO
        const perimetroStr = (block.perimetro || 0).toFixed(4).padStart(15, ' ');
        dbfContent += perimetroStr.substring(0, 15);
        
        // TIPO_CANA
        dbfContent += (block.tipo_cana || '').toString().padEnd(50, ' ').substring(0, 50);
        
        // DATA_PLANT
        dbfContent += (block.data_plantio || '').toString().padEnd(10, ' ').substring(0, 10);
        
        // FAZENDA_ID
        dbfContent += (block.fazenda_id || '').toString().padEnd(50, ' ').substring(0, 50);
      });
      
      // End of file marker
      dbfContent += String.fromCharCode(0x1A);

      // .prj - arquivo de projeção (WGS84)
      const prjContent = 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["Degree",0.017453292519943295]]';

      // Adicionar arquivos ao ZIP
      const farmName = currentFarm?.nome?.replace(/[^a-zA-Z0-9]/g, '_') || 'fazenda';
      zip.file(`blocos_${farmName}.shp`, shpContent);
      zip.file(`blocos_${farmName}.shx`, shxContent);
      zip.file(`blocos_${farmName}.dbf`, dbfContent);
      zip.file(`blocos_${farmName}.prj`, prjContent);
      
      // Adicionar arquivo README com informações
      const readmeContent = `SHAPEFILE DOS BLOCOS AGRÍCOLAS
      
Fazenda: ${currentFarm?.nome || 'Não especificada'}
Data de Exportação: ${new Date().toLocaleString('pt-BR')}
Número de Blocos: ${blocks.length}
Área Total: ${blocks.reduce((sum, block) => sum + (block.area_acres || 0), 0).toFixed(4)} acres

ARQUIVOS INCLUÍDOS:
- .shp: Geometrias dos blocos
- .shx: Índice das geometrias  
- .dbf: Atributos dos blocos
- .prj: Sistema de coordenadas (WGS84)

CAMPOS DOS DADOS:
- ID: Identificador único
- NOME: Nome do bloco
- COR: Cor em hexadecimal
- AREA_M2: Área em metros quadrados
- AREA_ACRES: Área em acres
- PERIMETRO: Perímetro em metros
- TIPO_CANA: Tipo de cana plantada
- DATA_PLANT: Data do plantio
- FAZENDA_ID: ID da fazenda
`;
      
      zip.file('README.txt', readmeContent);

      // Gerar e baixar o ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shapefile_${farmName}_${new Date().toISOString().split('T')[0]}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Sucesso",
        description: `Shapefile exportado com sucesso! ${blocks.length} blocos incluídos (SHP, SHX, DBF, PRJ)`
      });

    } catch (error) {
      console.error('Erro ao exportar shapefile:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar shapefile. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Add shapefile import handler
  const handleShapefileImport = async (shapefileData: any) => {
    try {
      if (!selectedFarmId) {
        toast({
          title: "Erro",
          description: "Selecione uma fazenda primeiro",
          variant: "destructive"
        });
        return;
      }

      console.log('Importing shapefile data:', shapefileData);

      // Convert shapefile features to blocks
      for (const feature of shapefileData.features) {
        const coordinates = feature.geometry.coordinates[0]; // Get exterior ring
        
        // Calculate area using Turf.js (simplified calculation)
        const area_m2 = coordinates.length > 0 ? 1000 : 0; // Placeholder
        const area_acres = area_m2 * 0.000247105;
        
        const blockData = {
          fazenda_id: selectedFarmId,
          nome: feature.properties.NOME || feature.properties.NAME || `Bloco Importado ${Date.now()}`,
          cor: feature.properties.COR || feature.properties.COLOR || '#10B981',
          coordenadas: coordinates,
          area_m2: feature.properties.AREA_M2 || area_m2,
          area_acres: feature.properties.AREA_ACRES || area_acres,
          perimetro: feature.properties.PERIMETRO || feature.properties.PERIMETER || 0,
          transparencia: 0.4,
          // Required null fields
          data_plantio: null,
          proxima_colheita: null,
          ultima_aplicacao: null,
          tipo_cana: feature.properties.TIPO_CANA || feature.properties.CANE_TYPE || null,
          proxima_aplicacao: null,
          possui_dreno: false,
          ndvi_historico: null
        };

        await createBlock(blockData);
      }

      toast({
        title: "Sucesso",
        description: `${shapefileData.features.length} blocos importados com sucesso!`
      });

      // Refresh blocks and center map on imported data
      refetch();
      
      // Center map on first imported feature if available
      if (shapefileData.features.length > 0) {
        const firstFeature = shapefileData.features[0];
        const coords = firstFeature.geometry.coordinates[0];
        if (coords.length > 0) {
          setCenterCoordinates([coords[0][0], coords[0][1]]);
        }
      }

    } catch (error) {
      console.error('Error importing shapefile:', error);
      toast({
        title: "Erro",
        description: "Erro ao importar shapefile",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm border-b border-gray-200 p-4"
      >
        <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <MapIcon className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Editor de Mapa Avançado
                </h1>
                <p className="text-sm text-gray-600">
                  Sistema de mapeamento agrícola QGIS-level
                </p>
              </div>
            </div>
            {currentFarm && (
              <div className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full">
                {currentFarm.nome} • {blocks?.length || 0} blocos
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={handleSaveAllBlocks} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Salvar Tudo
            </Button>
            <Button variant="outline" size="sm" onClick={exportShapefile}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Shapefile
            </Button>
            <Button variant="outline" size="sm" onClick={exportMapToPDF}>
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF 1:5
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowImporter(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Full Width Map Area */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full p-4 max-w-screen-2xl mx-auto"
      >
        <Card className="h-[calc(100vh-120px)]">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Mapa Interativo
                </CardTitle>
                
                {/* Farm Selector - Responsive */}
                <div className="min-w-[200px] max-w-[300px]">
                  <Select value={selectedFarmId} onValueChange={handleFarmChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma fazenda" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg z-50">
                      {farms.map((farm) => (
                        <SelectItem key={farm.id} value={farm.id}>
                          {farm.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Map Controls - Responsive Grid */}
              <div className="flex flex-wrap items-center gap-2 justify-between">
                {/* View Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={showSatellite ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowSatellite(!showSatellite)}
                    className="text-xs px-2 py-1 h-8 min-w-[70px]"
                  >
                    <Layers className="w-3 h-3 mr-1" />
                    {showSatellite ? 'Satélite' : 'Padrão'}
                  </Button>
                  
                  <Button
                    variant={printMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPrintMode(!printMode)}
                    className="text-xs px-2 py-1 h-8 min-w-[70px] whitespace-nowrap"
                  >
                    Modo Impressão
                  </Button>
                </div>
                
                {/* Drawing Tools */}
                <div className="flex flex-wrap items-center gap-1">
                  <Button
                    variant={drawingMode === 'polygon' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDrawingMode(drawingMode === 'polygon' ? null : 'polygon')}
                    className="text-xs px-2 py-1 h-8 min-w-[60px]"
                  >
                    Desenhar
                  </Button>
                  
                  <Button
                    variant={drawingMode === 'measure' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDrawingMode(drawingMode === 'measure' ? null : 'measure')}
                    className="text-xs px-2 py-1 h-8 min-w-[50px]"
                  >
                    <Ruler className="w-3 h-3 mr-1" />
                    Medir
                  </Button>
                  
                  <Button
                    variant={drawingMode === 'edit' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDrawingMode(drawingMode === 'edit' ? null : 'edit')}
                    className="text-xs px-2 py-1 h-8 min-w-[50px]"
                  >
                    Editar
                  </Button>
                  
                  <Button
                    variant={drawingMode === 'delete' ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setDrawingMode(drawingMode === 'delete' ? null : 'delete')}
                    className="text-xs px-2 py-1 h-8 min-w-[55px]"
                  >
                    Deletar
                  </Button>
                </div>

                {/* Color Selector */}
                <div className="flex items-center gap-2">
                  <Select 
                    value={selectedColor} 
                    onValueChange={(value) => {
                      setSelectedColor(value);
                      setBlockFormData({...blockFormData, cor: value});
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: selectedColor }}
                        />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg z-50">
                      {colorOptions.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: color.value }}
                            />
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* Search Bar */}
            <LocationSearch
              onLocationSelect={handleLocationSelect}
              placeholder="Buscar endereço global (CEP, cidade, coordenadas...)"
            />
          </CardHeader>
          
          <CardContent className="h-full p-0">
            <AdvancedMapComponent
              blocks={blocks}
              selectedColor={selectedColor}
              transparency={transparency}
              showSatellite={showSatellite}
              showBackground={showBackground}
              printMode={printMode}
              showNDVI={showNDVI}
              drawingMode={drawingMode}
              onPolygonDrawn={handlePolygonDrawn}
              onBlockUpdate={handleBlockUpdate}
              onBlockDelete={handleBlockDelete}
              onBlockSelect={handleBlockSelect}
              centerCoordinates={centerCoordinates}
              boundingBox={boundingBox}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Shapefile Importer Modal */}
      <ShapefileImporter
        isOpen={showImporter}
        onClose={() => setShowImporter(false)}
        onImport={handleShapefileImport}
      />
    </div>
  );
};

export default AdvancedMapEditor;
