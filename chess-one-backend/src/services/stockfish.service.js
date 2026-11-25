const readline = require("readline");
const { spawn } = require("child_process");
const { findEngine } = require("stockfish");
const { Chess } = require("chess.js");

/**
 * Difficulty tuning configuration for Stockfish 19
 * EASY:   ~800 Elo (Skill Level 1, depth 5, movetime 150ms)
 * MEDIUM: ~1400 Elo (UCI_LimitStrength = true, UCI_Elo = 1400, Skill Level 8, movetime 400ms)
 * HARD:   ~2000+ Elo (UCI_LimitStrength = true, UCI_Elo = 2100, Skill Level 20, movetime 900ms)
 */
const DIFFICULTY_CONFIG = {
  EASY: {
    skillLevel: 0,
    limitStrength: true,
    targetElo: 1320,
    depth: 3,
    movetime: 120,
    minNaturalDelayMs: 250,
  },
  MEDIUM: {
    skillLevel: 10,
    limitStrength: true,
    targetElo: 1550,
    depth: 7,
    movetime: 400,
    minNaturalDelayMs: 450,
  },
  HARD: {
    skillLevel: 20,
    limitStrength: true,
    targetElo: 2200,
    depth: null,
    movetime: 900,
    minNaturalDelayMs: 900,
  },
};

/**
 * Single Stockfish WASM process wrapper
 */
class StockfishEngine {
  constructor(id, enginePath) {
    this.id = id;
    this.enginePath = enginePath;
    this.child = null;
    this.rl = null;
    this.isReady = false;
    this.isBusy = false;
    this.uciEloMin = 1320;
    this.uciEloMax = 3190;
    this.currentJob = null;
    this.readyCallbacks = [];
  }

  async start() {
    return new Promise((resolve, reject) => {
      try {
        this._cleanup();
        this.isReady = false;
        this.isBusy = false;

        this.child = spawn(process.execPath, [this.enginePath], {
          stdio: ["pipe", "pipe", "pipe"],
        });

        this.rl = readline.createInterface({ input: this.child.stdout });

        const onInitLine = (line) => {
          if (line.includes("UCI_Elo")) {
            const m = line.match(/min\s+(\d+)\s+max\s+(\d+)/);
            if (m) {
              this.uciEloMin = parseInt(m[1], 10);
              this.uciEloMax = parseInt(m[2], 10);
            }
          }
          if (line === "uciok") {
            this.sendCommand("isready");
          } else if (line === "readyok") {
            this.isReady = true;
            this.rl.removeListener("line", onInitLine);
            this.rl.on("line", (l) => this._onOutputLine(l));
            resolve();
          }
        };

        this.rl.on("line", onInitLine);

        this.child.on("error", (err) => {
          console.error(`[StockfishEngine ${this.id}] Process error:`, err);
          this._handleProcessFailure(err);
        });

        this.child.on("exit", (code, signal) => {
          console.warn(`[StockfishEngine ${this.id}] Process exited with code ${code}, signal ${signal}`);
          this._handleProcessFailure(new Error(`Engine process exited (${code})`));
        });

        this.sendCommand("uci");
      } catch (err) {
        console.error(`[StockfishEngine ${this.id}] Failed to start process:`, err);
        reject(err);
      }
    });
  }

  sendCommand(cmd) {
    if (this.child && this.child.stdin && !this.child.stdin.destroyed) {
      this.child.stdin.write(`${cmd}\n`);
    }
  }

  _onOutputLine(line) {
    if (!this.currentJob) return;

    if (this.currentJob.waitingForReadyOk) {
      if (line === "readyok") {
        this.currentJob.waitingForReadyOk = false;
        if (typeof this.currentJob.onReadyOk === "function") {
          this.currentJob.onReadyOk();
        }
      }
      return;
    }

    if (line.startsWith("bestmove")) {
      const parts = line.split(/\s+/);
      const moveStr = parts[1];
      const job = this.currentJob;
      this.currentJob = null;
      this.isBusy = false;

      if (job) {
        if (job.timeoutId) clearTimeout(job.timeoutId);
        job.resolve(moveStr);
      }
    }
  }

  _handleProcessFailure(err) {
    this.isReady = false;
    this.isBusy = false;
    if (this.currentJob) {
      const job = this.currentJob;
      this.currentJob = null;
      if (job.timeoutId) clearTimeout(job.timeoutId);
      job.resolve(null);
    }
    this._cleanup();
    // Automatically restart in background
    setTimeout(() => {
      this.start().catch((e) => console.error(`[StockfishEngine ${this.id}] Auto-restart failed:`, e));
    }, 500);
  }

  _cleanup() {
    if (this.rl) {
      try {
        this.rl.close();
      } catch {}
      this.rl = null;
    }
    if (this.child) {
      try {
        this.child.kill();
      } catch {}
      this.child = null;
    }
  }

