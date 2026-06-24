import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2, ChevronDown } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface ExportButtonProps {
  endpoint: string;
  queryParams?: Record<string, any>;
  filename: string;
}

export function ExportButton({ endpoint, queryParams = {}, filename }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      setIsExporting(format);
      setIsOpen(false);
      
      const params = new URLSearchParams();
      params.append('format', format);
      
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await apiClient.get(`${endpoint}?${params.toString()}`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={!!isExporting}
        className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-violet-500/20"
      >
        {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        {isExporting ? 'Exporting...' : 'Export'}
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-48 bg-[#0a0a0f] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1">
            <button
              onClick={() => handleExport('excel')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left text-white hover:bg-white/5 transition-colors"
            >
              <FileSpreadsheet size={16} className="text-emerald-400" />
              Excel (.xlsx)
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left text-white hover:bg-white/5 transition-colors"
            >
              <FileText size={16} className="text-blue-400" />
              CSV (.csv)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
