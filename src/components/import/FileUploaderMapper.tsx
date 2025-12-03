
import React, { useState } from 'react';
import Papa from 'papaparse';
import { ArrowUpTrayIcon, DocumentChartBarIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

const REQUIRED_FIELDS = [
    { key: 'name', label: 'Nome do Produto' },
    { key: 'price', label: 'Preço Unitário' },
    { key: 'ean', label: 'EAN / Código de Barras' },
    { key: 'stock', label: 'Stock Inicial' }
];

const FileUploaderMapper = () => {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const parseFile = (fileToParse: File) => {
    Papa.parse(fileToParse, {
      header: true,
      skipEmptyLines: true,
      preview: 5, // Preview first 5 lines
      complete: (results) => {
        if (results.meta.fields) {
          setHeaders(results.meta.fields);
          setPreviewData(results.data);
          
          // Auto-mapping logic
          const initialMap: Record<string, string> = {};
          REQUIRED_FIELDS.forEach(field => {
             const foundHeader = results.meta.fields?.find(h => 
                 h.toLowerCase().includes(field.key.toLowerCase()) || 
                 h.toLowerCase().includes(field.label.toLowerCase())
             );
             if(foundHeader) initialMap[field.key] = foundHeader;
          });
          setMapping(initialMap);
          setStep(2);
        }
      },
      error: (error) => {
          alert("Erro ao ler o ficheiro CSV: " + error.message);
      }
    });
  };
  
  const handleMappingChange = (fieldKey: string, selectedHeader: string) => {
    setMapping(prev => ({ ...prev, [fieldKey]: selectedHeader }));
  };
  
  const isMappingComplete = () => {
    return REQUIRED_FIELDS.every(field => mapping[field.key] && mapping[field.key] !== '');
  };

  const handleImport = () => {
      if(!isMappingComplete()) {
        alert("Por favor, mapeie todos os campos obrigatórios.");
        return;
      }
      
      setIsProcessing(true);
      
      // Simulate API call delay
      setTimeout(() => {
          console.log("Importing file:", file?.name);
          console.log("Mapping configuration:", mapping);
          setIsProcessing(false);
          setStep(3);
      }, 1500);
  };

  const resetImport = () => {
      setFile(null);
      setHeaders([]);
      setPreviewData([]);
      setMapping({});
      setStep(1);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
        {/* Progress Stepper */}
        <div className="flex items-center justify-center mb-8">
            <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
                <span className={`w-8 h-8 flex items-center justify-center border-2 rounded-full font-bold ${step >= 1 ? 'border-primary bg-blue-50' : 'border-gray-300'}`}>1</span>
                <span className="ml-2 text-sm font-medium">Upload</span>
            </div>
            <div className={`w-16 h-1 mx-4 ${step >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
            <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
                <span className={`w-8 h-8 flex items-center justify-center border-2 rounded-full font-bold ${step >= 2 ? 'border-primary bg-blue-50' : 'border-gray-300'}`}>2</span>
                <span className="ml-2 text-sm font-medium">Mapeamento</span>
            </div>
            <div className={`w-16 h-1 mx-4 ${step >= 3 ? 'bg-primary' : 'bg-gray-200'}`} />
            <div className={`flex items-center ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>
                <span className={`w-8 h-8 flex items-center justify-center border-2 rounded-full font-bold ${step >= 3 ? 'border-primary bg-blue-50' : 'border-gray-300'}`}>3</span>
                <span className="ml-2 text-sm font-medium">Conclusão</span>
            </div>
        </div>

      {step === 1 && (
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-primary transition-colors bg-gray-50">
            <ArrowUpTrayIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Carregar Ficheiro CSV</h3>
            <p className="text-gray-500 mb-6 text-sm">Arraste e largue o ficheiro aqui ou clique para selecionar.</p>
            
            <label htmlFor="file-upload" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-blue-700 cursor-pointer shadow-sm transition-colors">
                <span>Selecionar Ficheiro</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} />
            </label>
            <p className="mt-4 text-xs text-gray-400">Suporta apenas ficheiros .csv (Max 10MB)</p>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Mapeamento de Colunas</h3>
                    <p className="text-sm text-gray-500">Ficheiro: <span className="font-mono text-gray-700">{file?.name}</span></p>
                </div>
                <button onClick={resetImport} className="text-sm text-red-600 hover:text-red-800 font-medium">
                    Cancelar
                </button>
            </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Mapping Form */}
                <div>
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <DocumentChartBarIcon className="h-5 w-5 mr-2 text-gray-500"/>
                        Campos Obrigatórios
                    </h4>
                    <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        {REQUIRED_FIELDS.map(field => (
                        <div key={field.key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label} <span className="text-red-500">*</span>
                            </label>
                            <select 
                                value={mapping[field.key] || ''}
                                onChange={(e) => handleMappingChange(field.key, e.target.value)}
                                className={`block w-full pl-3 pr-10 py-2 text-sm border focus:outline-none focus:ring-primary focus:border-primary rounded-md ${!mapping[field.key] ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'}`}
                            >
                                <option value="">-- Selecione a coluna do CSV --</option>
                                {headers.map(header => (
                                    <option key={header} value={header}>{header}</option>
                                ))}
                            </select>
                        </div>
                        ))}
                    </div>
                </div>

                {/* Preview Table */}
                <div>
                     <h4 className="font-semibold text-gray-800 mb-4">Pré-visualização (5 linhas)</h4>
                     <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    {headers.slice(0, 3).map(h => (
                                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider truncate max-w-[100px]" title={h}>{h}</th>
                                    ))}
                                    {headers.length > 3 && <th className="px-3 py-2 text-left font-medium text-gray-500 text-xs">...</th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {previewData.map((row, i) => (
                                    <tr key={i}>
                                        {headers.slice(0, 3).map(h => (
                                            <td key={h} className="px-3 py-2 whitespace-nowrap text-gray-600 truncate max-w-[100px]">{row[h]}</td>
                                        ))}
                                        {headers.length > 3 && <td className="px-3 py-2 text-gray-400 text-xs">...</td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                     <p className="text-xs text-gray-500 mt-2 text-right">Total de colunas encontradas: {headers.length}</p>
                </div>
            </div>
          </div>

           <div className="bg-gray-50 px-6 py-4 flex justify-end items-center border-t border-gray-100">
                <div className="text-sm text-gray-500 mr-4">
                    {isMappingComplete() ? (
                        <span className="text-green-600 flex items-center font-medium"><CheckCircleIcon className="h-4 w-4 mr-1"/> Mapeamento completo</span>
                    ) : (
                        <span className="text-yellow-600">Preencha todos os campos obrigatórios</span>
                    )}
                </div>
                <button 
                    onClick={handleImport} 
                    disabled={!isMappingComplete() || isProcessing} 
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    {isProcessing ? (
                         <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            A Processar...
                         </>
                    ) : 'Confirmar e Importar'}
                </button>
           </div>
        </div>
      )}
      
      {step === 3 && (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <CheckCircleIcon className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Importação Concluída com Sucesso!</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">Os dados do ficheiro <span className="font-semibold">{file?.name}</span> foram processados. O catálogo de produtos foi atualizado.</p>
            <button onClick={resetImport} className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                Importar Outro Ficheiro
            </button>
        </div>
      )}
    </div>
  );
};

export default FileUploaderMapper;
