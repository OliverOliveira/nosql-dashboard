'use client';

import { useState } from 'react';
import { uploadFile } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Upload, File, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UploadProps {
  onUploadSuccess: () => void;
}

export function FileUpload({ onUploadSuccess }: UploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    validateFile(selectedFile);
  };

  const validateFile = (selectedFile?: File) => {
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
    ];

    if (!validTypes.includes(selectedFile.type)) {
      setError('Por favor, selecione um ficheiro CSV ou XLSX válido');
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const selectedFile = e.dataTransfer.files?.[0];
    validateFile(selectedFile);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor, selecione um ficheiro');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await uploadFile(file);
      setSuccess(`Ficheiro "${file.name}" enviado com sucesso! 🎉`);
      setFile(null);

      setTimeout(() => {
        onUploadSuccess();
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer upload';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="text-2xl">Carregar Ficheiro</CardTitle>
          <CardDescription>Envie um ficheiro CSV ou XLSX para começar a análise</CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <form onSubmit={handleUpload} className="space-y-6">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-200 ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-300 bg-slate-50 hover:border-slate-400'
              }`}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={loading}
                className="hidden"
                id="file-input"
              />

              <label
                htmlFor="file-input"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <div className="p-4 bg-blue-100 rounded-full mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  Arraste o ficheiro aqui
                </h3>
                <p className="text-slate-600 mb-4">ou clique para selecionar</p>
                <p className="text-sm text-slate-500">Formatos suportados: CSV, XLSX</p>
              </label>
            </div>

            {file && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={!file || loading}
              className={`w-full h-12 text-base font-semibold rounded-lg transition-all duration-200 ${
                !file || loading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:shadow-lg hover:scale-105'
              }`}
            >
              <Upload className="w-5 h-5 mr-2" />
              {loading ? 'Enviando ficheiro...' : 'Enviar Ficheiro'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

