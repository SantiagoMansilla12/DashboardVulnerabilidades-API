import mongoose, { Schema, Model, Document } from "mongoose";

export interface IRepositoryDocument extends Document {
  name: string;
  url: string;
  branch: string;
  enabled: boolean;
  cloned: boolean;
  lastScan?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RepositorySchema = new Schema<IRepositoryDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    branch: {
      type: String,
      default: "main",
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    cloned: {
      type: Boolean,
      default: false,
    },
    lastScan: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

RepositorySchema.index({ enabled: 1, lastScan: 1 });

export const RepositoryModel: Model<IRepositoryDocument> =
  mongoose.model<IRepositoryDocument>("Repository", RepositorySchema);
