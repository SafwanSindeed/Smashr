// services/duprService.js
//
// ─── HOW TO ACTIVATE DUPR SUBMISSION ────────────────────────────────────────
//
//  1. Register Smashr as an official club at https://mydupr.com
//  2. Request API access — email api@mydupr.com with your club name "Smashr"
//  3. Once approved, fill in the three values below:
//
//       DUPR_ENABLED  → change false to true
//       DUPR_API_KEY  → paste the key DUPR emails you
//       DUPR_CLUB_ID  → paste your Smashr club ID from the DUPR dashboard
//
//  4. Run flushPendingMatches() once to retroactively submit every queued match.
//
// Until then, every match is safely stored in Firestore under
// `pending_dupr_matches` and nothing is lost.
// ─────────────────────────────────────────────────────────────────────────────

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

const DUPR_ENABLED = false;                           // ← flip to true when ready
const DUPR_API_BASE = "https://api.mydupr.com/api/v1.0";
const DUPR_API_KEY = "";                              // ← your DUPR API key
const DUPR_CLUB_ID = "";                              // ← your Smashr club ID

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Submit a completed match result.
 *
 * matchData shape:
 * {
 *   gameType:  "singles" | "doubles" | "friendly",
 *   courtName: string,
 *   playedAt:  ISO string,
 *   team1: [{ uid, displayName, duprId }],   // your side
 *   team2: [{ uid, displayName, duprId }],   // opponent(s)
 *   scores: [{ team1: number, team2: number }],  // one object per game
 *   winner: "team1" | "team2" | null,
 * }
 *
 * Returns: { queued: true, docId } when DUPR is not yet configured
 *          { success: true, duprMatchId } when submitted live
 */
export async function submitMatch(matchData) {
  // Always persist locally first — nothing is ever lost
  const docRef = await addDoc(collection(db, "pending_dupr_matches"), {
    ...matchData,
    duprSubmitted: false,
    duprSubmittedAt: null,
    createdAt: serverTimestamp(),
  });

  if (!DUPR_ENABLED || !DUPR_API_KEY || !DUPR_CLUB_ID) {
    console.log("[DUPR] Not configured — match queued in Firestore:", docRef.id);
    return { queued: true, docId: docRef.id };
  }

  return _submitToDUPR(docRef.id, matchData);
}

/**
 * Retry all unsubmitted matches.
 * Call this once after you paste in your API credentials and flip DUPR_ENABLED.
 */
export async function flushPendingMatches() {
  if (!DUPR_ENABLED || !DUPR_API_KEY || !DUPR_CLUB_ID) {
    console.warn("[DUPR] Cannot flush — credentials not configured.");
    return [];
  }

  const snap = await getDocs(
    query(
      collection(db, "pending_dupr_matches"),
      where("duprSubmitted", "==", false)
    )
  );

  const results = [];
  for (const d of snap.docs) {
    const result = await _submitToDUPR(d.id, d.data());
    results.push({ docId: d.id, ...result });
  }
  console.log(`[DUPR] Flushed ${results.length} pending match(es).`);
  return results;
}

// ── Internal ──────────────────────────────────────────────────────────────────

async function _submitToDUPR(firestoreDocId, matchData) {
  try {
    const payload = _buildPayload(matchData);

    const res = await fetch(`${DUPR_API_BASE}/match`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DUPR_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const duprMatchId = data.matchId ?? data.id ?? null;

    await updateDoc(doc(db, "pending_dupr_matches", firestoreDocId), {
      duprSubmitted: true,
      duprSubmittedAt: serverTimestamp(),
      duprMatchId,
    });

    console.log("[DUPR] Submitted successfully. Match ID:", duprMatchId);
    return { success: true, duprMatchId };
  } catch (err) {
    console.error("[DUPR] Submission failed:", err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Builds the DUPR API request body.
 * Adjust the shape here once you receive DUPR's official API schema.
 */
function _buildPayload(matchData) {
  return {
    clubId: DUPR_CLUB_ID,
    matches: [
      {
        eventDate: matchData.playedAt,
        format: matchData.gameType === "doubles" ? "DOUBLES" : "SINGLES",
        teams: [
          {
            players: matchData.team1.map((p) => ({
              duprId: p.duprId || null,
              displayName: p.displayName,
            })),
            scores: matchData.scores.map((s) => s.team1),
          },
          {
            players: matchData.team2.map((p) => ({
              duprId: p.duprId || null,
              displayName: p.displayName,
            })),
            scores: matchData.scores.map((s) => s.team2),
          },
        ],
      },
    ],
  };
}
