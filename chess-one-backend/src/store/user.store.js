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

    let name = data.name;
    // Don't overwrite an existing real name with a placeholder like "Player 50"
    if ((!name || name.startsWith("Player ") || name.startsWith("Player #")) && existing?.name && !existing.name.startsWith("Player")) {
      name = existing.name;
    }
    // If name is still placeholder but email is available, extract a friendly name
    const email = data.email || existing?.email;
    if ((!name || name.startsWith("Player ") || name.startsWith("Player #")) && email && email.includes("@") && !email.includes("local")) {
      const prefix = email.split("@")[0].replace(/[._-]/g, " ");
      name = prefix.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }

    const updated = {
      ...existing,
      ...data,
      id: numId,
      name: name || `Player ${numId}`,
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
