import { Router } from "express";
import vulnerabilityRoutes from "./vulnerability.routes";
import reportRoutes from "./report.routes";
import scanRoutes from "./scan.routes";

const router = Router();

router.use("/vulnerabilities", vulnerabilityRoutes);
router.use("/reports", reportRoutes);
router.use("/scans", scanRoutes);

export default router;
