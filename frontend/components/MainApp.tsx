'use client';

import { useState, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { Dashboard } from './Dashboard';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { getSummary } from '@/lib/api';

export function MainApp() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    checkForExistingData();
  }, []);

  const checkForExistingData = async () => {
    try {
      await getSummary();
      setHasData(true);
      setActiveTab('dashboard');
    } catch (err) {
      setHasData(false);
      setActiveTab('upload');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    setHasData(true);
    setActiveTab('dashboard');
  };

  const handleTabChange = (tab: 'dashboard' | 'upload') => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600 font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-auto bg-slate-50">
          <div className="p-8">
            {activeTab === 'dashboard' ? (
              hasData ? (
                <Dashboard onNewUpload={() => setActiveTab('upload')} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-600 mb-4">Nenhum dado disponível</p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Fazer Upload
                  </button>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center">
                <FileUpload onUploadSuccess={handleUploadSuccess} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
