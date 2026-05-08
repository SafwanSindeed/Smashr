// scraper/debug.js
// Run with: node debug.js
// Dumps the raw HTML from GPN to debug.html so you can inspect
// which CSS selectors to use in server.js

const axios = require("axios");
const fs = require("fs");

const URL = "https://www.globalpickleball.network/pickleball-tournaments/tournaments";

(async () => {
  try {
    const { data } = await axios.get(URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
      timeout: 15000,
    });
    fs.writeFileSync("debug.html", data, "utf8");
    console.log("✅ Saved to debug.html — open it in your browser or editor");
    console.log("   Look for the class names on tournament cards and update");
    console.log("   the SELECTORS section in server.js accordingly.");
  } catch (err) {
    console.error("❌ Fetch failed:", err.message);
  }
})();
