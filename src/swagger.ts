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
            schemas: {
                // Common Response Schemas
                SuccessResponse: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            example: "Operation completed successfully",
                        },
                        data: {
                            type: "object",
                        },
                    },
                },
                SuccessListResponse: {
                    type: "object",
                    properties: {
                        message: {
                            type: "string",
                            example: "Data retrieved successfully",
                        },
                        data: {
                            type: "array",
                            items: { type: "object" },
                        },
                        count: {
                            type: "number",
                        },
                    },
                },
                ErrorResponse: {
                    type: "object",
                    properties: {
                        error: {
                            type: "string",
                            example: "Error message",
                        },
                        statusCode: {
                            type: "number",
                            example: 400,
                        },
                        details: {
                            type: "object",
                        },
                    },
                },
                UnauthorizedError: {
                    type: "object",
                    properties: {
                        error: {
                            type: "string",
                            example: "Unauthorized access",
                        },
                        statusCode: {
                            type: "number",
                            example: 401,
                        },
                    },
                },
                ForbiddenError: {
                    type: "object",
                    properties: {
                        error: {
                            type: "string",
                            example: "Forbidden - insufficient permissions",
                        },
                        statusCode: {
                            type: "number",
                            example: 403,
                        },
                    },
                },
                NotFoundError: {
                    type: "object",
                    properties: {
                        error: {
                            type: "string",
                            example: "Resource not found",
                        },
                        statusCode: {
                            type: "number",
                            example: 404,
                        },
                    },
                },
                ValidationError: {
                    type: "object",
                    properties: {
                        error: {
                            type: "string",
                            example: "Validation failed",
                        },
                        statusCode: {
                            type: "number",
                            example: 400,
                        },
                        details: {
                            type: "object",
                            example: {
                                field: "Field is required",
                            },
                        },
                    },
                },
                // Pagination Parameters (reusable)
                PaginationParams: {
                    type: "object",
                    properties: {
                        page: {
                            type: "number",
                            description: "Page number (1-indexed)",
                            example: 1,
                        },
                        limit: {
                            type: "number",
                            description: "Items per page",
                            example: 10,
                        },
                        offset: {
                            type: "number",
                            description: "Number of items to skip",
                            example: 0,
                        },
                    },
                },
                // User Model
                User: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        phoneNumber: { type: "string", example: "9876543210" },
                        email: { type: "string", example: "user@example.com" },
                        name: { type: "string", example: "John Doe" },
                        gender: { type: "string", enum: ["male", "female", "other"] },
                        address: { type: "string" },
                        pincode: { type: "string" },
                        city: { type: "string" },
                        state: { type: "string" },
                        country: { type: "string" },
                        profileImage: { type: "string" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                // Admin Model
                Admin: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        phoneNumber: { type: "string" },
                        email: { type: "string" },
                        name: { type: "string" },
                        role: { type: "string", enum: ["superadmin", "admin"] },
                        permissions: { type: "array", items: { type: "string" } },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                // Technician Model
                Technician: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        phoneNumber: { type: "string" },
                        name: { type: "string" },
                        email: { type: "string" },
                        skills: { type: "array", items: { type: "string" } },
                        rating: { type: "number", example: 4.5 },
                        totalJobs: { type: "number" },
                        completedJobs: { type: "number" },
                        isActive: { type: "boolean" },
                        status: { type: "string", enum: ["available", "busy", "offline"] },
                        location: {
                            type: "object",
                            properties: {
                                type: { type: "string", enum: ["Point"] },
                                coordinates: { type: "array", items: { type: "number" } },
                            },
                        },
                        documents: {
                            type: "object",
                            properties: {
                                aadhar: { type: "string" },
                                pan: { type: "string" },
                                license: { type: "string" },
                                verification: { type: "boolean" },
                            },
                        },
                        bankDetails: {
                            type: "object",
                            properties: {
                                accountNumber: { type: "string" },
                                bankName: { type: "string" },
                                ifsc: { type: "string" },
                            },
                        },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                // Service Model
                Service: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        name: { type: "string", example: "AC Repair" },
                        category: { type: "string", example: "Electronics" },
                        price: { type: "number", example: 500 },
                        description: { type: "string" },
                        image: { type: "string", format: "uri" },
                        duration: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    unit: { type: "string", enum: ["hour", "day"] },
                                    value: { type: "number" },
                                },
                            },
                        },
                        process: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    duration: { type: "number" },
                                },
                            },
                        },
                        includes: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: { type: "string" },
                                    quantity: { type: "number" },
                                },
                            },
                        },
                        faq: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    question: { type: "string" },
                                    answer: { type: "string" },
                                },
                            },
                        },
                        status: { type: "string", enum: ["active", "inactive"] },
                        isPopular: { type: "boolean" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                // Job Model
                Job: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        userId: { type: "string" },
                        serviceId: { type: "string" },
                        technicianId: { type: "string" },
                        status: {
                            type: "string",
                            enum: [
                                "pending",
                                "accepted",
                                "reached",
                                "in_progress",
                                "completed",
                                "cancelled",
                                "failed",
                            ],
                        },
                        bookingDate: { type: "string", format: "date-time" },
                        scheduledDate: { type: "string", format: "date-time" },
                        completedDate: { type: "string", format: "date-time" },
                        price: { type: "number" },
                        paymentStatus: { type: "string", enum: ["pending", "completed", "refunded"] },
                        paymentMethod: { type: "string", enum: ["cash", "online"] },
                        location: {
                            type: "object",
                            properties: {
                                address: { type: "string" },
                                city: { type: "string" },
                                pincode: { type: "string" },
                                coordinates: { type: "array", items: { type: "number" } },
                            },
                        },
                        notes: { type: "string" },
                        rating: { type: "number" },
                        review: { type: "string" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                // Product Model
                Product: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        name: { type: "string" },
                        description: { type: "string" },
                        price: { type: "number" },
                        category: { type: "string" },
                        stock: { type: "number" },
                        image: { type: "string", format: "uri" },
                        rating: { type: "number" },
                        totalSales: { type: "number" },
                        status: { type: "string", enum: ["available", "low_stock", "out_of_stock"] },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                // Order Model
                Order: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        userId: { type: "string" },
                        items: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    productId: { type: "string" },
                                    quantity: { type: "number" },
                                    price: { type: "number" },
                                },
                            },
                        },
                        totalAmount: { type: "number" },
                        status: {
                            type: "string",
                            enum: ["pending", "processing", "shipped", "delivered", "cancelled", "returned"],
                        },
                        paymentStatus: { type: "string", enum: ["pending", "completed", "refunded"] },
                        address: { type: "string" },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                // Vendor Model
                Vendor: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        name: { type: "string" },
                        email: { type: "string" },
                        phoneNumber: { type: "string" },
                        company: { type: "string" },
                        address: { type: "string" },
                        city: { type: "string" },
                        state: { type: "string" },
                        pincode: { type: "string" },
                        bankName: { type: "string" },
                        accountNumber: { type: "string" },
                        ifsc: { type: "string" },
                        categories: { type: "array", items: { type: "string" } },
                        status: { type: "string", enum: ["active", "inactive", "blocked"] },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                // AMC Plan Model
                AmcPlan: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        name: { type: "string", example: "Gold AMC" },
                        description: { type: "string" },
                        price: { type: "number", example: 5000 },
                        duration: { type: "number", description: "Duration in months", example: 12 },
                        coverage: { type: "array", items: { type: "string" } },
                        benefits: { type: "array", items: { type: "string" } },
                        status: { type: "string", enum: ["active", "inactive"] },
                        createdAt: { type: "string", format: "date-time" },
                        updatedAt: { type: "string", format: "date-time" },
                    },
                },
                // Login Response
                LoginResponse: {
                    type: "object",
                    properties: {
                        message: { type: "string", example: "Login successful" },
                        data: {
                            type: "object",
                            properties: {
                                _id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string" },
                                role: { type: "string" },
                                phoneNumber: { type: "string" },
                                token: { type: "string" },
                            },
                        },
                    },
                },
                // Dashboard Stats
                DashboardStats: {
                    type: "object",
                    properties: {
                        totalJobs: { type: "number" },
                        completedJobs: { type: "number" },
                        pendingJobs: { type: "number" },
                        totalRevenue: { type: "number" },
                        todayRevenue: { type: "number" },
                        activeTechnicians: { type: "number" },
                        avgRating: { type: "number" },
                    },
                },
            },
        },
    },
    apis: ["./src/routes/**/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Application) {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    try {
        console.log("swagger spec generated successfully");

        // @ts-ignore
        console.log("total api's counted in swagger spec:", Object.keys(swaggerSpec?.paths).length);
    } catch (error) {
        console.error("error while generating swagger spec", error);
    }
}

export default swaggerSpec;
