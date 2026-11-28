const { ZodError } = require("zod");

/**
 * Custom application error
 */
class AppError extends Error {
  constructor(code, message, statusCode = 400, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Centralized error-handling middleware
 */
function errorHandler(err, req, res, next) {
  // Handle Zod validation errors
  if (err instanceof ZodError || err.name === "ZodError") {
    const issues = err.issues || err.errors || [];
    const formattedErrors = issues.map((e) => ({
      field: Array.isArray(e.path) ? e.path.join(".") : "",
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request payload",
        details: formattedErrors,
      },
    });
  }

  // Handle custom AppError or errors with code and statusCode
  if (err instanceof AppError || (err.code && err.statusCode && typeof err.statusCode === "number")) {
    const response = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    };

    if (err.details) {
      response.error.details = err.details;
    }

    return res.status(err.statusCode).json(response);
  }

  // Prisma unique constraint violation
  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      error: {
        code: "RESOURCE_CONFLICT",
        message: "A resource with these unique values already exists",
      },
    });
  }

  const isMissingDatabaseTenant =
    err.message?.includes("tenant/user") ||
    err.meta?.driverAdapterError?.message?.includes("tenant/user");

  // Database connection / pooler / paused errors
  if (
    err.name === "PrismaClientInitializationError" ||
    err.code === "ECONNREFUSED" ||
    err.code === "XX000" ||
    isMissingDatabaseTenant ||
    err.message?.includes("Can't reach database server")
  ) {
    console.error("Database Connection Failure:", err.message);
    return res.status(503).json({
      success: false,
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: isMissingDatabaseTenant
          ? "Supabase rejected the configured database tenant/user. Verify DATABASE_URL matches this project's connection string and that the project is active."
          : "Database connection unavailable. If using Supabase, please ensure your project is restored and active in the Supabase Dashboard.",
      },
    });
  }

  // General unhandled error
  console.error("Unhandled Error:", err);

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: err.message || "An unexpected error occurred",
    },
  });
}

module.exports = {
  AppError,
  errorHandler,
};
