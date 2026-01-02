import type { Request, Response } from "express";
import { ReportService } from "../services/report.service";
import { SnykReportModel } from "../models/snyk.model";

export class ReportController {
  /**
   * POST /api/reports/webhook
   * Recibir el reporte desde Azure/Snyk
   */
  static async receiveReport(req: Request, res: Response) {
    try {
      const snykRawData = req.body;

      if (
        !snykRawData ||
        (Array.isArray(snykRawData) && snykRawData.length === 0)
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Payload vacío" });
      }

      const result = await ReportService.processSnykPayload(snykRawData);

      return res.status(201).json({
        success: true,
        message: "Reporte procesado exitosamente",
        reportId: result.id,
      });
    } catch (error) {
      console.error("Error en receiveReport:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error interno procesando reporte" });
    }
  }

  /**
   * GET /api/reports
   * Obtener todos los reportes con paginación
   */
  static async getAllReports(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

      const [reports, total] = await Promise.all([
        SnykReportModel.find()
          .sort({ scanDate: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        SnykReportModel.countDocuments(),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          reports,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      console.error("Error en getAllReports:", error);
      return res.status(500).json({
        success: false,
        message: "Error obteniendo reportes",
      });
    }
  }

  /**
   * GET /api/reports/:id
   * Obtener un reporte específico por ID
   */
  static async getReportById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const report = await SnykReportModel.findById(id).lean();

      if (!report) {
        return res.status(404).json({
          success: false,
          message: `Reporte con ID ${id} no encontrado`,
        });
      }

      return res.status(200).json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error("Error en getReportById:", error);
      return res.status(500).json({
        success: false,
        message: "Error obteniendo reporte",
      });
    }
  }

  /**
   * GET /api/reports/latest/:count
   * Obtener los últimos N reportes
   */
  static async getLatestReports(req: Request, res: Response) {
    try {
      const count = parseInt(req.params.count || "5") || 5;

      if (count > 50) {
        return res.status(400).json({
          success: false,
          message: "El máximo de reportes es 50",
        });
      }

      const reports = await SnykReportModel.find()
        .sort({ scanDate: -1 })
        .limit(count)
        .lean();

      return res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      console.error("Error en getLatestReports:", error);
      return res.status(500).json({
        success: false,
        message: "Error obteniendo reportes recientes",
      });
    }
  }

  /**
   * GET /api/reports/stats
   * Obtener estadísticas generales de reportes
   */
  static async getStats(req: Request, res: Response) {
    try {
      const [total, withVulns, clean, critical] = await Promise.all([
        SnykReportModel.countDocuments(),
        SnykReportModel.countDocuments({ isClean: false }),
        SnykReportModel.countDocuments({ isClean: true }),
        SnykReportModel.countDocuments({ "summary.critical": { $gt: 0 } }),
      ]);

      const latestReport = await SnykReportModel.findOne()
        .sort({ scanDate: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        data: {
          totalReports: total,
          reportsWithVulnerabilities: withVulns,
          cleanReports: clean,
          reportsWithCritical: critical,
          lastScan: latestReport?.scanDate || null,
        },
      });
    } catch (error) {
      console.error("Error en getStats:", error);
      return res.status(500).json({
        success: false,
        message: "Error obteniendo estadísticas",
      });
    }
  }

  /**
   * GET /api/reports/vulnerabilities/critical
   * Obtener reportes con vulnerabilidades críticas
   */
  static async getCriticalReports(req: Request, res: Response) {
    try {
      const reports = await SnykReportModel.find({
        "summary.critical": { $gt: 0 },
      })
        .sort({ scanDate: -1 })
        .lean();

      return res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (error) {
      console.error("Error en getCriticalReports:", error);
      return res.status(500).json({
        success: false,
        message: "Error obteniendo reportes críticos",
      });
    }
  }
}
