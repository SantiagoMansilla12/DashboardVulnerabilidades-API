import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";
import { ReportService } from "./report.service";
import { RepositoryModel } from "../models/repository.model";
import { GitService } from "./git.service";
import { IScanResult } from "../types/repository.types";

const execAsync = promisify(exec);

export class SnykService {
  /**
   * Detecta el tipo de proyecto y restaura dependencias
   */
  private static async restoreDependencies(
    repositoryPath: string,
    repositoryName: string
  ): Promise<void> {
    try {
      console.log(`📦 Detectando tipo de proyecto: ${repositoryName}`);

      const hasPackageJson = fs.existsSync(
        path.join(repositoryPath, "package.json")
      );
      const hasSolutionFile = fs
        .readdirSync(repositoryPath)
        .some((file) => file.endsWith(".sln"));
      const hasCsprojFile = fs
        .readdirSync(repositoryPath)
        .some((file) => file.endsWith(".csproj"));

      if (hasPackageJson) {
        console.log(`📦 Proyecto Node.js detectado, ejecutando npm install...`);
        await execAsync("npm install --legacy-peer-deps", {
          cwd: repositoryPath,
          maxBuffer: 10 * 1024 * 1024,
        });
        console.log(`✅ Dependencias Node.js instaladas`);
      }

      if (hasSolutionFile || hasCsprojFile) {
        console.log(`📦 Proyecto .NET detectado, ejecutando dotnet restore...`);
        await execAsync("dotnet restore", {
          cwd: repositoryPath,
          maxBuffer: 10 * 1024 * 1024,
        });
        console.log(`✅ Dependencias .NET restauradas`);
      }

      if (!hasPackageJson && !hasSolutionFile && !hasCsprojFile) {
        console.log(
          `ℹ️ No se detectó tipo de proyecto conocido (Node.js/.NET), continuando sin restaurar dependencias`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.warn(
        `⚠️ Error restaurando dependencias de ${repositoryName}: ${errorMessage}`
      );
      console.warn(`   Continuando con el escaneo...`);
    }
  }

  /**
   * Ejecuta un escaneo de Snyk en un repositorio específico
   */
  static async scanRepository(
    repositoryName: string,
    branch: string = "main"
  ): Promise<IScanResult> {
    const result: IScanResult = {
      repository: repositoryName,
      success: false,
      scannedAt: new Date(),
    };

    try {
      console.log(`🔍 Iniciando escaneo de: ${repositoryName}`);

      const repositoryPath = GitService.getRepositoryPath(repositoryName);
      console.log(`📂 Ruta: ${repositoryPath}`);

      if (!GitService.isRepositoryCloned(repositoryName)) {
        throw new Error(
          `El repositorio ${repositoryName} no está clonado. Debe agregarse primero mediante POST /api/scans/repositories`
        );
      }

      await GitService.updateRepository(repositoryName, branch);

      await this.restoreDependencies(repositoryPath, repositoryName);

      const snykToken = process.env.SNYK_TOKEN;
      if (!snykToken) {
        throw new Error("SNYK_TOKEN no está configurado en las variables de entorno");
      }

      console.log(`🔑 SNYK_TOKEN disponible: ${snykToken.substring(0, 8)}...`);

      const snykCommand = `snyk test --json --all-projects`;

      let stdout = "";
      let stderr = "";

      // Crear objeto de entorno explícito para asegurar que SNYK_TOKEN se pase
      const envVars: Record<string, string> = {
        SNYK_TOKEN: snykToken,
        PATH: process.env.PATH || "",
        HOME: process.env.HOME || process.env.USERPROFILE || "",
        APPDATA: process.env.APPDATA || "",
        LOCALAPPDATA: process.env.LOCALAPPDATA || "",
      };

      try {
        const execResult = await execAsync(snykCommand, {
          cwd: repositoryPath,
          maxBuffer: 10 * 1024 * 1024,
          env: envVars,
        });
        stdout = execResult.stdout;
        stderr = execResult.stderr;
      } catch (error: any) {
        // Snyk retorna exit code 1 cuando encuentra vulnerabilidades
        // Esto NO es un error, es el comportamiento esperado
        if (error.stdout) {
          stdout = error.stdout;
          stderr = error.stderr || "";
          console.log(
            `ℹ️ Snyk encontró vulnerabilidades en ${repositoryName} (exit code 1 es normal)`
          );
        } else {
          // Error real de ejecución
          throw new Error(`Error ejecutando Snyk: ${error.message}`);
        }
      }

      console.log(`✅ Escaneo completado para: ${repositoryName}`);

      let snykData;
      try {
        snykData = JSON.parse(stdout);
      } catch (parseError) {
        throw new Error(`Error parseando resultado de Snyk: ${parseError}`);
      }

      // Validar que Snyk esté autenticado correctamente
      if (snykData.ok === false && snykData.error) {
        throw new Error(`Error de Snyk: ${snykData.error}`);
      }

      const savedReport = await ReportService.processSnykPayload(
        snykData,
        repositoryName
      );

      await RepositoryModel.findOneAndUpdate(
        { name: repositoryName },
        { lastScan: new Date() },
        { upsert: false }
      );

      result.success = true;
      result.reportId = savedReport.id;

      console.log(
        `✅ Escaneo completado exitosamente: ${repositoryName} (Report ID: ${savedReport.id})`
      );

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.error(`❌ Error escaneando ${repositoryName}:`, errorMessage);

      result.error = errorMessage;
      return result;
    }
  }

  /**
   * Escanea todos los repositorios habilitados en la base de datos
   */
  static async scanAllRepositories(): Promise<IScanResult[]> {
    try {
      const repositories = await RepositoryModel.find({ enabled: true });

      if (repositories.length === 0) {
        console.log("⚠️ No hay repositorios habilitados para escanear");
        return [];
      }

      console.log(
        `🚀 Iniciando escaneo de ${repositories.length} repositorio(s)`
      );

      const scanPromises = repositories.map((repo) =>
        this.scanRepository(repo.name, repo.branch)
      );

      const results = await Promise.allSettled(scanPromises);

      const scanResults: IScanResult[] = results.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          return {
            repository: repositories[index]?.name || "Unknown",
            success: false,
            error: result.reason?.message || "Error desconocido",
            scannedAt: new Date(),
          };
        }
      });

      const successCount = scanResults.filter((r) => r.success).length;
      console.log(
        `📊 Escaneos completados: ${successCount}/${repositories.length} exitosos`
      );

      return scanResults;
    } catch (error) {
      console.error("❌ Error en scanAllRepositories:", error);
      throw error;
    }
  }

  /**
   * Verifica que Snyk CLI esté instalado y configurado
   */
  static async checkSnykCli(): Promise<boolean> {
    try {
      const { stdout } = await execAsync("snyk --version");
      console.log(`✅ Snyk CLI detectado: ${stdout.trim()}`);
      return true;
    } catch (error) {
      console.error(
        "❌ Snyk CLI no está instalado o no está en el PATH del sistema"
      );
      return false;
    }
  }
}
