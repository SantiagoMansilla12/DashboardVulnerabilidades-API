import type { Request, Response } from "express";
import { SnykService } from "../services/snyk.service";
import { GitService } from "../services/git.service";
import { RepositoryModel } from "../models/repository.model";

export class ScanController {
  /**
   * POST /api/scans/manual
   * Ejecuta un escaneo manual de un repositorio específico
   */
  static async scanManual(req: Request, res: Response) {
    try {
      const { repositoryName } = req.body;

      if (!repositoryName) {
        return res.status(400).json({
          success: false,
          message: "El campo 'repositoryName' es requerido",
        });
      }

      const repository = await RepositoryModel.findOne({
        name: repositoryName,
      });

      if (!repository) {
        return res.status(404).json({
          success: false,
          message: `Repositorio '${repositoryName}' no encontrado en la configuración`,
        });
      }

      if (!repository.enabled) {
        return res.status(400).json({
          success: false,
          message: `Repositorio '${repositoryName}' está deshabilitado`,
        });
      }

      if (!repository.cloned) {
        return res.status(400).json({
          success: false,
          message: `Repositorio '${repositoryName}' no está clonado. Intente eliminarlo y agregarlo nuevamente.`,
        });
      }

      const result = await SnykService.scanRepository(
        repository.name,
        repository.branch
      );

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: "Escaneo completado exitosamente",
          data: result,
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "Error durante el escaneo",
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Error en scanManual:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * POST /api/scans/all
   * Ejecuta escaneo de todos los repositorios habilitados
   */
  static async scanAll(req: Request, res: Response) {
    try {
      const results = await SnykService.scanAllRepositories();

      const successCount = results.filter((r) => r.success).length;

      return res.status(200).json({
        success: true,
        message: `Escaneos completados: ${successCount}/${results.length} exitosos`,
        data: results,
      });
    } catch (error) {
      console.error("Error en scanAll:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * GET /api/scans/repositories
   * Lista todos los repositorios configurados
   */
  static async listRepositories(req: Request, res: Response) {
    try {
      const repositories = await RepositoryModel.find().sort({ name: 1 });

      return res.status(200).json({
        success: true,
        data: repositories,
      });
    } catch (error) {
      console.error("Error en listRepositories:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * POST /api/scans/repositories
   * Agrega un nuevo repositorio: lo clona y ejecuta el primer escaneo
   */
  static async addRepository(req: Request, res: Response) {
    try {
      const { name, url, branch, enabled } = req.body;

      if (!name || !url) {
        return res.status(400).json({
          success: false,
          message: "Los campos 'name' y 'url' son requeridos",
        });
      }

      const existingRepo = await RepositoryModel.findOne({ name });
      if (existingRepo) {
        return res.status(409).json({
          success: false,
          message: `El repositorio '${name}' ya existe`,
        });
      }

      const repoBranch = branch || "main";

      console.log(`📦 Agregando nuevo repositorio: ${name}`);

      const repoPath = await GitService.cloneRepository(url, name, repoBranch);

      const newRepository = new RepositoryModel({
        name,
        url,
        branch: repoBranch,
        enabled: enabled !== undefined ? enabled : true,
        cloned: true,
      });

      await newRepository.save();

      console.log(`✅ Repositorio ${name} agregado exitosamente`);
      console.log(`🔍 Iniciando escaneo inicial en segundo plano...`);

      // Ejecutar escaneo inicial de forma asíncrona (sin await)
      // El usuario recibirá la respuesta inmediatamente
      // La notificación de Discord llegará cuando termine el escaneo
      SnykService.scanRepository(name, repoBranch)
        .then((scanResult) => {
          console.log(`✅ Escaneo inicial completado para: ${name}`);
        })
        .catch((scanError) => {
          console.error(`❌ Error en escaneo inicial de ${name}:`, scanError);
        });

      return res.status(201).json({
        success: true,
        message: "Repositorio agregado exitosamente. El escaneo inicial se está ejecutando en segundo plano.",
        data: {
          repository: newRepository,
          path: repoPath,
          scanStatus: "El escaneo inicial está en progreso. Recibirás una notificación en Discord cuando termine.",
        },
      });
    } catch (error) {
      console.error("Error en addRepository:", error);
      
      const { name: repoName } = req.body;
      if (repoName) {
        try {
          await GitService.deleteRepository(repoName);
        } catch (cleanupError) {
          console.error("Error limpiando repositorio:", cleanupError);
        }
      }

      return res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      });
    }
  }

  /**
   * PUT /api/scans/repositories/:name
   * Actualiza la configuración de un repositorio
   */
  static async updateRepository(req: Request, res: Response) {
    try {
      const { name } = req.params;
      
      if (!name) {
        return res.status(400).json({
          success: false,
          message: "El parámetro 'name' es requerido",
        });
      }

      const updates = req.body;

      const repository = await RepositoryModel.findOneAndUpdate(
        { name },
        updates,
        { new: true, runValidators: true }
      );

      if (!repository) {
        return res.status(404).json({
          success: false,
          message: `Repositorio '${name}' no encontrado`,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Repositorio actualizado exitosamente",
        data: repository,
      });
    } catch (error) {
      console.error("Error en updateRepository:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }

  /**
   * DELETE /api/scans/repositories/:name
   * Elimina un repositorio de la configuración y del sistema de archivos
   */
  static async deleteRepository(req: Request, res: Response) {
    try {
      const { name } = req.params;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "El parámetro 'name' es requerido",
        });
      }

      const repository = await RepositoryModel.findOneAndDelete({
        name,
      });

      if (!repository) {
        return res.status(404).json({
          success: false,
          message: `Repositorio '${name}' no encontrado`,
        });
      }

      await GitService.deleteRepository(name);

      return res.status(200).json({
        success: true,
        message: "Repositorio eliminado exitosamente de la base de datos y del sistema de archivos",
      });
    } catch (error) {
      console.error("Error en deleteRepository:", error);
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor",
      });
    }
  }
}
