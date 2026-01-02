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

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: Obtener todos los reportes con paginación
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Reportes por página
 *     responses:
 *       200:
 *         description: Lista de reportes con paginación
 */
router.get("/", ReportController.getAllReports);

/**
 * @swagger
 * /reports/stats:
 *   get:
 *     summary: Obtener estadísticas generales de reportes
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Estadísticas de reportes
 */
router.get("/stats", ReportController.getStats);

/**
 * @swagger
 * /reports/vulnerabilities/critical:
 *   get:
 *     summary: Obtener reportes con vulnerabilidades críticas
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Lista de reportes con vulnerabilidades críticas
 */
router.get("/vulnerabilities/critical", ReportController.getCriticalReports);

/**
 * @swagger
 * /reports/latest/{count}:
 *   get:
 *     summary: Obtener los últimos N reportes
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: count
 *         required: true
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Cantidad de reportes a obtener (máximo 50)
 *     responses:
 *       200:
 *         description: Lista de reportes recientes
 */
router.get("/latest/:count", ReportController.getLatestReports);

/**
 * @swagger
 * /reports/{id}:
 *   get:
 *     summary: Obtener un reporte específico por ID
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del reporte
 *     responses:
 *       200:
 *         description: Reporte encontrado
 *       404:
 *         description: Reporte no encontrado
 */
router.get("/:id", ReportController.getReportById);

export default router;
