import cron, { ScheduledTask } from "node-cron";
import { SnykService } from "../services/snyk.service";

export class ScanJob {
  private static task: ScheduledTask | null = null;

  /**
   * Inicia el cron job para escaneos automáticos
   * Por defecto: Todos los días a las 2:00 AM
   * Formato cron: "minuto hora día mes día-semana"
   */
  static start(cronExpression: string = "0 2 * * *") {
    if (this.task) {
      console.log("⚠️ El cron job ya está en ejecución");
      return;
    }

    const isValidCron = cron.validate(cronExpression);
    if (!isValidCron) {
      console.error(`❌ Expresión cron inválida: ${cronExpression}`);
      return;
    }

    this.task = cron.schedule(
      cronExpression,
      async () => {
        console.log("⏰ Iniciando escaneo automático programado...");
        try {
          const results = await SnykService.scanAllRepositories();
          const successCount = results.filter((r) => r.success).length;
          console.log(
            `✅ Escaneo automático completado: ${successCount}/${results.length} exitosos`
          );
        } catch (error) {
          console.error("❌ Error en escaneo automático:", error);
        }
      },
      {
        timezone: "America/Argentina/Buenos_Aires",
      }
    );

    this.task.start();

    console.log(`🕐 Cron job iniciado con expresión: ${cronExpression}`);
    console.log(`   Próxima ejecución: ${this.getNextExecution()}`);
  }

  /**
   * Detiene el cron job
   */
  static stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log("🛑 Cron job detenido");
    }
  }

  /**
   * Obtiene la fecha de la próxima ejecución
   */
  static getNextExecution(): string | null {
    if (!this.task) return null;
    return new Date().toLocaleString("es-AR");
  }

  /**
   * Verifica si el cron job está activo
   */
  static isRunning(): boolean {
    return this.task !== null;
  }
}
