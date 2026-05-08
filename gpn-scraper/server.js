// scraper/server.js
// Run with: node server.js
// Requires: npm install express axios cheerio cors

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());

const GPN_BASE = "https://www.globalpickleball.network";

// GPN's internal AJAX search endpoint (used by their own website)
// Called by tournamentSearch() in their JS — returns HTML fragments we parse with cheerio.
const GPN_AJAX_URL = `${GPN_BASE}/index.php?option=com_tennissearch&Itemid=136&tab=tournaments&format=raw`;

const AXIOS_CONFIG = {
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": `${GPN_BASE}/pickleball-tournaments/tournaments`,
    "X-Requested-With": "XMLHttpRequest",
  },
  timeout: 30000,
};

// In-memory cache
let cache = { data: null, fetchedAt: null };
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ─── Scraper ──────────────────────────────────────────────────────────────────

async function fetchPage(start) {
  const url = `${GPN_AJAX_URL}&start=${start}`;
  const { data: html } = await axios.get(url, AXIOS_CONFIG);
  return html;
}

function parseRows(html) {
  const $ = cheerio.load(html);
  const tournaments = [];

  $("tr[id^='tournament-']").each((_, el) => {
    const row = $(el);
    const tournamentID = (row.attr("id") || "").replace("tournament-", "");
    const contentCell = row.find("td").eq(1);

    const name = contentCell.find("h5 a").first().text().trim() || null;
    if (!name) return;

    const description =
      contentCell.find("div.text-body-secondary").filter((_, d) => !$(d).find("a").length).first().text().trim() || null;

    const metaDivs = contentCell.find(".small.text-body-tertiary");

    const metaLines0 = metaDivs.eq(0).clone().find("i").remove().end().text()
      .split(/[\n\r]+/).map(s => s.trim()).filter(Boolean);
    const metaLines1 = metaDivs.eq(1).clone().find("i").remove().end().text()
      .split(/[\n\r]+/).map(s => s.trim()).filter(Boolean);

    const [startDate, endDate] = parseDateRange(metaLines0[0] || "");
    const city    = extractCity(metaLines0[1] || "");
    const country = extractCountry(metaLines0[1] || "");
    const [startLevel, endLevel] = parseLevelRange(metaLines1[0] || "");
    const totalPlayers = parseInt((metaLines1[1] || "0").replace(/\D/g, ""), 10) || 0;

    const relUrl = contentCell.find("h5 a").attr("href") || null;
    const url = relUrl
      ? (relUrl.startsWith("http") ? relUrl : `${GPN_BASE}${relUrl}`)
      : `${GPN_BASE}/pickleball-tournaments/tournaments`;

    const nameLower = name.toLowerCase();
    const singlesDoubles = nameLower.includes("single") ? "S" : "D";

    tournaments.push({ tournamentID, name, startDate, endDate, city, country,
      totalPlayers, startLevel, endLevel, fee: null, description, singlesDoubles, url });
  });

  const hasMore = $("ul.pagination a[href*='page=']").length > 0;
  return { tournaments, hasMore };
}

async function scrapeTournaments() {
  const all = [];
  let start = 0;
  let page = 1;

  while (true) {
    console.log(`[Scraper] Page ${page} (start=${start})...`);
    let html;
    try {
      html = await fetchPage(start);
    } catch (err) {
      console.error(`[Scraper] Page ${page} failed: ${err.message}`);
      break;
    }

    const { tournaments, hasMore } = parseRows(html);
    all.push(...tournaments);
    console.log(`[Scraper] Got ${tournaments.length} (total: ${all.length})`);

    if (!hasMore || tournaments.length === 0) break;
    start += 25;
    page++;
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`[Scraper] Done. ${all.length} total tournaments.`);
  return all;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDateRange(raw) {
  if (!raw) return [null, null];
  const parts = raw.split(/\s*-\s*|\s*–\s*|\s*→\s*/).map(s => s.trim());
  return [parts[0] || null, parts[1] || parts[0] || null];
}

function parseLevelRange(raw) {
  if (!raw || raw.toLowerCase().includes("all")) return ["All", "All"];
  const parts = raw.split(/\s+to\s+|\s*-\s*|\s*–\s*/i).map(s => s.trim());
  return [parts[0] || null, parts[1] || parts[0] || null];
}

function extractCity(str) {
  return str ? str.split(",")[0]?.trim() || null : null;
}

function extractCountry(str) {
  if (!str) return null;
  const parts = str.split(",");
  return parts[parts.length - 1]?.trim() || null;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get("/tournaments", async (req, res) => {
  try {
    const now = Date.now();
    if (cache.data && cache.fetchedAt && (now - cache.fetchedAt < CACHE_TTL_MS)) {
      console.log("[Cache] Serving cached data");
      return res.json(cache.data);
    }

    console.log("[Cache] Miss — scraping...");
    const tournaments = await scrapeTournaments();
    cache = { data: tournaments, fetchedAt: Date.now() };
    res.json(tournaments);
  } catch (err) {
    console.error("[Error]", err.message);
    if (cache.data) return res.json(cache.data);
    res.status(500).json({ error: "Failed to scrape tournaments", detail: err.message });
  }
});

app.get("/tournaments/refresh", async (req, res) => {
  try {
    cache = { data: null, fetchedAt: null };
    const tournaments = await scrapeTournaments();
    cache = { data: tournaments, fetchedAt: Date.now() };
    res.json({ message: `Refreshed. ${tournaments.length} tournaments cached.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (_, res) => res.json({
  status: "ok",
  cached: !!cache.data,
  cachedAt: cache.fetchedAt ? new Date(cache.fetchedAt).toISOString() : null,
  tournamentCount: cache.data?.length ?? 0,
}));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`GPN scraper    → http://localhost:${PORT}/tournaments`);
  console.log(`Health check   → http://localhost:${PORT}/health`);
  console.log(`Force refresh  → http://localhost:${PORT}/tournaments/refresh`);
});
