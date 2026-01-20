import swaggerJSDoc from "swagger-jsdoc";

const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Security API Node.js",
      version: "1.0.0",
      description:
        "API para gestión de vulnerabilidades y reportes de seguridad",
      //   contact: {
      //     name: "Tu Nombre",
      //     email: "dev@security.com",
      //   },
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Servidor de Desarrollo",
      },
    ],
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
