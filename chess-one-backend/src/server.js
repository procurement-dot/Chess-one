const http = require("http");
const app = require("./app");
const config = require("./config/env");
const { initializeSocket } = require("./socket");

const server = http.createServer(app);
const io = initializeSocket(server);

// Only listen if executed directly (e.g., node src/server.js)
if (require.main === module) {
  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${config.PORT} is already in use. Stop the existing server or set PORT to a free port.`
      );
      process.exitCode = 1;
      return;
    }

    throw err;
  });

  server.listen(config.PORT, () => {
    console.log(`🚀 ChessOne Live Match Server listening on port ${config.PORT}`);
    console.log(`   Health: http://localhost:${config.PORT}/health`);
    console.log(`   Environment: ${config.NODE_ENV}`);
  });
}

module.exports = {
  server,
  app,
  io,
};
