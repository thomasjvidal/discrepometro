import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist/webpack';

// Configurar worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const DiscrepancyUpload = () => {
  const [files, setFiles] = useState({
    pdf: null,
    excel: null
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]);

  const addDebugInfo = (message) => {
    console.log(message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Função para fazer upload do arquivo XLSX para o Supabase
  const handleXlsxUpload = async (file: File) => {
    addDebugInfo(`Iniciando upload do arquivo XLSX: ${file.name}`);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', '07b94f69-1eba-4ef0-83b3-4d240966597c');

    try {
      const res = await fetch('https://hvjjcegcdivumprqviug.supabase.co/functions/v1/upload_xlsx', {
        method: 'POST',
        headers: {
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ampjZWdjZGl2dW1wcnF2aXVnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzY3ODUwMCwiZXhwIjoyMDYzMjU0NTAwfQ.KxnvLHj6Q4pqZ0C2OXIMNxgXVth0Uvo0WPBW638K578`
        },
        body: formData
      });

      const data = await res.json();
      addDebugInfo(`✅ Upload XLSX concluído: ${JSON.stringify(data)}`);
      return data;
    } catch (err) {
      const errorMsg = `Erro ao fazer upload XLSX: ${err.message}`;
      addDebugInfo(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }
  };

  // Função para processar arquivos Excel
  const processExcelFile = async (file) => {
    addDebugInfo(`Processando Excel: ${file.name}`);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          addDebugInfo('Lendo dados do Excel...');
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { 
            type: 'array',
            cellDates: true,
            cellStyles: true 
          });
          
          addDebugInfo(`Planilhas encontradas: ${workbook.SheetNames.join(', ')}`);
          
          // Pega a primeira planilha
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Converte para JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1, // Usa array de arrays
            defval: '', // Valor padrão para células vazias
            raw: false // Converte números para strings
          });
          
          addDebugInfo(`✅ Excel processado: ${jsonData.length} linhas`);
          resolve(jsonData);
        } catch (error) {
          addDebugInfo(`❌ Erro ao processar Excel: ${error.message}`);
          reject(error);
        }
      };
      reader.onerror = () => {
        addDebugInfo('❌ Erro ao ler arquivo Excel');
        reject(new Error('Erro ao ler arquivo Excel'));
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // Função para processar PDF
  const processPDFFile = async (file) => {
    addDebugInfo(`Processando PDF: ${file.name}`);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          addDebugInfo('Lendo dados do PDF...');
          const typedarray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          
          addDebugInfo(`PDF tem ${pdf.numPages} páginas`);
          
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n';
          }
          
          addDebugInfo(`✅ PDF processado: ${fullText.length} caracteres`);
          resolve(fullText);
        } catch (error) {
          addDebugInfo(`❌ Erro ao processar PDF: ${error.message}`);
          reject(error);
        }
      };
      reader.onerror = () => {
        addDebugInfo('❌ Erro ao ler arquivo PDF');
        reject(new Error('Erro ao ler arquivo PDF'));
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (fileType, file) => {
    if (!file) return;

    addDebugInfo(`Upload iniciado: ${fileType} - ${file.name}`);
    setError(null);
    
    // Validações de tipo de arquivo
    const validTypes = {
      pdf: ['application/pdf'],
      excel: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
        'application/vnd.ms-excel'
      ]
    };

    // Verifica se é um arquivo Excel pela extensão
    const isExcelByExtension = fileType === 'excel' && 
      ['.xlsx', '.xls'].some(ext => 
        file.name.toLowerCase().endsWith(ext)
      );

    const isValidType = validTypes[fileType].includes(file.type) || isExcelByExtension;
    
    if (!isValidType) {
      const errorMsg = `Tipo de arquivo inválido para ${fileType}. Esperado: ${validTypes[fileType].join(', ')}. Recebido: ${file.type}`;
      setError(errorMsg);
      addDebugInfo(`❌ ${errorMsg}`);
      return;
    }

    addDebugInfo(`✅ Tipo de arquivo válido: ${file.type}`);
    
    try {
      if (fileType === 'excel') {
        // Se for XLSX, faz upload para o Supabase
        await handleXlsxUpload(file);
      }
      
      setFiles(prev => ({
        ...prev,
        [fileType]: file
      }));
    } catch (error) {
      setError(error.message);
    }
  };

  const processFiles = async () => {
    if (!files.pdf || !files.excel) {
      setError('Por favor, carregue os dois tipos de arquivo (PDF e Excel).');
      return;
    }

    setLoading(true);
    setError(null);
    setDebugInfo([]);
    addDebugInfo('Iniciando processamento dos arquivos...');

    try {
      // Processar cada arquivo
      addDebugInfo('Processando arquivos em paralelo...');
      const [pdfData, excelData] = await Promise.all([
        processPDFFile(files.pdf),
        processExcelFile(files.excel)
      ]);

      // Aqui você implementaria a lógica de comparação
      const discrepancies = compareData(pdfData, excelData);
      
      const results = {
        pdfText: pdfData,
        pdfItems: typeof pdfData === 'string' ? pdfData.split('\n').filter(line => line.trim()) : [],
        excelItems: excelData,
        discrepancies: discrepancies
      };

      addDebugInfo('✅ Processamento concluído com sucesso!');
      setResults(results);

    } catch (error) {
      const errorMsg = `Erro ao processar arquivos: ${error.message}`;
      addDebugInfo(`❌ ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Função simples de comparação
  const compareData = (pdfData, excelData) => {
    const discrepancies = [];
    
    const pdfLines = typeof pdfData === 'string' ? pdfData.split('\n').filter(line => line.trim()) : [];
    
    discrepancies.push({
      type: 'count',
      description: `PDF: ${pdfLines.length} linhas de texto, Excel: ${excelData.length} linhas`
    });

    // Aqui você pode adicionar mais lógica de comparação específica
    if (pdfLines.length !== excelData.length) {
      discrepancies.push({
        type: 'difference',
        description: `Diferença na quantidade: PDF tem ${pdfLines.length} itens, Excel tem ${excelData.length} itens`
      });
    }

    return discrepancies;
  };

  const downloadResults = () => {
    if (!results) return;

    const reportData = {
      timestamp: new Date().toISOString(),
      files: {
        pdf: files.pdf?.name,
        excel: files.excel?.name
      },
      summary: {
        pdfLines: results.pdfItems.length,
        excelRows: results.excelItems.length
      },
      discrepancies: results.discrepancies,
      debugLog: debugInfo
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discrepancy-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const FileUploadArea = ({ type, label, accept, file }) => (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
      <input
        type="file"
        id={`file-${type}`}
        accept={type === 'excel' ? '.xlsx,.xls' : accept}
        onChange={(e) => handleFileUpload(type, e.target.files[0])}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <Upload className="mx-auto h-16 w-16 text-gray-400 mb-4" />
      <p className="text-lg font-medium text-gray-700 mb-2">{label}</p>
      <p className="text-sm text-gray-500 mb-1">Clique aqui para selecionar</p>
      <p className="text-xs text-gray-400">ou arraste o arquivo para esta área</p>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          document.getElementById(`file-${type}`).click();
        }}
        className="mt-2 text-sm text-blue-600 hover:text-blue-700"
      >
        Mostrar Opções
      </button>
      {file && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-center text-sm text-green-700">
            <CheckCircle className="h-4 w-4 mr-2" />
            <span className="font-medium">{file.name}</span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Discrepômetro Golden Nexus
        </h1>
        <p className="text-lg text-gray-600">
          Compare inventários PDF com planilhas Excel para identificar discrepâncias
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <FileUploadArea
          type="pdf"
          label="Inventário PDF"
          accept=".pdf"
          file={files.pdf}
        />
        <FileUploadArea
          type="excel"
          label="Planilha Excel"
          accept=".xlsx,.xls"
          file={files.excel}
        />
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={processFiles}
          disabled={loading || !files.pdf || !files.excel}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-4 px-8 rounded-lg transition-colors flex items-center text-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Processando...
            </>
          ) : (
            <>
              <FileText className="h-5 w-5 mr-3" />
              Processar e Comparar
            </>
          )}
        </button>
      </div>

      {/* Debug Info */}
      {debugInfo.length > 0 && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Log de Processamento:</h3>
          <div className="max-h-40 overflow-y-auto bg-gray-800 text-green-400 p-3 rounded font-mono text-sm">
            {debugInfo.map((info, index) => (
              <div key={index} className="mb-1">
                {info}
              </div>
            ))}
          </div>
        </div>
      )}

      {results && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Resultados da Análise</h2>
            <button
              onClick={downloadResults}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar Relatório
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-medium text-gray-900 mb-2">Inventário PDF</h3>
              <p className="text-3xl font-bold text-blue-600">{results.pdfItems.length}</p>
              <p className="text-sm text-gray-600">linhas de texto</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="font-medium text-gray-900 mb-2">Planilha Excel</h3>
              <p className="text-3xl font-bold text-green-600">{results.excelItems.length}</p>
              <p className="text-sm text-gray-600">linhas processadas</p>
            </div>
          </div>

          {results.discrepancies.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="font-medium text-gray-900 mb-4">Discrepâncias Encontradas</h3>
              <ul className="space-y-3">
                {results.discrepancies.map((discrepancy, index) => (
                  <li key={index} className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{discrepancy.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prévia dos dados Excel */}
          {results.excelItems.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-medium text-gray-900 mb-4">Prévia dos dados Excel (primeiras 10 linhas)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <tbody className="bg-white divide-y divide-gray-200">
                    {results.excelItems.slice(0, 10).map((row, index) => (
                      <tr key={index} className={index === 0 ? 'bg-gray-50 font-medium' : ''}>
                        {Array.isArray(row) ? row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border">
                            {cell || '(vazio)'}
                          </td>
                        )) : (
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border">
                            {JSON.stringify(row)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscrepancyUpload; 