  async computeBestMove({ fen, difficulty = "MEDIUM", timeControl, remainingTimeMs }) {
    if (!this.isReady || !this.child) {
      await this.start();
    }

    const normDiff = (difficulty || "MEDIUM").toUpperCase();
    const config = DIFFICULTY_CONFIG[normDiff] || DIFFICULTY_CONFIG.MEDIUM;

    // Bullet / low time override
    const isBulletOrLowTime = Boolean(
      (timeControl && (timeControl.startsWith("1+") || timeControl.startsWith("2+"))) ||
      (remainingTimeMs !== undefined && remainingTimeMs !== null && remainingTimeMs < 15000)
    );

    let effectiveMovetime = config.movetime;
    let minNaturalDelay = config.minNaturalDelayMs;

    if (isBulletOrLowTime) {
      effectiveMovetime = normDiff === "EASY" ? 60 : normDiff === "MEDIUM" ? 180 : 350;
      minNaturalDelay = 60;
    }

    const startTime = Date.now();
    this.isBusy = true;

    return new Promise((resolve) => {
      const hardTimeoutMs = (effectiveMovetime || 1000) + 3000;

      const timeoutId = setTimeout(() => {
        console.warn(`[StockfishEngine ${this.id}] Search timed out after ${hardTimeoutMs}ms. Restarting engine...`);
        this._handleProcessFailure(new Error("Engine search timed out"));
        resolve(null);
      }, hardTimeoutMs);

      this.currentJob = {
        timeoutId,
        waitingForReadyOk: true,
        onReadyOk: () => {
          // Set options
          this.sendCommand("ucinewgame");
          this.sendCommand(`setoption name Skill Level value ${config.skillLevel}`);
          if (config.limitStrength) {
            const clampedElo = Math.max(this.uciEloMin, Math.min(this.uciEloMax, config.targetElo));
            this.sendCommand("setoption name UCI_LimitStrength value true");
            this.sendCommand(`setoption name UCI_Elo value ${clampedElo}`);
          } else {
            this.sendCommand("setoption name UCI_LimitStrength value false");
          }
          this.sendCommand("setoption name Move Overhead value 10");

          // Set position & execute search
          this.sendCommand(`position fen ${fen}`);

          if (config.depth) {
            const maxDepth = isBulletOrLowTime ? Math.max(2, config.depth - 1) : config.depth;
            this.sendCommand(`go depth ${maxDepth} movetime ${effectiveMovetime}`);
          } else {
            this.sendCommand(`go movetime ${effectiveMovetime}`);
          }
        },
        resolve: async (rawMove) => {
          if (!rawMove || rawMove === "(none)") {
            resolve(null);
            return;
          }

          const from = rawMove.slice(0, 2);
          const to = rawMove.slice(2, 4);
          const promotion = rawMove.length > 4 ? rawMove[4].toLowerCase() : undefined;

          // Validate legality and compute SAN with chess.js
          try {
            const chess = new Chess(fen);
            const moveRes = chess.move({ from, to, promotion });
            if (!moveRes) {
              console.warn(`[StockfishEngine ${this.id}] Stockfish suggested illegal move: ${rawMove} for fen ${fen}`);
              resolve(null);
              return;
            }

            // Natural delay so moves don't feel instant (<50ms), keeping total response under 2s
            const elapsed = Date.now() - startTime;
            const remainingDelay = Math.max(0, Math.min(1800 - elapsed, minNaturalDelay - elapsed));
            if (remainingDelay > 0) {
              await new Promise((r) => setTimeout(r, remainingDelay));
            }

            resolve({
              from: moveRes.from,
              to: moveRes.to,
              promotion: moveRes.promotion || promotion,
              san: moveRes.san,
            });
          } catch (err) {
            console.error(`[StockfishEngine ${this.id}] Error verifying move with chess.js:`, err);
            resolve(null);
          }
        },
      };

      // Reset state and sync engine
      this.sendCommand("ucinewgame");
      this.sendCommand("isready");
    });
  }

  terminate() {
    this._cleanup();
  }
}

/**
 * StockfishService with Engine Pool and Request Queue
 */
class StockfishService {
  constructor(poolSize = 2) {
    this.poolSize = poolSize;
    this.enginePath = findEngine("lite-single");
    this.engines = [];
    this.queue = [];
    this.isInitialized = false;
    this.initPromise = null;
  }

  async initialize() {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      console.log(`[StockfishService] Initializing engine pool (size: ${this.poolSize})...`);
      for (let i = 0; i < this.poolSize; i++) {
        const engine = new StockfishEngine(i + 1, this.enginePath);
        await engine.start();
        this.engines.push(engine);
      }
      this.isInitialized = true;
      console.log(`[StockfishService] Engine pool ready. UCI_Elo range: [${this.engines[0]?.uciEloMin}, ${this.engines[0]?.uciEloMax}]`);
    })();

    return this.initPromise;
  }

  async getBestMove({ fen, difficulty = "MEDIUM", timeControl, remainingTimeMs }) {
    await this.initialize();

    return new Promise((resolve, reject) => {
      this.queue.push({
        params: { fen, difficulty, timeControl, remainingTimeMs },
        resolve,
        reject,
      });
      this._dispatch();
    });
  }

  _dispatch() {
    if (this.queue.length === 0) return;

    // Find an idle engine
    const availableEngine = this.engines.find((e) => e.isReady && !e.isBusy);
    if (!availableEngine) return;

    const nextJob = this.queue.shift();
    if (!nextJob) return;

    availableEngine
      .computeBestMove(nextJob.params)
      .then((res) => {
        nextJob.resolve(res);
      })
      .catch((err) => {
        console.error("[StockfishService] Error in job execution:", err);
        nextJob.resolve(null);
      })
      .finally(() => {
        // Dispatch next queued item
        this._dispatch();
      });
  }

  getDifficultyConfig() {
    return DIFFICULTY_CONFIG;
  }

  terminate() {
    for (const engine of this.engines) {
      engine.terminate();
    }
    this.engines = [];
    this.isInitialized = false;
    this.initPromise = null;
  }
}

const stockfishService = new StockfishService(2);
module.exports = stockfishService;
