'use client';

import { useEffect, useState } from 'react';
import { getSummary, getGroupByField } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, RefreshCw, TrendingUp, Database, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DashboardStats {
  totalRows: number;
  numericFields: Array<{
    field: string;
    count: number;
    sum: number;
    average: number;
  }>;
}

interface GroupByData {
  [key: string]: string | number | boolean;
  total: number;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function Dashboard({ onNewUpload }: { onNewUpload: () => void }) {
  const [summary, setSummary] = useState<DashboardStats | null>(null);
  const [groupData, setGroupData] = useState<Record<string, GroupByData[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const summaryData = await getSummary();
      setSummary(summaryData);

      const groupedData: Record<string, GroupByData[]> = {};

      if (summaryData.numericFields.length > 0) {
        const firstField = summaryData.numericFields[0].field;
        try {
          const grouped = await getGroupByField(firstField);
          groupedData[firstField] = grouped;
        } catch (err) {
          console.warn(`Não foi possível agrupar por campo ${firstField}:`, err);
        }
      }

      setGroupData(groupedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await loadStats();
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-600 font-medium">Carregando dados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex-1">{error}</AlertDescription>
        <Button onClick={loadStats} variant="outline" size="sm">
          Tentar Novamente
        </Button>
      </Alert>
    );
  }

  if (!summary) {
    return (
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Nenhum dado disponível</AlertDescription>
      </Alert>
    );
  }

  const chartData = summary.numericFields.map((field) => ({
    name: field.field,
    Média: parseFloat(field.average.toFixed(2)),
    Soma: field.sum,
  }));

  const firstGroupData = Object.values(groupData)[0];
  const pieData = firstGroupData
    ? firstGroupData.slice(0, 8).map((item) => ({
        name: String(Object.values(item)[0]),
        value: item.total,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">Bem-vindo ao seu painel de análise de dados</p>
        </div>
        <Button
          onClick={onNewUpload}
          variant="outline"
          className="cursor-pointer hover:shadow-lg transition-shadow"
        >
          + Novo Upload
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total de Registos</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{summary.totalRows.toLocaleString('pt-PT')}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Campos Numéricos</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{summary.numericFields.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Layers className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Média por Campo</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">
                  {(summary.numericFields.reduce((sum, f) => sum + f.average, 0) / summary.numericFields.length || 0).toFixed(1)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Resumo Numérico</CardTitle>
            <CardDescription>Soma e Média dos valores numéricos por campo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="Soma" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Média" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pieData.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Distribuição de Dados</CardTitle>
              <CardDescription>Distribuição dos valores agrupados</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Detalhes dos Campos</CardTitle>
            <CardDescription>Estatísticas de cada campo numérico</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {summary.numericFields.map((field) => (
                <div key={field.field} className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-slate-900">{field.field}</h4>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {field.count} itens
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-slate-600">Soma</p>
                      <p className="font-semibold text-slate-900">{field.sum.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Média</p>
                      <p className="font-semibold text-slate-900">{field.average.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
