import type { Request, Response } from "express";
import { ReportService } from "../services/report.service";

export class ReportController {
  // POST: Recibir el reporte desde Azure/Snyk
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

      // Delegamos la lógica al servicio
      const result = await ReportService.processSnykPayload(snykRawData);

      return res.status(201).json({
        success: true,
        message: "Reporte procesado exitosamente",
        reportId: result.id, // ID del reporte guardado en BD
      });
    } catch (error) {
      console.error("Error en receiveReport:", error);
      return res
        .status(500)
        .json({ success: false, message: "Error interno procesando reporte" });
    }
  }
}
