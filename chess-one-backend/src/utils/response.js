/**
 * Standard API response helpers
 */

function success(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    ...data,
  });
}

function error(res, code, message, statusCode = 400, details = null) {
  const payload = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (details) {
    payload.error.details = details;
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  success,
  error,
};
