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

  // Handle custom AppError
  if (err instanceof AppError) {
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
