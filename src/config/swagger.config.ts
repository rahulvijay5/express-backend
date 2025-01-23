import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hotel Management System API",
      version: "1.0.0",
      description: "API documentation for Hotel Management System",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT}`,
        description: "Development server",
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
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.ts"], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options); 