import { type OpenAPIV3 } from 'openapi-types';

export const swaggerDocument: OpenAPIV3.Document = {
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
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string" },
          name: { type: "string" },
          role: { type: "string", enum: ["ADMIN", "OWNER", "GUEST"] },
          image: { type: "string", nullable: true },
          emailVerified: { type: "string", format: "date-time", nullable: true },
        },
      },
      Hotel: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          location: { type: "string" },
          hotelCode: { type: "string" },
          images: { type: "array", items: { type: "string" } },
          ownerId: { type: "string" },
        },
      },
      Room: {
        type: "object",
        properties: {
          id: { type: "string" },
          roomNumber: { type: "string" },
          type: { type: "string", enum: ["STANDARD", "DELUXE", "SUITE"] },
          price: { type: "number" },
          hotelId: { type: "string" },
        },
      },
      Booking: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          hotelId: { type: "string" },
          roomId: { type: "string" },
          checkIn: { type: "string", format: "date-time" },
          checkOut: { type: "string", format: "date-time" },
          status: { 
            type: "string", 
            enum: ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"] 
          },
          documents: { type: "object" },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    "/api/hotels": {
      get: {
        tags: ["Hotels"],
        summary: "Get all hotels",
        parameters: [
          {
            in: "query",
            name: "page",
            schema: { type: "integer" },
            description: "Page number",
          },
          {
            in: "query",
            name: "limit",
            schema: { type: "integer" },
            description: "Items per page",
          },
        ],
        responses: {
          "200": {
            description: "List of hotels",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    hotels: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Hotel" },
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        total: { type: "integer" },
                        pages: { type: "integer" },
                        currentPage: { type: "integer" },
                        perPage: { type: "integer" },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}; 