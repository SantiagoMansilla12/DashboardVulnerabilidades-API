import mongoose, { Schema, Model } from "mongoose";
import { ISnykReportDocument } from "../types/snyk.types"; // Importamos los tipos de arriba

// 1. Sub-esquema para las vulnerabilidades (para estructura interna)
// No definimos _id: false para que sea más ligero, ya que no consultaremos vulnerabilidades por ID de mongo individualmente
const VulnerabilitySchema = new Schema(
  {
    snykId: { type: String, required: true },
    title: { type: String, required: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      required: true,
    },
    packageName: { type: String, required: true },
    version: { type: String, required: true },
    fixedIn: [{ type: String }],
    from: [{ type: String }],
  },
  { _id: false }
);

// 2. Esquema Principal del Reporte
const SnykReportSchema = new Schema<ISnykReportDocument>(
  {
    projectNames: {
      type: [String],
      required: true,
      index: true, // Indexado: Permite buscar rápido: "Dame reportes del proyecto 'backend'"
    },
    scanDate: {
      type: Date,
      default: Date.now,
      index: true, // Indexado: Permite buscar rápido por fecha
    },
    isClean: {
      type: Boolean,
      required: true,
    },
    // Resumen de contadores (Actualizado con Medium/Low)
    summary: {
      total: { type: Number, default: 0 },
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
    },
    // Array con el detalle completo
    vulnerabilities: [VulnerabilitySchema],

    // Payload crudo: Usamos Mixed porque Snyk cambia su JSON ocasionalmente
    rawData: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true, // Crea automáticamente createdAt y updatedAt
    versionKey: false, // Elimina el campo __v
  }
);

// --- Métodos Estáticos (Opcionales pero útiles) ---

// Ejemplo: SnykReportModel.findCriticals()
SnykReportSchema.statics.findCriticals = function () {
  return this.find({ "summary.critical": { $gt: 0 } }).sort({ createdAt: -1 });
};

// 3. Exportar el Modelo
export const SnykReportModel: Model<ISnykReportDocument> =
  mongoose.model<ISnykReportDocument>("SnykReport", SnykReportSchema);
