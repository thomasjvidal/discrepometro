import { X, FileText, Database, CheckCircle, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface FilePreviewProps {
  file: {
    file: File;
    type: 'csv' | 'pdf' | 'xlsx';
    progress?: number;
    status?: 'uploading' | 'processing' | 'complete' | 'error';
    error?: string;
  };
  onRemove: () => void;
}

const FilePreview = ({ file, onRemove }: FilePreviewProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = () => {
    switch (file.type) {
      case 'csv':
        return Database;
      case 'xlsx':
        return Table;
      default:
        return FileText;
    }
  };

  const getFileTypeColor = () => {
    switch (file.type) {
      case 'csv':
        return 'bg-blue-500/20 text-blue-400';
      case 'xlsx':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-red-500/20 text-red-400';
    }
  };

  const getFileTypeLabel = () => {
    switch (file.type) {
      case 'csv':
        return 'Movimentações';
      case 'xlsx':
        return 'Planilha';
      default:
        return 'Inventário';
    }
  };

  const getStatusIcon = () => {
    switch (file.status) {
      case 'uploading':
        return <Progress value={file.progress} className="w-full h-1" />;
      case 'processing':
        return <div className="animate-pulse text-yellow-400">Processando...</div>;
      case 'complete':
        return <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />;
      case 'error':
        return <div className="text-red-400">Erro</div>;
      default:
        return null;
    }
  };

  const Icon = getFileIcon();

  return (
    <Card className="neomorphism p-4 border-dark-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* File Icon */}
          <div className={`p-3 rounded-xl ${getFileTypeColor()}`}>
            <Icon className="w-6 h-6" />
          </div>

          {/* File Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-foreground truncate">
                {file.file.name}
              </h4>
              {getStatusIcon()}
            </div>
            <div className="flex items-center gap-4 text-sm text-dark-400">
              <span>{formatFileSize(file.file.size)}</span>
              <span className="text-dark-600">•</span>
              <span className="uppercase">{file.type}</span>
              {file.error && (
                <>
                  <span className="text-dark-600">•</span>
                  <span className="text-red-400">{file.error}</span>
                </>
              )}
            </div>
          </div>

          {/* File Type Badge */}
          <div className={`px-3 py-1 rounded-lg text-xs font-medium ${getFileTypeColor()}`}>
            {getFileTypeLabel()}
          </div>
        </div>

        {/* Remove Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-dark-500 hover:text-red-400 hover:bg-red-500/10 ml-4"
          disabled={file.status === 'uploading' || file.status === 'processing'}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

export default FilePreview;
