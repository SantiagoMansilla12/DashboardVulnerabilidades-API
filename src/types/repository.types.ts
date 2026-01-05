export interface IRepository {
  name: string;
  url: string;
  branch?: string;
  enabled: boolean;
  cloned?: boolean;
}

export interface IScanResult {
  repository: string;
  success: boolean;
  reportId?: string;
  error?: string;
  scannedAt: Date;
  cloned?: boolean;
}
