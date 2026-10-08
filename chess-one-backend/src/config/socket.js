let io = null;
const onlineUsers = new Map(); // userId -> active socket count

/**
 * Set the global Socket.IO instance
 */
function setIO(ioInstance) {
  io = ioInstance;
}

/**
 * Get the global Socket.IO instance
 */
function getIO() {
  return io;
}

/**
 * Track a user socket connection
 */
function trackUserConnected(userId) {
  const numericId = parseInt(userId, 10);
  if (isNaN(numericId)) return;
  const current = onlineUsers.get(numericId) || 0;
  onlineUsers.set(numericId, current + 1);
}

/**
 * Track a user socket disconnection
 */
function trackUserDisconnected(userId) {
  const numericId = parseInt(userId, 10);
  if (isNaN(numericId)) return;
  const current = onlineUsers.get(numericId) || 0;
  if (current <= 1) {
    onlineUsers.delete(numericId);
  } else {
    onlineUsers.set(numericId, current - 1);
  }
}

/**
 * Get list of currently online user IDs
 */
function getOnlineUserIds() {
  return Array.from(onlineUsers.keys());
}

/**
 * Check if a specific user is currently online
 */
function isUserOnline(userId) {
  const numericId = parseInt(userId, 10);
  return onlineUsers.has(numericId);
}

/**
 * Broadcast current online user list to all clients
 */
function broadcastOnlineUsers() {
  if (!io) return;
  io.emit("users:online-update", { onlineUserIds: getOnlineUserIds() });
}

/**
 * Broadcast an event to a game room
 * @param {string|number} gameId
 * @param {string} event
 * @param {object} payload
 */
function emitToGame(gameId, event, payload) {
  if (!io) return;
  io.to(`game:${gameId}`).emit(event, payload);
}

/**
 * Send an event to a specific user room
 * @param {string|number} userId
 * @param {string} event
 * @param {object} payload
 */
function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

module.exports = {
  setIO,
  getIO,
  trackUserConnected,
  trackUserDisconnected,
  getOnlineUserIds,
  isUserOnline,
  broadcastOnlineUsers,
  emitToGame,
  emitToUser,
};

