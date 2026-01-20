import mongoose from "mongoose";

export const dbConnection = async (): Promise<void> => {
  try {
    const dbURL = process.env.MONGO_URI;

    if (!dbURL) {
      throw new Error("❌ La variable de entorno MONGO_URI no está definida.");
    }

    mongoose.set("strictQuery", false);

    await mongoose.connect(dbURL);

    console.log("🍃 Base de Datos Online (MongoDB)");
  } catch (error) {
    console.error("❌ Error al conectar con la Base de Datos:");
    console.error(error);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB desconectado");
});
