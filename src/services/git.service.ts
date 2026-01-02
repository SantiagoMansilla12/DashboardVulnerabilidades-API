import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "fs";

const execAsync = promisify(exec);

export class GitService {
  private static readonly REPOS_BASE_DIR = path.join(
    process.cwd(),
    "repositories"
  );

  /**
   * Inicializa el directorio base para repositorios
   */
  static async initializeReposDirectory(): Promise<void> {
    try {
      if (!fs.existsSync(this.REPOS_BASE_DIR)) {
        fs.mkdirSync(this.REPOS_BASE_DIR, { recursive: true });
        console.log(`📁 Directorio de repositorios creado: ${this.REPOS_BASE_DIR}`);
      }
    } catch (error) {
      console.error("❌ Error creando directorio de repositorios:", error);
      throw error;
    }
  }

  /**
   * Obtiene el path local donde se clonará/está clonado un repositorio
   */
  static getRepositoryPath(repositoryName: string): string {
    return path.join(this.REPOS_BASE_DIR, repositoryName);
  }

  /**
   * Verifica si un repositorio ya está clonado
   */
  static isRepositoryCloned(repositoryName: string): boolean {
    const repoPath = this.getRepositoryPath(repositoryName);
    const gitPath = path.join(repoPath, ".git");
    return fs.existsSync(gitPath);
  }

  /**
   * Clona un repositorio desde una URL
   */
  static async cloneRepository(
    url: string,
    repositoryName: string,
    branch: string = "main"
  ): Promise<string> {
    try {
      await this.initializeReposDirectory();

      const repoPath = this.getRepositoryPath(repositoryName);

      if (this.isRepositoryCloned(repositoryName)) {
        console.log(`ℹ️ Repositorio ${repositoryName} ya existe, actualizando...`);
        await this.updateRepository(repositoryName, branch);
        return repoPath;
      }

      console.log(`📥 Clonando repositorio: ${repositoryName}`);
      console.log(`   URL: ${url}`);
      console.log(`   Branch: ${branch}`);
      console.log(`   Destino: ${repoPath}`);

      const cloneCommand = `git clone --branch ${branch} ${url} "${repoPath}"`;
      await execAsync(cloneCommand, {
        maxBuffer: 50 * 1024 * 1024,
      });

      console.log(`✅ Repositorio ${repositoryName} clonado exitosamente`);
      return repoPath;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.error(`❌ Error clonando ${repositoryName}:`, errorMessage);
      throw new Error(`No se pudo clonar el repositorio: ${errorMessage}`);
    }
  }

  /**
   * Actualiza un repositorio existente con git pull
   */
  static async updateRepository(
    repositoryName: string,
    branch: string = "main"
  ): Promise<void> {
    try {
      const repoPath = this.getRepositoryPath(repositoryName);

      if (!this.isRepositoryCloned(repositoryName)) {
        throw new Error(
          `El repositorio ${repositoryName} no está clonado localmente`
        );
      }

      console.log(`🔄 Actualizando repositorio: ${repositoryName} (branch: ${branch})`);

      await execAsync("git fetch origin", { cwd: repoPath });

      await execAsync(`git checkout ${branch}`, { cwd: repoPath });

      const { stdout } = await execAsync("git pull", { cwd: repoPath });

      if (stdout.includes("Already up to date")) {
        console.log(`✅ ${repositoryName} ya está actualizado`);
      } else {
        console.log(`✅ ${repositoryName} actualizado exitosamente`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.warn(`⚠️ No se pudo actualizar ${repositoryName}: ${errorMessage}`);
      console.warn(`   Continuando con la versión actual...`);
    }
  }

  /**
   * Elimina un repositorio clonado del sistema de archivos
   */
  static async deleteRepository(repositoryName: string): Promise<void> {
    try {
      const repoPath = this.getRepositoryPath(repositoryName);

      if (!fs.existsSync(repoPath)) {
        console.log(`ℹ️ El repositorio ${repositoryName} no existe en el sistema de archivos`);
        return;
      }

      console.log(`🗑️ Eliminando repositorio: ${repositoryName}`);

      fs.rmSync(repoPath, { recursive: true, force: true });

      console.log(`✅ Repositorio ${repositoryName} eliminado del sistema de archivos`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      console.error(`❌ Error eliminando ${repositoryName}:`, errorMessage);
      throw new Error(`No se pudo eliminar el repositorio: ${errorMessage}`);
    }
  }

  /**
   * Obtiene información del repositorio (último commit, branch actual, etc.)
   */
  static async getRepositoryInfo(repositoryName: string): Promise<{
    currentBranch: string;
    lastCommit: string;
    lastCommitDate: string;
  }> {
    try {
      const repoPath = this.getRepositoryPath(repositoryName);

      if (!this.isRepositoryCloned(repositoryName)) {
        throw new Error(`El repositorio ${repositoryName} no está clonado`);
      }

      const { stdout: branch } = await execAsync("git rev-parse --abbrev-ref HEAD", {
        cwd: repoPath,
      });

      const { stdout: commit } = await execAsync("git rev-parse HEAD", {
        cwd: repoPath,
      });

      const { stdout: commitDate } = await execAsync(
        'git log -1 --format=%cd --date=iso',
        { cwd: repoPath }
      );

      return {
        currentBranch: branch.trim(),
        lastCommit: commit.trim(),
        lastCommitDate: commitDate.trim(),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      throw new Error(
        `No se pudo obtener información del repositorio: ${errorMessage}`
      );
    }
  }
}
