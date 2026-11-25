/**
 * In-Memory User Store for ChessOne
 * Transient in-memory store for active user profiles (e.g. for socket operations).
 * Real persistence is strictly managed by Prisma / PostgreSQL.
 */

class UserStore {
  constructor() {
    this.users = new Map();
    this.emailToId = new Map();
  }

  getUser(id) {
    if (!id) return null;
    const numId = parseInt(id, 10);
    return this.users.get(numId) || null;
  }

  getUserByEmail(email) {
    if (!email) return null;
    const id = this.emailToId.get(email.toLowerCase());
    return id ? this.users.get(id) : null;
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  upsertUser(data) {
    if (!data || !data.id) return null;
    const numId = parseInt(data.id, 10);
    const existing = this.users.get(numId);

    const updated = {
      ...existing,
      ...data,
      id: numId,
    };

    this.users.set(numId, updated);
    if (updated.email) {
      this.emailToId.set(updated.email.toLowerCase(), numId);
    }
    return updated;
  }

  updateUser(id, data) {
    if (!id) return null;
    const numId = parseInt(id, 10);
    const existing = this.users.get(numId);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...data,
      id: numId,
    };
    this.users.set(numId, updated);
    return updated;
  }

  clear() {
    this.users.clear();
    this.emailToId.clear();
  }
}

const userStore = new UserStore();
module.exports = userStore;
