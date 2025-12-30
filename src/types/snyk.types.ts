import { Document } from "mongoose";

// --- 1. Enums y Tipos Básicos ---

export type SnykSeverity = "low" | "medium" | "high" | "critical";

// --- 2. Interfaces de Datos ---

/**
 * Representa una vulnerabilidad individual detallada.
 */
export interface ISnykVulnerability {
  id: string;
  title: string;
  severity: SnykSeverity;
  cvssScore?: number;
  moduleName?: string;
  packageName?: string;
  version: string;
  from: string[];
  publicationTime?: string;
  semver?: {
    vulnerable: string[];
  };
}

/**
 * Representa el resultado de un solo proyecto escaneado.
 */
export interface ISnykProjectResult {
  ok: boolean;
  vulnerabilities: ISnykVulnerability[];
  dependencyCount: number;
  uniqueCount?: number;
  projectName: string;
  policy?: string;
  org?: string;
  path?: string;
}

/**
 * Resumen de contadores.
 */
export interface ISnykSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

/**
 * El Payload puede ser un objeto o un Array.
 */
export type SnykCliPayload = ISnykProjectResult | ISnykProjectResult[];

// --- 3. Interfaz del Documento de Mongoose ---

/**
 * Extiende de Document para tener acceso a .save(), ._id, createdAt, etc.
 */
export interface ISnykReportDocument extends Document {
  projectNames: string[];
  scanDate: Date;
  isClean: boolean;
  summary: ISnykSummary;
  vulnerabilities: ISnykVulnerability[];
  rawData: any;
  createdAt: Date;
  updatedAt: Date;
}
