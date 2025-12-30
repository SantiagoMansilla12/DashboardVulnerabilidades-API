import axios from "axios";
import { DiscordEmbed } from "../models/discord.model";

// --- Servicio Principal ---
export class DiscordService {
  // Asegúrate de tener esta variable en tu archivo .env
  private static get webhookUrl(): string {
    return process.env.DISCORD_WEBHOOK_URL || "";
  }

  static async sendNotification(content: string): Promise<void> {
    const url = this.webhookUrl;
    if (!url) {
      console.warn(
        "⚠️ FALTA CONFIGURACION: DISCORD_WEBHOOK_URL está vacío o indefinido."
      );
      return;
    }
    try {
      await axios.post(this.webhookUrl, {
        username: "Snyk Security Bot", // Nombre que aparecerá en Discord
        avatar_url:
          "https://res.cloudinary.com/snyk/image/upload/v1537345894/press-kit/brand/snyk-dog.png", // Logo de Snyk (opcional)
        content: content,
      });
      console.log("✅ Notificación simple enviada a Discord");
    } catch (error) {
      console.error("❌ Error enviando notificación a Discord:", error);
    }
  }

  static async sendEmbed(embed: DiscordEmbed): Promise<void> {
    if (!this.validateConfig()) return;

    try {
      const payload = {
        username: "Snyk Security Bot",
        avatar_url:
          "https://res.cloudinary.com/snyk/image/upload/v1537345894/press-kit/brand/snyk-dog.png",
        embeds: [embed], // Discord acepta un array de embeds
      };

      await axios.post(this.webhookUrl, payload);
      console.log("✅ Reporte Embed enviado a Discord");
    } catch (error) {
      console.error("❌ Error enviando Embed a Discord:", error);
    }
  }

  /**
   * Valida que la URL del webhook exista.
   */
  private static validateConfig(): boolean {
    if (!this.webhookUrl) {
      console.warn(
        "⚠️ DISCORD_WEBHOOK_URL no está definido en las variables de entorno. Se omitió el envío."
      );
      return false;
    }
    return true;
  }
}
