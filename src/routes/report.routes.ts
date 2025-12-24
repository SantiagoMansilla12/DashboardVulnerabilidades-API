import { Router } from "express";
import { ReportController } from "../controllers/report.controller";

const router = Router();

router.post("/generate", ReportController.generateReport);

export default router;
