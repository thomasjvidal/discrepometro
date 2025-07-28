
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Database, Table } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface UploadAreaProps {
  onFileUpload: (files: File[]) => void;
  isUploading?: boolean;
  progress?: number;
  error?: string;
}

const UploadArea = ({ onFileUpload, isUploading, progress, error }: UploadAreaProps) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('📁 Arquivos aceitos no dropzone:', acceptedFiles.map(f => f.name));
    onFileUpload(acceptedFiles);
    setIsDragActive(false);
  }, [onFileUpload]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.ms-excel.sheet.binary.macroEnabled.12': ['.xlsb']
    },
    multiple: true,
    disabled: isUploading
  });

  return (
    <div
      {...getRootProps()}
      className={`
        relative cursor-pointer transition-all duration-300 rounded-2xl
        ${isDragActive 
          ? 'scale-105 animate-pulse-golden' 
          : 'hover:scale-102'
        }
        ${isUploading ? 'pointer-events-none opacity-50' : ''}
      `}
    >
      <input {...getInputProps()} />
      
      <Card className={`
        neomorphism p-12 text-center border-2 border-dashed transition-all duration-300
        ${isDragActive 
          ? 'border-golden-400 bg-golden-500/10' 
          : error
          ? 'border-red-400 bg-red-500/10'
          : 'border-dark-600 hover:border-golden-500/50'
        }
      `}>
        <div className="space-y-6">
          {/* Upload Icon */}
          <div className={`
            mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
            ${isDragActive 
              ? 'bg-golden-500 golden-glow' 
              : error
              ? 'bg-red-500'
              : 'bg-gradient-to-br from-golden-400/20 to-golden-600/20'
            }
          `}>
            <Upload className={`
              w-8 h-8 transition-colors duration-300
              ${isDragActive ? 'text-dark-900' : error ? 'text-white' : 'text-golden-400'}
            `} />
          </div>

          {/* Text Content */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              {isDragActive 
                ? 'Solte os arquivos aqui' 
                : isUploading 
                ? 'Processando arquivos...'
                : 'Arraste os arquivos ou clique para selecionar'
              }
            </h3>
            <p className="text-dark-400">
              Suporte para Excel, CSV e PDF • Até 100MB por arquivo
            </p>
            {error && (
              <p className="text-red-400 text-sm font-medium">
                {error}
              </p>
            )}
          </div>

          {/* File Type Icons */}
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-dark-500">
              <Table className="w-5 h-5" />
              <span className="text-sm">Excel</span>
            </div>
            <div className="w-px h-6 bg-dark-700"></div>
            <div className="flex items-center gap-2 text-dark-500">
              <Database className="w-5 h-5" />
              <span className="text-sm">CSV</span>
            </div>
            <div className="w-px h-6 bg-dark-700"></div>
            <div className="flex items-center gap-2 text-dark-500">
              <FileText className="w-5 h-5" />
              <span className="text-sm">PDF</span>
            </div>
          </div>

          {/* Progress Bar */}
          {isUploading && progress !== undefined && (
            <div className="w-full bg-dark-800 rounded-full h-2">
              <div 
                className="bg-golden-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UploadArea;
