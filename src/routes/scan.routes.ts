import { Router } from "express";
import { ScanController } from "../controllers/scan.controller";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Scans
 *     description: Gestión de escaneos de seguridad con Snyk
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Repository:
 *       type: object
 *       required:
 *         - name
 *         - path
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre único del repositorio
 *           example: backend-api
 *         url:
 *           type: string
 *           description: URL del repositorio Git
 *           example: https://github.com/usuario/backend-api.git
 *         branch:
 *           type: string
 *           description: Rama a escanear
 *           example: main
 *         enabled:
 *           type: boolean
 *           description: Si el repositorio está habilitado para escaneos automáticos
 *           example: true
 *         lastScan:
 *           type: string
 *           format: date-time
 *           description: Fecha del último escaneo
 *     ScanResult:
 *       type: object
 *       properties:
 *         repository:
 *           type: string
 *         success:
 *           type: boolean
 *         reportId:
 *           type: string
 *         error:
 *           type: string
 *         scannedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /scans/manual:
 *   post:
 *     summary: Ejecuta un escaneo manual de un repositorio específico
 *     tags: [Scans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - repositoryName
 *             properties:
 *               repositoryName:
 *                 type: string
 *                 example: backend-api
 *     responses:
 *       200:
 *         description: Escaneo completado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ScanResult'
 *       404:
 *         description: Repositorio no encontrado
 *       500:
 *         description: Error durante el escaneo
 */
router.post("/manual", ScanController.scanManual);

/**
 * @swagger
 * /scans/all:
 *   post:
 *     summary: Ejecuta escaneo de todos los repositorios habilitados
 *     tags: [Scans]
 *     responses:
 *       200:
 *         description: Escaneos completados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ScanResult'
 */
router.post("/all", ScanController.scanAll);

/**
 * @swagger
 * /scans/repositories:
 *   get:
 *     summary: Lista todos los repositorios configurados
 *     tags: [Scans]
 *     responses:
 *       200:
 *         description: Lista de repositorios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Repository'
 */
router.get("/repositories", ScanController.listRepositories);

/**
 * @swagger
 * /scans/repositories:
 *   post:
 *     summary: Agrega un nuevo repositorio a la configuración
 *     tags: [Scans]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Repository'
 *     responses:
 *       201:
 *         description: Repositorio agregado exitosamente
 *       409:
 *         description: El repositorio ya existe
 */
router.post("/repositories", ScanController.addRepository);

/**
 * @swagger
 * /scans/repositories/{name}:
 *   put:
 *     summary: Actualiza la configuración de un repositorio
 *     tags: [Scans]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del repositorio
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Repository'
 *     responses:
 *       200:
 *         description: Repositorio actualizado exitosamente
 *       404:
 *         description: Repositorio no encontrado
 */
router.put("/repositories/:name", ScanController.updateRepository);

/**
 * @swagger
 * /scans/repositories/{name}:
 *   delete:
 *     summary: Elimina un repositorio de la configuración
 *     tags: [Scans]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre del repositorio
 *     responses:
 *       200:
 *         description: Repositorio eliminado exitosamente
 *       404:
 *         description: Repositorio no encontrado
 */
router.delete("/repositories/:name", ScanController.deleteRepository);

export default router;
