import { Router } from "express";
import { ReportController } from "../controllers/report.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Reports
 *     description: Generación y descarga de reportes
 */

/**
 * @swagger
 * /reports/generate:
 *   post:
 *     summary: Generar un nuevo reporte de seguridad
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               format:
 *                 type: string
 *                 example: pdf
 *               filterBySeverity:
 *                 type: string
 *                 example: High
 *             required:
 *               - format
 *     responses:
 *       200:
 *         description: Reporte generado con URL de descarga
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 downloadUrl:
 *                   type: string
 */
router.post("/generate", ReportController.generateReport);

export default router;
