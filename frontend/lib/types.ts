export interface UploadResponse {
  filename: string;
  mimetype: string;
  status: 'uploaded';
}

export interface DataRecord {
  [key: string]: string | number;
}

export interface DashboardData {
  records: DataRecord[];
  columns: string[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}
