import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import routes from "./routes";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { dbConnection } from "./config/database";
import { ScanJob } from "./jobs/scan.job";
import { SnykService } from "./services/snyk.service";
import { GitService } from "./services/git.service";

// Cargar variables de entorno del .env
dotenv.config();

// Asegurar que SNYK_TOKEN esté disponible para procesos hijos
// dotenv solo carga en process.env, pero los procesos hijos necesitan
// que esté en las variables de entorno del sistema
if (process.env.SNYK_TOKEN && !process.env.SNYK_TOKEN_LOADED) {
  // Marcar como cargado para evitar bucles
  process.env.SNYK_TOKEN_LOADED = "true";
  console.log("✅ SNYK_TOKEN cargado desde .env");
}

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use("/api", routes);

app.get("/health", (req, res) => {
  res.send("API Security is running OK");
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

async function main() {
  // Validar configuración crítica
  if (!process.env.SNYK_TOKEN) {
    console.error("❌ ERROR: SNYK_TOKEN no está configurado en el archivo .env");
    console.error("   Por favor, agrega SNYK_TOKEN=tu_token en el archivo .env");
    process.exit(1);
  }

  await dbConnection();

  await GitService.initializeReposDirectory();

  const snykAvailable = await SnykService.checkSnykCli();
  if (!snykAvailable) {
    console.warn(
      "⚠️ Snyk CLI no detectado. Los escaneos automáticos no funcionarán."
    );
  }

  const cronExpression = process.env.CRON_SCHEDULE || "0 2 * * *";
  const enableCron = process.env.ENABLE_CRON !== "false";

  if (enableCron && snykAvailable) {
    ScanJob.start(cronExpression);
  } else if (!enableCron) {
    console.log("ℹ️ Escaneos automáticos deshabilitados (ENABLE_CRON=false)");
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📚 Documentación: http://localhost:${PORT}/api-docs`);
  });
}

main();
