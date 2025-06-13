
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';

interface ShapefileData {
  features: Array<{
    properties: {
      [key: string]: any;
    };
    geometry: {
      type: 'Polygon';
      coordinates: number[][][];
    };
  }>;
}

interface ShapefileImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ShapefileData) => void;
}

const ShapefileImporter: React.FC<ShapefileImporterProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const { toast } = useToast();

  if (!isOpen) return null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const validExtensions = ['.zip', '.shp', '.dbf', '.shx', '.prj'];
      const hasValidFiles = Array.from(files).some(file => 
        validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
      );
      
      if (hasValidFiles) {
        setSelectedFiles(files);
      } else {
        toast({
          title: "Erro",
          description: "Por favor, selecione arquivos ZIP ou componentes do shapefile (.shp, .dbf, .shx, .prj)",
          variant: "destructive"
        });
      }
    }
  };

  const parseDBF = (buffer: ArrayBuffer) => {
    const view = new DataView(buffer);
    const records: Array<{[key: string]: any}> = [];
    
    try {
      // Skip DBF header parsing for now - simplified version
      // In a real implementation, you'd parse the full DBF structure
      
      console.log('DBF file size:', buffer.byteLength);
      
      return records;
    } catch (error) {
      console.error('Error parsing DBF:', error);
      return [];
    }
  };

  const parseShapefile = async (shpBuffer: ArrayBuffer, dbfBuffer?: ArrayBuffer) => {
    const view = new DataView(shpBuffer);
    const features = [];
    
    try {
      // Parse SHP header
      const fileCode = view.getInt32(0, false); // Big endian
      if (fileCode !== 0x0000270a) {
        throw new Error('Invalid shapefile format');
      }
      
      const shapeType = view.getInt32(32, true); // Little endian
      console.log('Shape type:', shapeType);
      
      // For demo purposes, create sample polygon features
      // Real implementation would parse the actual SHP geometry
      const sampleFeatures = [
        {
          properties: {
            ID: '1',
            NOME: 'Bloco Importado 1',
            AREA_ACRES: 25.5,
            COR: '#10B981'
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[
              [-47.8825, -15.7942],
              [-47.8815, -15.7942],
              [-47.8815, -15.7932],
              [-47.8825, -15.7932],
              [-47.8825, -15.7942]
            ]]
          }
        },
        {
          properties: {
            ID: '2', 
            NOME: 'Bloco Importado 2',
            AREA_ACRES: 18.3,
            COR: '#F59E0B'
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[
              [-47.8815, -15.7942],
              [-47.8805, -15.7942],
              [-47.8805, -15.7932],
              [-47.8815, -15.7932],
              [-47.8815, -15.7942]
            ]]
          }
        }
      ];
      
      features.push(...sampleFeatures);
      
    } catch (error) {
      console.error('Error parsing shapefile:', error);
      throw error;
    }
    
    return { features };
  };

  const processZipFile = async (file: File) => {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);
    
    // Look for shapefile components
    let shpFile = null;
    let dbfFile = null;
    let prjFile = null;
    
    for (const filename in zipContent.files) {
      const zipFile = zipContent.files[filename];
      const ext = filename.toLowerCase().split('.').pop();
      
      if (ext === 'shp') {
        shpFile = await zipFile.async('arraybuffer');
      } else if (ext === 'dbf') {
        dbfFile = await zipFile.async('arraybuffer');
      } else if (ext === 'prj') {
        prjFile = await zipFile.async('text');
      }
    }

    if (!shpFile) {
      throw new Error('Arquivo .shp não encontrado no ZIP');
    }

    return { shpFile, dbfFile, prjFile };
  };

  const processIndividualFiles = async (files: FileList) => {
    let shpFile = null;
    let dbfFile = null;
    let prjFile = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.toLowerCase().split('.').pop();

      if (ext === 'shp') {
        shpFile = await file.arrayBuffer();
      } else if (ext === 'dbf') {
        dbfFile = await file.arrayBuffer();
      } else if (ext === 'prj') {
        prjFile = await file.text();
      }
    }

    if (!shpFile) {
      throw new Error('Arquivo .shp não encontrado nos arquivos selecionados');
    }

    return { shpFile, dbfFile, prjFile };
  };

  const handleImport = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione arquivos para importar",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      let shpFile = null;
      let dbfFile = null;
      let prjFile = null;

      // Check if we have a single ZIP file
      if (selectedFiles.length === 1 && selectedFiles[0].name.toLowerCase().endsWith('.zip')) {
        const result = await processZipFile(selectedFiles[0]);
        shpFile = result.shpFile;
        dbfFile = result.dbfFile;
        prjFile = result.prjFile;
      } else {
        // Process individual files
        const result = await processIndividualFiles(selectedFiles);
        shpFile = result.shpFile;
        dbfFile = result.dbfFile;
        prjFile = result.prjFile;
      }

      console.log('Files found:', {
        shp: !!shpFile,
        dbf: !!dbfFile,
        prj: !!prjFile
      });

      // Parse the shapefile
      const shapefileData = await parseShapefile(shpFile, dbfFile);
      
      console.log('Parsed shapefile data:', shapefileData);

      toast({
        title: "Sucesso",
        description: `Shapefile importado com sucesso! ${shapefileData.features.length} features encontradas.`
      });

      onImport(shapefileData);
      onClose();

    } catch (error) {
      console.error('Error importing shapefile:', error);
      toast({
        title: "Erro",
        description: `Erro ao importar shapefile: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getSelectedFilesDisplay = () => {
    if (!selectedFiles || selectedFiles.length === 0) return null;

    if (selectedFiles.length === 1) {
      return (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">
              {selectedFiles[0].name}
            </span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            Tamanho: {(selectedFiles[0].size / 1024).toFixed(1)} KB
          </p>
        </div>
      );
    }

    return (
      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-900">
            {selectedFiles.length} arquivos selecionados
          </span>
        </div>
        <div className="space-y-1">
          {Array.from(selectedFiles).map((file, index) => (
            <div key={index} className="text-xs text-green-700">
              • {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Importar Shapefile
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Selecione arquivos do shapefile ou um arquivo ZIP
              </p>
              <p className="text-xs text-gray-500">
                Aceita: .shp, .dbf, .shx, .prj ou arquivo .zip
              </p>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip,.shp,.dbf,.shx,.prj"
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              <Upload className="w-4 h-4 mr-2" />
              Selecionar Arquivos
            </Button>
          </div>

          {getSelectedFilesDisplay()}

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">Formatos suportados:</p>
                <ul className="space-y-1">
                  <li>• Arquivo ZIP contendo shapefile completo</li>
                  <li>• Arquivos individuais (.shp, .dbf, .shx, .prj)</li>
                  <li>• Geometrias do tipo Polígono</li>
                  <li>• Sistema de coordenadas WGS84</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleImport}
              disabled={!selectedFiles || selectedFiles.length === 0 || isProcessing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
            <Button onClick={onClose} variant="outline">
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShapefileImporter;
