import { Router } from "express";
import vulnerabilityRoutes from "./vulnerability.routes";
import reportRoutes from "./report.routes";

const router = Router();

router.use("/vulnerabilities", vulnerabilityRoutes);
router.use("/reports", reportRoutes);

export default router;
