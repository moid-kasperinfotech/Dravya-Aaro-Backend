import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Application } from "express";

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Darvya Aaro API",
            version: "1.0.0",
            description: "Auto-generated OpenAPI spec for Darvya Aaro backend",
            contact: {
                name: "Darvya Aaro Team",
            },
        },
        servers: [
            {
                url: "/api/v1",
                description: "API base path",
            },
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "token",
                    description: "Authentication token in cookie (token or techToken or adminToken)",
                },
            },
        },
    },
    apis: ["./src/routes/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Application) {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

export default swaggerSpec;
