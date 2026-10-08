const prisma = require("../config/database");
const { OPENROUTER_API_KEY, OPENROUTER_MODEL } = require("../config/env");

class AiReviewService {
  /**
   * Analyze all moves from a completed or active chess game
   * Uses Gemini via OpenRouter
   */
  async analyzeGame(gameId) {
    const id = parseInt(gameId, 10);
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        whitePlayer: { select: { id: true, name: true, email: true } },
        blackPlayer: { select: { id: true, name: true, email: true } },
        moves: { orderBy: { id: "asc" } },
      },
    });

    if (!game) {
      throw new Error(`Game #${gameId} not found`);
    }

    const whiteName = game.whitePlayer?.name || "White (Player)";
    const blackName =
      game.blackPlayer?.name ||
      (game.gameType === "PLAYER_VS_AI"
        ? `Stockfish AI (${game.aiDifficulty || "Standard"})`
        : "Black (Player)");

    // Group moves into standard notation
    const movesList = game.moves || [];
    let moveNotation = "";
    for (let i = 0; i < movesList.length; i++) {
      const m = movesList[i];
      if (m.color === "WHITE") {
        moveNotation += `${m.moveNumber}. ${m.san} `;
      } else {
        if (!moveNotation.endsWith(" ")) moveNotation += " ";
        moveNotation += `${m.san} `;
      }
    }
    moveNotation = moveNotation.trim();

    if (!moveNotation) {
      return {
        summary: "No moves were played in this match.",
        verdict: "Game Concluded Early",
        coachRating: "N/A",
        accuracyWhite: 100,
        accuracyBlack: 100,
        bestMoves: [],
        worstMoves: [],
        turningPoint: "The match concluded before moves were recorded.",
        keyTakeaway: "Play at least a few opening moves to receive an in-depth AI review!",
      };
    }

    const prompt = `You are a Grandmaster Chess Coach analyzing a live match between two players.
Match Details:
- White: ${whiteName}
- Black: ${blackName}
- Time Control: ${game.timeControl}
- Game Outcome: ${game.result || "Ongoing"} (Status: ${game.status})
- Game Moves (Sequential):
${moveNotation}

PGN Context (if available):
${game.pgn || moveNotation}

Your goal:
Provide an inspiring, highly educational, user-friendly game review. Explain chess concepts simply without jargon so beginners and intermediate players immediately understand what happened.
Identify:
1. Overall summary & verdict of how the game played out.
2. Estimated tactical accuracy (0-100%) for White and Black.
3. 1 to 3 BEST moves played in the game, highlighting who played it, the move notation, why it was strategically/tactically brilliant.
4. 1 to 3 WORST moves (blunders or missed tactics), explaining why it was a mistake and what a better move would have been.
5. The turning point of the game.
6. A golden rule / key takeaway for the player to improve in their next game.

You MUST respond strictly in valid JSON format matching this exact schema:
{
  "summary": "Detailed, friendly 2-3 sentence overview of the match dynamics.",
  "verdict": "Catchy 2-4 word title (e.g. 'Sharp Tactical Battle' or 'Opening Oversight')",
  "coachRating": "Beginner | Intermediate | Advanced | Master",
  "accuracyWhite": 82,
  "accuracyBlack": 88,
  "bestMoves": [
    {
      "moveNumber": 1,
      "player": "White",
      "san": "e4",
      "title": "Central Claim",
      "explanation": "Solid foundation fighting for center squares and opening bishop lines."
    }
  ],
  "worstMoves": [
    {
      "moveNumber": 3,
      "player": "White",
      "san": "Qd2",
      "title": "Early Queen Exposure",
      "explanation": "Brought the queen out too early before developing minor pieces.",
      "betterMove": "Nf3"
    }
  ],
  "turningPoint": "Clear description of the move or moment that changed the game balance.",
  "keyTakeaway": "One actionable, inspiring chess advice for the player's next game."
}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:8081",
        "X-Title": "ChessOne AI Review",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an expert Chess Coach and Grandmaster. Respond strictly in valid JSON format without markdown code fences.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[AiReviewService] OpenRouter API error:", response.status, errText);
      throw new Error(`OpenRouter review failed: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response content from OpenRouter Gemini");
    }

    // Clean any accidental markdown backticks from JSON
    const cleanedJson = content.replace(/```json/gi, "").replace(/```/g, "").trim();

    try {
      const parsedReview = JSON.parse(cleanedJson);
      return parsedReview;
    } catch (parseErr) {
      console.warn("[AiReviewService] JSON parsing failed, using fallback parsing:", content);
      return {
        summary: content.slice(0, 300),
        verdict: "Match Analysis",
        coachRating: "Intermediate",
        accuracyWhite: 75,
        accuracyBlack: 75,
        bestMoves: [],
        worstMoves: [],
        turningPoint: "Tactical exchanges throughout the middle game.",
        keyTakeaway: "Review piece safety before every move.",
      };
    }
  }
}

module.exports = new AiReviewService();
