const express = require("express");
const cors = require("cors");
const gameRoutes = require("./routes/game.routes");
const invitationRoutes = require("./routes/invitation.routes");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const { errorHandler } = require("./middleware/error.middleware");

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());

// Health check endpoint (Section 37)
app.get("/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "ChessOne backend is running",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/invitations", invitationRoutes);
app.use("/api/users", userRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
