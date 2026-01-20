import {
  SnykCliPayload,
  ISnykProjectResult,
  ISnykVulnerability,
} from "../types/snyk.types";

/**
 * Interfaz para el objeto que devuelve getExecutiveSummary.
 * Esto ayuda a que el servicio sepa qué propiedades esperar.
 */
export interface IExecutiveSummary {
  totalProjects: number;
  projectNames: string[];
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  isClean: boolean;
  scanDate: Date;
}

export class SnykReport {
  private projects: ISnykProjectResult[] = [];

  constructor(payload: SnykCliPayload) {
    // Normalizamos: Snyk devuelve un Objeto si es un solo proyecto, o un Array si son varios.
    // Aquí lo convertimos siempre a Array para facilitar el manejo.
    if (Array.isArray(payload)) {
      this.projects = payload;
    } else {
      this.projects = [payload];
    }
  }

  /**
   * Retorna el número total de dependencias escaneadas en todos los proyectos.
   */
  public getTotalDependencies(): number {
    return this.projects.reduce(
      (acc, proj) => acc + (proj.dependencyCount || 0),
      0
    );
  }

  /**
   * Obtiene una lista plana de TODAS las vulnerabilidades encontradas.
   */
  public getAllVulnerabilities(): ISnykVulnerability[] {
    return this.projects.flatMap((p) => p.vulnerabilities || []);
  }

  /**
   * Filtra vulnerabilidades por severidad específica.
   */
  public getIssuesBySeverity(
    severity: "critical" | "high" | "medium" | "low"
  ): ISnykVulnerability[] {
    return this.getAllVulnerabilities().filter((v) => v.severity === severity);
  }

  /**
   * Genera un resumen ejecutivo completo.
   */
  public getExecutiveSummary(): IExecutiveSummary {
    const allVulns = this.getAllVulnerabilities();

    return {
      totalProjects: this.projects.length,
      projectNames: this.projects.map((p) => p.projectName),
      totalVulnerabilities: allVulns.length,
      criticalCount: allVulns.filter((v) => v.severity === "critical").length,
      highCount: allVulns.filter((v) => v.severity === "high").length,
      mediumCount: allVulns.filter((v) => v.severity === "medium").length, // <--- Nuevo
      lowCount: allVulns.filter((v) => v.severity === "low").length, // <--- Nuevo
      isClean: allVulns.length === 0,
      scanDate: new Date(),
    };
  }
}
