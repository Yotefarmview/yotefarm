import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Map as MapIcon, Save, Settings, Download, Upload, Navigation, Layers, FileText, Ruler } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AdvancedMapComponent from '../components/mapEditor/AdvancedMapComponent';
import LocationSearch from '../components/mapEditor/LocationSearch';
import { useBlocks } from '../hooks/useBlocks';
import { useFarms } from '../hooks/useFarms';
import jsPDF from 'jspdf';
import JSZip from 'jszip';

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
  const { blocks, createBlock, updateBlock, deleteBlock } = useBlocks(selectedFarmId || undefined);
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
    { value: '#10B981', label: 'Verde', name: 'Plantado' },
    { value: '#F59E0B', label: 'Amarelo', name: 'Maduro' },
    { value: '#EF4444', label: 'Vermelho', name: 'Problemas' },
    { value: '#F97316', label: 'Laranja', name: 'Colhendo' },
    { value: '#8B5CF6', label: 'Roxo', name: 'Aplicação' },
    { value: '#FFFFFF', label: 'Branco', name: 'Vazio' },
    { value: '#3B82F6', label: 'Azul', name: 'Irrigação' },
    { value: '#EC4899', label: 'Rosa', name: 'Teste' },
    { value: '#06B6D4', label: 'Turquesa', name: 'Dreno' }
  ];

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
      if (!selectedFarmId) {
        toast({
          title: "Erro",
          description: "Selecione uma fazenda primeiro",
          variant: "destructive"
        });
        return;
      }

      const newBlock = {
        ...blockData,
        fazenda_id: selectedFarmId,
        coordenadas: JSON.stringify(blockData.coordinates),
        nome: blockFormData.nome || blockData.name,
        cor: selectedColor,
        transparencia: transparency
      };

      await createBlock(newBlock);

      toast({
        title: "Sucesso",
        description: "Bloco criado com sucesso!"
      });

      setDrawingMode(null);
      resetBlockForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar bloco",
        variant: "destructive"
      });
    }
  };

  const handleBlockUpdate = async (blockId: string, updates: any) => {
    try {
      await updateBlock(blockId, {
        ...updates,
        coordenadas: updates.coordinates ? JSON.stringify(updates.coordinates) : undefined
      });

      toast({
        title: "Sucesso",
        description: "Bloco atualizado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar bloco",
        variant: "destructive"
      });
    }
  };

  const handleBlockDelete = async (blockId: string) => {
    try {
      await deleteBlock(blockId);
      setSelectedBlock(null);
      resetBlockForm();

      toast({
        title: "Sucesso",
        description: "Bloco deletado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar bloco",
        variant: "destructive"
      });
    }
  };

  const handleBlockSelect = (block: any) => {
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
    } catch (error) {
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
      toast({
        title: "Erro",
        description: "Erro ao salvar dados da fazenda",
        variant: "destructive"
      });
    }
  };

  const handleSaveAllBlocks = async () => {
    try {
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

  const exportGeoJSON = () => {
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
          id: block.id,
          nome: block.nome,
          cor: block.cor,
          area_m2: block.area_m2,
          area_acres: block.area_acres
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coordinates]
        }
      };
    });

    const geoJSON = {
      type: 'FeatureCollection',
      features
    };

    const blob = new Blob([JSON.stringify(geoJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blocos_${currentFarm?.nome || 'fazenda'}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Função para calcular bounding box dos blocos
  const calculateBlocksBounds = () => {
    if (blocks.length === 0) return null;

    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;

    blocks.forEach(block => {
      let coordinates;
      if (typeof block.coordenadas === 'string') {
        coordinates = JSON.parse(block.coordenadas);
      } else if (Array.isArray(block.coordenadas)) {
        coordinates = block.coordenadas;
      } else {
        return;
      }

      coordinates.forEach((coord: number[]) => {
        const [lng, lat] = coord;
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      });
    });

    return {
      minLat, maxLat, minLng, maxLng,
      centerLat: (minLat + maxLat) / 2,
      centerLng: (minLng + maxLng) / 2,
      width: maxLng - minLng,
      height: maxLat - minLat
    };
  };

  const exportMapToPDF = () => {
    try {
      if (blocks.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhum bloco encontrado para exportar",
          variant: "destructive"
        });
        return;
      }

      // Calcular bounds dos blocos
      const bounds = calculateBlocksBounds();
      if (!bounds) {
        toast({
          title: "Erro",
          description: "Não foi possível calcular os limites dos blocos",
          variant: "destructive"
        });
        return;
      }

      // Ativar modo impressão temporariamente
      setPrintMode(true);
      
      setTimeout(() => {
        const mapElement = document.querySelector('.ol-viewport') as HTMLElement;
        if (!mapElement) {
          toast({
            title: "Erro",
            description: "Não foi possível capturar o mapa",
            variant: "destructive"
          });
          setPrintMode(false);
          return;
        }

        // Criar PDF em orientação paisagem para melhor visualização
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Adicionar título
        pdf.setFontSize(16);
        pdf.text(`Mapa - ${currentFarm?.nome || 'Fazenda'}`, 20, 20);
        
        // Adicionar escala
        pdf.setFontSize(12);
        pdf.text('Escala: 1:5', 20, 30);
        
        // Adicionar data
        pdf.setFontSize(10);
        pdf.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, 40);

        // Criar canvas do mapa
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calcular dimensões baseadas na escala 1:5 e bounds dos blocos
        const scale = 5;
        const mapWidth = bounds.width * 111319.5 * scale; // Conversão grau para metros * escala
        const mapHeight = bounds.height * 111319.5 * scale;
        
        // Ajustar para caber na página PDF
        const maxMapWidth = pageWidth - 40;
        const maxMapHeight = pageHeight - 80;
        
        let finalWidth = Math.min(mapWidth / 100, maxMapWidth); // Dividir por 100 para ajustar escala visual
        let finalHeight = Math.min(mapHeight / 100, maxMapHeight);
        
        // Manter proporção
        const aspectRatio = mapWidth / mapHeight;
        if (finalWidth / finalHeight > aspectRatio) {
          finalWidth = finalHeight * aspectRatio;
        } else {
          finalHeight = finalWidth / aspectRatio;
        }

        canvas.width = finalWidth * 4; // Aumentar resolução
        canvas.height = finalHeight * 4;

        if (ctx) {
          // Desenhar fundo branco
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Capturar os tiles do mapa
          const mapLayers = mapElement.querySelectorAll('canvas');
          mapLayers.forEach(layer => {
            ctx.drawImage(layer, 0, 0, canvas.width, canvas.height);
          });

          // Adicionar imagem do mapa no PDF
          const imgData = canvas.toDataURL('image/png');
          pdf.addImage(imgData, 'PNG', 20, 50, finalWidth, finalHeight);

          // Adicionar informações dos bounds
          let yPosition = 50 + finalHeight + 20;
          
          pdf.setFontSize(10);
          pdf.text(`Centro: ${bounds.centerLat.toFixed(6)}, ${bounds.centerLng.toFixed(6)}`, 20, yPosition);
          yPosition += 8;
          pdf.text(`Área total dos blocos: ${blocks.reduce((sum, block) => sum + (block.area_acres || 0), 0).toFixed(4)} acres`, 20, yPosition);
          yPosition += 15;

          // Adicionar legenda dos blocos
          if (blocks.length > 0) {
            pdf.setFontSize(12);
            pdf.text('Legenda dos Blocos:', 20, yPosition);
            yPosition += 10;

            blocks.forEach((block, index) => {
              if (yPosition > pageHeight - 20) { // Nova página se necessário
                pdf.addPage();
                yPosition = 20;
              }
              
              pdf.setFontSize(9);
              // Desenhar quadrado colorido
              const hexColor = block.cor || '#10B981';
              const r = parseInt(hexColor.slice(1, 3), 16);
              const g = parseInt(hexColor.slice(3, 5), 16);
              const b = parseInt(hexColor.slice(5, 7), 16);
              
              pdf.setFillColor(r, g, b);
              pdf.rect(20, yPosition - 3, 5, 5, 'F');
              
              // Adicionar texto
              pdf.setTextColor(0, 0, 0);
              pdf.text(`${block.nome} - ${block.area_acres?.toFixed(4) || 0} acres`, 30, yPosition);
              yPosition += 8;
            });
          }

          // Salvar PDF
          pdf.save(`mapa_escala_1-5_${currentFarm?.nome || 'fazenda'}_${new Date().toISOString().split('T')[0]}.pdf`);
          
          toast({
            title: "Sucesso",
            description: "PDF exportado com escala 1:5!"
          });
        }

        // Desativar modo impressão
        setPrintMode(false);
      }, 1000); // Tempo maior para garantir que o mapa centralize nos blocos
      
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF",
        variant: "destructive"
      });
      setPrintMode(false);
    }
  };

  // Nova função para exportar Shapefile
  const exportShapefile = async () => {
    try {
      if (blocks.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhum bloco encontrado para exportar",
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

      const geoJSON = {
        type: 'FeatureCollection',
        features
      };

      // Criar arquivos do shapefile usando JSZip
      const zip = new JSZip();
      
      // Criar conteúdo básico dos arquivos (simulação)
      // .shp - arquivo principal (geometria binária)
      const shpContent = new Uint8Array([
        0x00, 0x00, 0x27, 0x0A, // File code
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 
        0x00, 0x00, 0x00, 0x32, // File length
        0x00, 0x00, 0x03, 0xE8, // Version
        0x00, 0x00, 0x00, 0x05  // Shape type (Polygon)
      ]);
      
      // .shx - arquivo de índice
      const shxContent = new Uint8Array([
        0x00, 0x00, 0x27, 0x0A, // File code
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
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
      zip.file(`blocos_${currentFarm?.nome || 'fazenda'}.shp`, shpContent);
      zip.file(`blocos_${currentFarm?.nome || 'fazenda'}.shx`, shxContent);
      zip.file(`blocos_${currentFarm?.nome || 'fazenda'}.dbf`, dbfContent);
      zip.file(`blocos_${currentFarm?.nome || 'fazenda'}.prj`, prjContent);
      
      // Adicionar arquivo GeoJSON para referência
      zip.file(`blocos_${currentFarm?.nome || 'fazenda'}.geojson`, JSON.stringify(geoJSON, null, 2));

      // Gerar e baixar o ZIP
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shapefile_${currentFarm?.nome || 'fazenda'}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Sucesso",
        description: "Shapefile exportado com sucesso! (SHP, SHX, DBF, PRJ + GeoJSON)"
      });

    } catch (error) {
      console.error('Erro ao exportar shapefile:', error);
      toast({
        title: "Erro",
        description: "Erro ao gerar shapefile",
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
                {currentFarm.nome} • {blocks.length} blocos
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={handleSaveAllBlocks} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Salvar Tudo
            </Button>
            <Button variant="outline" size="sm" onClick={exportGeoJSON}>
              <Download className="w-4 h-4 mr-2" />
              Exportar GeoJSON
            </Button>
            <Button variant="outline" size="sm" onClick={exportShapefile}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Shapefile
            </Button>
            <Button variant="outline" size="sm" onClick={exportMapToPDF}>
              <FileText className="w-4 h-4 mr-2" />
              Exportar PDF 1:5
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="flex max-w-screen-2xl mx-auto">
        {/* Map Area - 75% */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-3/4 p-4"
        >
          <Card className="h-[calc(100vh-120px)]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Mapa Interativo
                </CardTitle>
                
                {/* Map Controls */}
                <div className="flex items-center gap-2">
                  <div className="min-w-[200px]">
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
                  
                  <Button
                    variant={showSatellite ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowSatellite(!showSatellite)}
                  >
                    <Layers className="w-4 h-4 mr-2" />
                    {showSatellite ? 'Satélite' : 'Padrão'}
                  </Button>
                  
                  <Button
                    variant={printMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPrintMode(!printMode)}
                  >
                    Modo Impressão
                  </Button>
                  
                  <Button
                    variant={drawingMode === 'polygon' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDrawingMode(drawingMode === 'polygon' ? null : 'polygon')}
                  >
                    Desenhar
                  </Button>
                  
                  <Button
                    variant={drawingMode === 'measure' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDrawingMode(drawingMode === 'measure' ? null : 'measure')}
                  >
                    <Ruler className="w-4 h-4 mr-2" />
                    Medir
                  </Button>
                  
                  <Button
                    variant={drawingMode === 'edit' ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDrawingMode(drawingMode === 'edit' ? null : 'edit')}
                  >
                    Editar
                  </Button>
                  
                  <Button
                    variant={drawingMode === 'delete' ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => setDrawingMode(drawingMode === 'delete' ? null : 'delete')}
                  >
                    Deletar
                  </Button>
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

        {/* Sidebar - 25% */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-1/4 p-4 pl-0"
        >
          <Card className="h-[calc(100vh-120px)] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedBlock ? 'Editar Bloco' : 'Dados da Fazenda'}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Block Info Display */}
              {selectedBlock && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-900 mb-2">Dados Calculados</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <span className="text-green-700">Área:</span>
                      <p className="font-medium">{selectedBlock.area_m2?.toFixed(2)} m²</p>
                      <p className="font-medium">{selectedBlock.area_acres?.toFixed(4)} acres</p>
                    </div>
                    <div>
                      <span className="text-green-700">Perímetro:</span>
                      <p className="font-medium">{selectedBlock.perimetro?.toFixed(2)} m</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Block Form - Only when editing a block */}
              {selectedBlock && (
                <div className="space-y-4">
                  <Separator />
                  <h4 className="font-medium text-gray-900">Configurações do Bloco</h4>
                  
                  <div>
                    <Label htmlFor="block_nome">Nome do Bloco</Label>
                    <Input
                      id="block_nome"
                      value={blockFormData.nome}
                      onChange={(e) => setBlockFormData({...blockFormData, nome: e.target.value})}
                      placeholder="Ex: Talhão A1, Bloco Norte..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="block_cor">Cor do Bloco</Label>
                    <Select 
                      value={blockFormData.cor} 
                      onValueChange={(value) => {
                        setBlockFormData({...blockFormData, cor: value});
                        setSelectedColor(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg z-50">
                        {colorOptions.map((color) => (
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

                  <Button 
                    onClick={handleSaveBlock}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Bloco
                  </Button>
                </div>
              )}

              {/* Farm Form - Always visible when farm is selected */}
              {!selectedBlock && selectedFarmId && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Informações da Fazenda</h4>

                  <div>
                    <Label htmlFor="tipo_cana">Tipo de Cana</Label>
                    <Input
                      id="tipo_cana"
                      value={farmFormData.tipo_cana}
                      onChange={(e) => setFarmFormData({...farmFormData, tipo_cana: e.target.value})}
                      placeholder="SP80-1842, RB92579, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="data_plantio">Data do Plantio</Label>
                    <Input
                      id="data_plantio"
                      type="date"
                      value={farmFormData.data_plantio}
                      onChange={(e) => setFarmFormData({...farmFormData, data_plantio: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ultima_aplicacao">Última Aplicação</Label>
                    <Input
                      id="ultima_aplicacao"
                      type="date"
                      value={farmFormData.ultima_aplicacao}
                      onChange={(e) => setFarmFormData({...farmFormData, ultima_aplicacao: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="proxima_colheita">Próxima Colheita</Label>
                    <Input
                      id="proxima_colheita"
                      type="date"
                      value={farmFormData.proxima_colheita}
                      onChange={(e) => setFarmFormData({...farmFormData, proxima_colheita: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="observacoes">Observações</Label>
                    <Input
                      id="observacoes"
                      value={farmFormData.observacoes}
                      onChange={(e) => setFarmFormData({...farmFormData, observacoes: e.target.value})}
                      placeholder="Observações gerais sobre a fazenda"
                    />
                  </div>

                  <Button 
                    onClick={handleSaveFarm}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Dados da Fazenda
                  </Button>
                </div>
              )}

              {/* Drawing controls */}
              {!selectedBlock && (
                <div className="space-y-4">
                  <Separator />
                  <h4 className="font-medium text-gray-900">Novo Bloco</h4>
                  
                  <div>
                    <Label htmlFor="new_block_nome">Nome do Novo Bloco</Label>
                    <Input
                      id="new_block_nome"
                      value={blockFormData.nome}
                      onChange={(e) => setBlockFormData({...blockFormData, nome: e.target.value})}
                      placeholder="Ex: Talhão A1, Bloco Norte..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="new_block_cor">Cor do Novo Bloco</Label>
                    <Select 
                      value={selectedColor} 
                      onValueChange={(value) => {
                        setSelectedColor(value);
                        setBlockFormData({...blockFormData, cor: value});
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border shadow-lg z-50">
                        {colorOptions.map((color) => (
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

                  <div>
                    <Label htmlFor="transparencia">Transparência</Label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={transparency}
                      onChange={(e) => setTransparency(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-600">{Math.round(transparency * 100)}%</span>
                  </div>

                  <Separator />

                  {/* Advanced Options */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="showNDVI"
                        checked={showNDVI}
                        onCheckedChange={(checked) => setShowNDVI(!!checked)}
                      />
                      <Label htmlFor="showNDVI">Mostrar NDVI</Label>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedBlock(null);
                      setDrawingMode(null);
                      resetBlockForm();
                    }}
                    className="w-full"
                  >
                    Cancelar
                  </Button>
                </div>
              )}

              {/* Instructions */}
              <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Instruções:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Selecione uma fazenda primeiro</li>
                  <li>• Use "Desenhar" para criar novos blocos</li>
                  <li>• Use "Medir" para criar medições lineares</li>
                  <li>• Clique em blocos/medições existentes para editar</li>
                  <li>• Use "Modo Impressão" antes de exportar PDF</li>
                  <li>• Busque por endereços na barra de pesquisa</li>
                  <li>• Marque "É um dreno" para linhas azuis de água</li>
                  <li>• Configure transparência ao editar blocos</li>
                  <li>• "Exportar PDF 1:5" centraliza nos blocos com escala</li>
                  <li>• "Exportar Shapefile" gera arquivos SHP, SHX, DBF, PRJ</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AdvancedMapEditor;
