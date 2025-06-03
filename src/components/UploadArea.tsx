
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Database } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface UploadAreaProps {
  onFileUpload: (files: File[]) => void;
}

const UploadArea = ({ onFileUpload }: UploadAreaProps) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFileUpload(acceptedFiles);
    setIsDragActive(false);
  }, [onFileUpload]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf']
    },
    multiple: true
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
      `}
    >
      <input {...getInputProps()} />
      
      <Card className={`
        neomorphism p-12 text-center border-2 border-dashed transition-all duration-300
        ${isDragActive 
          ? 'border-golden-400 bg-golden-500/10' 
          : 'border-dark-600 hover:border-golden-500/50'
        }
      `}>
        <div className="space-y-6">
          {/* Upload Icon */}
          <div className={`
            mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
            ${isDragActive 
              ? 'bg-golden-500 golden-glow' 
              : 'bg-gradient-to-br from-golden-400/20 to-golden-600/20'
            }
          `}>
            <Upload className={`
              w-8 h-8 transition-colors duration-300
              ${isDragActive ? 'text-dark-900' : 'text-golden-400'}
            `} />
          </div>

          {/* Text Content */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              {isDragActive ? 'Solte os arquivos aqui' : 'Arraste os arquivos ou clique para selecionar'}
            </h3>
            <p className="text-dark-400">
              Suporte para CSV e PDF • Até 100MB por arquivo
            </p>
          </div>

          {/* File Type Icons */}
          <div className="flex items-center justify-center gap-8">
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
        </div>
      </Card>
    </div>
  );
};

export default UploadArea;
