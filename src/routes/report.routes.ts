import { Router } from "express";
import { ReportController } from "../controllers/report.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Reports
 *     description: Gestión e ingesta de reportes de seguridad
 */

/**
 * @swagger
 * /reports/webhook:
 *   post:
 *     summary: Recibe el reporte JSON crudo desde el pipeline CI/CD (Snyk)
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: El JSON crudo de Snyk (puede ser un Objeto o un Array)
 *     responses:
 *       201:
 *         description: Reporte procesado, guardado y notificado correctamente.
 *       500:
 *         description: Error procesando el reporte.
 */
router.post("/webhook", ReportController.receiveReport);

export default router;
