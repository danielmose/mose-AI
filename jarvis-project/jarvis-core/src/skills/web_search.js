const cheerio = require("cheerio");

// Uses DuckDuckGo's HTML endpoint (no API key required) and parses the
// top results. Good enough for quick factual lookups; swap in a paid
// search API here later if you want richer results.
module.exports = {
  name: "web_search",
  description: "Search the web for current information.",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "The search query." },
    },
    required: ["query"],
  },
  client: false,
  async run({ query }) {
    const res = await fetch("https://html.duckduckgo.com/html/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `q=${encodeURIComponent(query)}`,
    });
    const html = await res.text();
    const $ = cheerio.load(html);

    const results = [];
    $(".result").each((i, el) => {
      if (i >= 5) return;
      const title = $(el).find(".result__title").text().trim();
      const snippet = $(el).find(".result__snippet").text().trim();
      const link = $(el).find(".result__url").text().trim();
      if (title) results.push({ title, snippet, link });
    });

    return { results };
  },
};
