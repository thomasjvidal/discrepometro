import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Database, Table, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UploadAreaProps {
  onFileUpload: (files: File[]) => void;
  isUploading?: boolean;
  progress?: number;
  error?: string;
}

function getTipoArquivo(nome: string): string {
  if (nome.endsWith('.xlsx') || nome.endsWith('.csv')) return 'Movimentações';
  if (nome.endsWith('.pdf')) return 'Inventário';
  return 'Desconhecido';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

const UploadArea = ({ onFileUpload, isUploading, progress, error }: UploadAreaProps) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log('🔥 onDrop chamado!');
    console.log('🔥 Arquivos aceitos:', acceptedFiles.length);
    console.log('🔥 Detalhes dos arquivos:', acceptedFiles.map(f => ({
      name: f.name, 
      size: f.size, 
      sizeMB: (f.size / 1024 / 1024).toFixed(2) + 'MB',
      type: f.type,
      lastModified: f.lastModified
    })));
    
    if (acceptedFiles.length === 0) {
      console.log('🔥 ERRO: Nenhum arquivo aceito!');
      return;
    }
    
    const validFiles = acceptedFiles.filter(file => {
      console.log(`🔥 Validando arquivo ${file.name}:`);
      console.log(`🔥 Tamanho: ${file.size} bytes (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
      console.log(`🔥 Limite: ${MAX_FILE_SIZE} bytes (${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB)`);
      
      if (file.size > MAX_FILE_SIZE) {
        const errorMsg = `O arquivo ${file.name} excede o limite de 200MB`;
        console.log(`🔥 ERRO: ${errorMsg}`);
        setFileError(errorMsg);
        return false;
      }
      console.log(`🔥 Arquivo ${file.name} é válido!`);
      return true;
    });

    console.log('🔥 Arquivos válidos filtrados:', validFiles.length);
    
    // SEMPRE atualizar os arquivos, mesmo se já existirem
    setFiles(validFiles);
    onFileUpload(validFiles);
    setFileError(null);
    setIsDragActive(false);
    
    console.log('🔥 Estado atualizado com arquivos:', validFiles.map(f => f.name));
  }, [onFileUpload]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => {
      console.log('🔥 Drag enter');
      setIsDragActive(true);
    },
    onDragLeave: () => {
      console.log('🔥 Drag leave');
      setIsDragActive(false);
    },
    accept: {
      'text/csv': ['.csv'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
      'application/octet-stream': ['.xlsx', '.xls'],
      'application/zip': ['.xlsx']
    },
    multiple: true,
    maxSize: MAX_FILE_SIZE,
    onDropAccepted: (files) => {
      console.log('🔥 Arquivos ACEITOS pelo dropzone:', files.map(f => ({
        name: f.name,
        size: (f.size / 1024 / 1024).toFixed(2) + 'MB',
        type: f.type
      })));
    },
    onDropRejected: (rejectedFiles) => {
      console.log('🔥 Arquivos REJEITADOS pelo dropzone:', rejectedFiles.length);
      rejectedFiles.forEach((rejection, index) => {
        console.log(`🔥 Arquivo rejeitado ${index + 1}:`, {
          name: rejection.file.name,
          size: (rejection.file.size / 1024 / 1024).toFixed(2) + 'MB',
          type: rejection.file.type,
          errors: rejection.errors.map(e => ({ code: e.code, message: e.message }))
        });
      });
    },
    onError: (error) => {
      console.log('🔥 ERRO no dropzone:', error);
    }
  });

  return (
    <div className="space-y-4">
    <div
      {...getRootProps()}
      className={`
        relative cursor-pointer transition-all duration-300 rounded-2xl
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        ${isDragActive 
          ? 'scale-105 animate-pulse-golden' 
          : 'hover:scale-102'
        }
      `}
    >
        <input {...getInputProps()} disabled={isUploading} />
      
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
                Suporte para CSV, PDF e XLSX • Até 200MB por arquivo
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
            <div className="w-px h-6 bg-dark-700"></div>
            <div className="flex items-center gap-2 text-dark-500">
              <Table className="w-5 h-5" />
              <span className="text-sm">XLSX</span>
            </div>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{file.name}</span>
                      <span className="text-dark-500">({formatFileSize(file.size)})</span>
                      <span className="text-dark-400">
                        • {file.name.endsWith('.xlsx') ? 'XLSX' : file.name.endsWith('.csv') ? 'CSV' : 'PDF'}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      getTipoArquivo(file.name) === 'Movimentações' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {getTipoArquivo(file.name)}
                    </span>
                </div>
              ))}
            </div>
          )}

            {/* Progress */}
            {isUploading && progress !== undefined && (
              <div className="mt-4 space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-dark-400">
                  Enviando arquivos... {progress}%
                </p>
              </div>
            )}
        </div>
      </Card>
      </div>

      {/* Error Messages */}
      {(error || fileError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || fileError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default UploadArea;
