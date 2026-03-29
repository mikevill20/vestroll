import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vestroll API Documentation",
      version: "1.0.0",
      description: "API documentation for the Vestroll project",
    },
    servers: [
      {
        url: "/api/v1/v1",
        description: "Standard API v1 base",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },

  apis: ["./src/app/api/v1/**/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(options);

