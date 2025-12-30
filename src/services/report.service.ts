import { SnykReportModel } from "../models/snyk.model";
import { DiscordService } from "./discord.service";
import { SnykReport } from "../models/report.model";

export class ReportService {
  static async processSnykPayload(rawData: any) {
    const reportHelper = new SnykReport(rawData);
    const summary = reportHelper.getExecutiveSummary();
    const allVulns = reportHelper.getAllVulnerabilities();

    const savedRecord = await this.saveToDatabase(summary, rawData, allVulns);

    if (!summary.isClean) {
      await this.sendDiscordAlert(summary);
    } else {
      await DiscordService.sendNotification(
        `✅ Scan completado: Sin vulnerabilidades en **${summary.projectNames.join(", ")}**`
      );
    }

    return savedRecord;
  }

  private static async saveToDatabase(
    summary: any,
    rawData: any,
    fullVulnList: any[]
  ) {
    try {
      const newReport = new SnykReportModel({
        projectNames: summary.projectNames,
        isClean: summary.isClean,
        scanDate: summary.scanDate,
        summary: {
          total: summary.totalVulnerabilities,
          critical: summary.criticalCount,
          high: summary.highCount,
          medium: summary.mediumCount,
          low: summary.lowCount,
        },
        vulnerabilities: fullVulnList.map((v) => ({
          snykId: v.id,
          title: v.title,
          severity: v.severity,
          packageName: v.moduleName || v.packageName,
          version: v.version,
          from: v.from,
        })),
        rawData: rawData,
      });

      return await newReport.save();
    } catch (error) {
      console.error("❌ Error guardando reporte en Mongo:", error);
      throw new Error("Database save failed");
    }
  }

  private static async sendDiscordAlert(summary: any) {
    let color = 3447003; // Azul
    let icon = "🔵";
    let titlePrefix = "Vulnerabilidades Bajas";

    if (summary.criticalCount > 0) {
      color = 15548997; // Rojo
      icon = "🚨";
      titlePrefix = "CRITICAL Security Alert";
    } else if (summary.highCount > 0) {
      color = 15105570; // Naranja
      icon = "⛔";
      titlePrefix = "High Severity Alert";
    } else if (summary.mediumCount > 0) {
      color = 16776960; // Amarillo
      icon = "⚠️";
      titlePrefix = "Medium Security Warning";
    }

    const embed = {
      title: `${icon} ${titlePrefix} - Snyk`,
      description: `Se han detectado problemas de seguridad en el análisis.`,
      color: color,
      fields: [
        {
          name: "Proyectos",
          value: summary.projectNames.join(", "),
          inline: false,
        },
        {
          name: "Total Vulns",
          value: `${summary.totalVulnerabilities}`,
          inline: true,
        },
        { name: "\u200b", value: "\u200b", inline: true },
        {
          name: "🔴 Críticas",
          value: `**${summary.criticalCount}**`,
          inline: true,
        },
        { name: "🟠 Altas", value: `**${summary.highCount}**`, inline: true },
        {
          name: "🟡 Medias",
          value: `**${summary.mediumCount}**`,
          inline: true,
        },
        { name: "🔵 Bajas", value: `**${summary.lowCount}**`, inline: true },
      ],
      footer: { text: "Revisar Dashboard para detalles completos." },
      timestamp: new Date().toISOString(),
    };

    await DiscordService.sendEmbed(embed);
  }
}
