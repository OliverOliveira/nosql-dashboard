import axios from 'axios';
import type { UploadResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const uploadFile = async (file: File): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export interface SummaryData {
  totalRows: number;
  numericFields: Array<{
    field: string;
    count: number;
    sum: number;
    average: number;
  }>;
}

export const getSummary = async (): Promise<SummaryData> => {
  const response = await apiClient.get<SummaryData>('/stats/summary');
  return response.data;
};

export const getGroupByField = async (field: string) => {
  const response = await apiClient.get(`/stats/group-by/${field}`);
  return response.data;
};
