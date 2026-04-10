document.addEventListener("DOMContentLoaded", () => {
  const FETCH_TIMEOUT_MS = 9000;
  const QUOTE_TIMEOUT_MS = 4500;
  const FUNDAMENTAL_REFRESH_MS = 15 * 60 * 1000;
  const CHART_REFRESH_MS = 10 * 1000;
  const MARKET_TIMEZONE = "America/New_York";
  const MIRROR_PREFIX = "https://r.jina.ai/http://";
  const STOCK_ANALYSIS_BASE = "https://stockanalysis.com";
  const WIKIPEDIA_API_BASE = "https://en.wikipedia.org/w/api.php";
  const WIKIPEDIA_SUMMARY_BASE = "https://en.wikipedia.org/api/rest_v1/page/summary";
  const WIKIDATA_API_BASE = "https://www.wikidata.org/w/api.php";
  const CHART_CACHE_PREFIX = "stocks.custom-chart";
  const SUPPLEMENTAL_CACHE_PREFIX = "stocks.supplemental.v2";
  const CHART_CACHE_TTL_MS = 20 * 1000;
  const LONG_RANGE_CHART_CACHE_TTL_MS = 5 * 60 * 1000;
  const SUPPLEMENTAL_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
  const CHART_CONFIG = {
    "30m": { interval: "1m", range: "1d", label: "30M", lookbackMs: 30 * 60 * 1000 },
    "1h": { interval: "1m", range: "1d", label: "1H", lookbackMs: 60 * 60 * 1000 },
    "3h": { interval: "1m", range: "1d", label: "3H", lookbackMs: 3 * 60 * 60 * 1000 },
    "6h": { interval: "1m", range: "1d", label: "6H", lookbackMs: 6 * 60 * 60 * 1000 },
    "1d": { interval: "1m", range: "1d", label: "1D" },
    "5d": { interval: "5m", range: "5d", label: "5D" },
    "1mo": { interval: "30m", range: "1mo", label: "1M" },
    "6mo": { interval: "1d", range: "6mo", label: "6M" },
    ytd: { interval: "1d", range: "ytd", label: "YTD" },
    "1y": { interval: "1d", range: "1y", label: "1Y" },
    "5y": { interval: "1wk", range: "5y", label: "5Y" }
  };
  const YAHOO_SYMBOL_OVERRIDES = {
    "NASDAQ:ALM": "ALM",
    "NASDAQ:AAPL": "AAPL",
    "NASDAQ:MSFT": "MSFT",
    "NASDAQ:NVDA": "NVDA",
    "NASDAQ:TSLA": "TSLA",
    "AMEX:SPY": "SPY",
    "BITSTAMP:BTCUSD": "BTC-USD",
    "TVC:GOLD": "GC=F",
    "FOREXCOM:NSXUSD": "^IXIC",
    "FOREXCOM:SPXUSD": "^GSPC",
    "FOREXCOM:DJI": "^DJI"
  };
  const COMPANY_PROFILE_FALLBACKS = {
    "AMEX:SPY": {
      summary:
        "SPDR S&P 500 ETF Trust is an exchange-traded fund designed to track the performance of the S&P 500 Index, giving investors broad exposure to large-cap U.S. equities.",
      website: "ssga.com"
    }
  };

  const currentSymbolNode = document.querySelector("[data-current-symbol]");
  const currentNameNode = document.querySelector("[data-current-name]");
  const lastPriceNode = document.querySelector("[data-last-price]");
  const securityEarningsNode = document.querySelector("[data-security-earnings]");
  const secondaryTitleNode = document.querySelector("[data-secondary-title]");
  const secondaryNoteNode = document.querySelector("[data-secondary-note]");
  const selectedLabelNode = document.querySelector("[data-selected-label]");
  const financialLabelNode = document.querySelector("[data-financial-label]");
  const tickerRefreshTimerNode = document.querySelector("[data-ticker-refresh-timer]");
  const secondaryPanels = Array.from(document.querySelectorAll("[data-secondary-panel]"));
  const secondaryViewButtons = Array.from(document.querySelectorAll("[data-secondary-view]"));
  const rangeButtons = Array.from(document.querySelectorAll("[data-range]"));
  const chartSlot = document.querySelector('[data-widget-slot="advanced-chart"]');
  const companySummaryNodes = {
    summary: document.querySelector("[data-company-summary]"),
    website: document.querySelector("[data-company-website]")
  };
  const financialNodes = {
    marketCap: document.querySelector("[data-financial-market-cap]"),
    trailingPe: document.querySelector("[data-financial-trailing-pe]"),
    forwardPe: document.querySelector("[data-financial-forward-pe]"),
    priceBook: document.querySelector("[data-financial-price-book]"),
    eps: document.querySelector("[data-financial-eps]"),
    revenueGrowth: document.querySelector("[data-financial-revenue-growth]"),
    profitMargin: document.querySelector("[data-financial-profit-margin]"),
    debtEquity: document.querySelector("[data-financial-debt-equity]")
  };

  let currentSymbol = readCurrentSymbol();
  let currentSecondaryView = "summary";
  let chartRefreshIntervalId = null;
  let lastFundamentalRefreshAt = 0;
  let currentSupplementalRenderId = 0;
  let currentChartRenderId = 0;
  let currentSupplementalSymbol = "";
  const chartResultCache = new Map();
  const supplementalCache = new Map();
  const pendingChartRequests = new Map();
  const pendingTextRequests = new Map();
  const pendingSupplementalRequests = new Map();

  function readCurrentSymbol() {
    return (currentSymbolNode?.textContent || "AMEX:SPY").trim();
  }

  function getCurrentRange() {
    return rangeButtons.find((button) => button.classList.contains("is-active"))?.dataset.range || "1d";
  }

  function getShortTicker(symbol) {
    return symbol.includes(":") ? symbol.split(":").slice(1).join(":") : symbol;
  }

  function getYahooSymbol(symbol) {
    return YAHOO_SYMBOL_OVERRIDES[symbol] || getShortTicker(symbol);
  }

  function isCorporateSecurity(symbol) {
    return !symbol.startsWith("BITSTAMP:") && !symbol.startsWith("TVC:") && !symbol.startsWith("FOREXCOM:");
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function buildProxyUrl(url) {
    return `https://r.jina.ai/http://${url}`;
  }

  function getCacheTtlForRange(range) {
    return ["30m", "1h", "3h", "6h", "1d"].includes(range)
      ? CHART_CACHE_TTL_MS
      : LONG_RANGE_CHART_CACHE_TTL_MS;
  }

  function readStorageCache(key, ttlMs) {
    try {
      const raw = window.sessionStorage.getItem(key);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || !Number.isFinite(parsed.timestamp) || Date.now() - parsed.timestamp > ttlMs) {
        return null;
      }

      return parsed.value ?? null;
    } catch (_error) {
      return null;
    }
  }

  function writeStorageCache(key, value) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify({
        timestamp: Date.now(),
        value
      }));
    } catch (_error) {
      // Ignore storage quota and serialization failures.
    }
  }

  function getChartCacheKey(symbol, range) {
    return `${CHART_CACHE_PREFIX}:${symbol}:${range}`;
  }

  function getSupplementalCacheKey(symbol) {
    return `${SUPPLEMENTAL_CACHE_PREFIX}:${symbol}`;
  }

  function getCachedChartResult(symbol, range) {
    const cacheKey = getChartCacheKey(symbol, range);
    if (chartResultCache.has(cacheKey)) {
      return chartResultCache.get(cacheKey);
    }

    const cached = readStorageCache(cacheKey, getCacheTtlForRange(range));
    if (cached) {
      chartResultCache.set(cacheKey, cached);
    }

    return cached;
  }

  function setCachedChartResult(symbol, range, result) {
    const cacheKey = getChartCacheKey(symbol, range);
    chartResultCache.set(cacheKey, result);
    writeStorageCache(cacheKey, result);
  }

  function getCachedSupplemental(symbol) {
    if (supplementalCache.has(symbol)) {
      return supplementalCache.get(symbol);
    }

    const cached = readStorageCache(getSupplementalCacheKey(symbol), SUPPLEMENTAL_CACHE_TTL_MS);
    if (cached) {
      supplementalCache.set(symbol, cached);
    }

    return cached;
  }

  function setCachedSupplemental(symbol, value) {
    supplementalCache.set(symbol, value);
    writeStorageCache(getSupplementalCacheKey(symbol), value);
  }

  function buildChartMirrorUrl(symbol, interval, range) {
    const yahooSymbol = encodeURIComponent(getYahooSymbol(symbol));
    const refreshBucket = Math.floor(Date.now() / CHART_REFRESH_MS);
    const upstream = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}&_=${refreshBucket}`;
    return `${MIRROR_PREFIX}${upstream}`;
  }

  function extractMirrorJson(rawValue) {
    const text = typeof rawValue === "string" ? rawValue : rawValue?.contents || "";
    const jsonStart = text.indexOf("{");

    if (jsonStart === -1) {
      throw new Error("No JSON payload found in chart response");
    }

    return JSON.parse(text.slice(jsonStart));
  }

  async function fetchTextWithTimeout(url, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return await response.text();
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function fetchTextShared(url, timeoutMs = FETCH_TIMEOUT_MS) {
    if (pendingTextRequests.has(url)) {
      return pendingTextRequests.get(url);
    }

    const request = fetchTextWithTimeout(url, timeoutMs)
      .finally(() => {
        pendingTextRequests.delete(url);
      });

    pendingTextRequests.set(url, request);
    return request;
  }

  async function fetchJsonWithTimeout(url, timeoutMs = QUOTE_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      return await response.json();
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function fetchChartResult(symbol, range) {
    const cached = getCachedChartResult(symbol, range);
    const cacheKey = getChartCacheKey(symbol, range);
    if (pendingChartRequests.has(cacheKey)) {
      return pendingChartRequests.get(cacheKey);
    }

    const config = CHART_CONFIG[range] || CHART_CONFIG["1d"];
    const mirrorUrl = buildChartMirrorUrl(symbol, config.interval, config.range);
    const candidateRequests = [
      () => fetchJsonWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(mirrorUrl)}`, QUOTE_TIMEOUT_MS),
      () => fetchTextWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(mirrorUrl)}`, QUOTE_TIMEOUT_MS),
      () => fetchTextWithTimeout(mirrorUrl, QUOTE_TIMEOUT_MS)
    ];

    const fastRequest = Promise.any(
      candidateRequests.map((runRequest) =>
        Promise.resolve()
          .then(runRequest)
          .then((payload) => {
            const parsed = extractMirrorJson(payload);
            const result = parsed?.chart?.result?.[0];
            if (!result) {
              throw new Error("Chart data is unavailable");
            }

            setCachedChartResult(symbol, range, result);
            return result;
          })
      )
    );

    const request = fastRequest
      .catch(async (error) => {
        const retryRequests = [
          () => fetchTextWithTimeout(mirrorUrl, FETCH_TIMEOUT_MS),
          () => fetchTextWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(mirrorUrl)}`, FETCH_TIMEOUT_MS),
          () => fetchJsonWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(mirrorUrl)}`, FETCH_TIMEOUT_MS)
        ];

        for (const runRequest of retryRequests) {
          try {
            const parsed = extractMirrorJson(await runRequest());
            const result = parsed?.chart?.result?.[0];
            if (result) {
              setCachedChartResult(symbol, range, result);
              return result;
            }
          } catch (_retryError) {
            // Continue to next retry candidate.
          }
        }

        if (cached) {
          return cached;
        }

        throw error?.errors?.[0] || error || new Error("Chart data is unavailable");
      })
      .finally(() => {
        pendingChartRequests.delete(cacheKey);
      });

    pendingChartRequests.set(cacheKey, request);
    return request;
  }

  function normalizeMarkdownText(value) {
    return String(value || "")
      .replace(/\u202a|\u202c/g, "")
      .replace(/\u00a0/g, " ")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ")
      .replace(/[ \t]+\n/g, "\n");
  }

  function isLikelyNotFoundPage(text) {
    return /(?:^|\n)# 404 - Page not found\b|Page Not Found - 404|This isn't the page you're looking for/i.test(
      normalizeMarkdownText(text)
    );
  }

  function findLineValue(text, label) {
    const match = normalizeMarkdownText(text).match(
      new RegExp(`(?:^|\\n)${escapeRegExp(label)}\\s*([^\\n]+)`, "i")
    );

    return match ? match[1].trim() : "";
  }

  function findFollowingValue(text, label) {
    const lines = normalizeMarkdownText(text)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const index = lines.findIndex((line) => line.toLowerCase() === label.toLowerCase());

    if (index === -1) {
      return "";
    }

    for (let offset = 1; offset <= 4; offset += 1) {
      const candidate = lines[index + offset];
      if (!candidate || candidate === "≈") {
        continue;
      }

      return candidate;
    }

    return "";
  }

  function extractTradingViewAboutSection(text) {
    const normalized = normalizeMarkdownText(text);
    const match = normalized.match(/(?:^|\n)## About ([^\n]+)\n+([\s\S]*?)(?=\n(?:## |\[## |\# ))/i);

    if (!match) {
      return {
        aboutName: "",
        sectionBody: "",
        summary: ""
      };
    }

    const aboutName = match[1].trim();
    const sectionBody = match[2].trim();
    const lines = sectionBody
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const summaryCandidates = lines.filter(
      (line) =>
        line.length >= 80 &&
        /[.!?]$/.test(line) &&
        !/^(Sector|Industry|CEO|Website|Headquarters|Founded|IPO date|Identifiers|ISIN)\b/i.test(line)
    );

    return {
      aboutName,
      sectionBody,
      summary: summaryCandidates.sort((left, right) => right.length - left.length)[0] || ""
    };
  }

  function extractMarkdownLinkValue(text, label) {
    const match = text.match(
      new RegExp(`${escapeRegExp(label)}\\s*\\n+\\[([^\\]]+)\\]\\((https?:\\/\\/[^)]+)\\)`, "i")
    );

    if (!match) {
      return {
        label: "",
        href: ""
      };
    }

    return {
      label: match[1].trim(),
      href: match[2].trim()
    };
  }

  function parseDisplayNumber(value) {
    const cleaned = String(value || "")
      .replace(/[,+$]/g, "")
      .trim()
      .replace(/\s+/g, "");

    if (!cleaned || cleaned === "-" || cleaned.toLowerCase() === "n/a" || cleaned === "--") {
      return null;
    }

    const match = cleaned.match(/^(-?\d+(?:\.\d+)?)([KMBT%])?$/i);
    if (!match) {
      const numeric = Number(cleaned);
      return Number.isFinite(numeric) ? numeric : null;
    }

    const base = Number(match[1]);
    const suffix = (match[2] || "").toUpperCase();
    const multipliers = {
      K: 1e3,
      M: 1e6,
      B: 1e9,
      T: 1e12,
      "%": 1
    };

    if (!Number.isFinite(base)) {
      return null;
    }

    return base * (multipliers[suffix] || 1);
  }

  function formatRatio(value) {
    if (!Number.isFinite(value)) {
      return "--";
    }

    return value.toFixed(value >= 10 ? 1 : 2);
  }

  function formatDateLabel(value) {
    if (!value) {
      return "";
    }

    const yearMatch = value.match(/\b\d{4}\b/);
    const candidate = yearMatch ? value : `${value}, ${new Date().getFullYear()}`;
    const parsed = new Date(candidate);

    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(parsed);
  }

  function formatPrice(value) {
    if (!Number.isFinite(value)) {
      return "--";
    }

    const digits = Math.abs(value) >= 1000 ? 0 : value >= 10 ? 2 : 3;
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits
    }).format(value);
  }

  function formatSignedPrice(value) {
    if (!Number.isFinite(value)) {
      return "--";
    }

    const prefix = value > 0 ? "+" : "";
    return `${prefix}${formatPrice(value)}`;
  }

  function formatPercent(value) {
    if (!Number.isFinite(value)) {
      return "--";
    }

    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value.toFixed(2)}%`;
  }

  function formatVolume(value) {
    if (!Number.isFinite(value)) {
      return "--";
    }

    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2
    }).format(value);
  }

  function clamp(value, lower, upper) {
    return Math.min(Math.max(value, lower), upper);
  }

  function percentile(values, ratio) {
    if (!values.length) {
      return null;
    }

    const safeRatio = clamp(ratio, 0, 1);
    const position = (values.length - 1) * safeRatio;
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.ceil(position);

    if (lowerIndex === upperIndex) {
      return values[lowerIndex];
    }

    const weight = position - lowerIndex;
    return values[lowerIndex] + (values[upperIndex] - values[lowerIndex]) * weight;
  }

  function buildTradingViewSymbolUrl(symbol) {
    const [exchange = "AMEX", ticker = "SPY"] = symbol.split(":");
    const tradingViewExchange = exchange.replace("NYSEARCA", "AMEX");
    return `https://www.tradingview.com/symbols/${tradingViewExchange}-${ticker}/`;
  }

  function buildStockAnalysisOverviewUrl(symbol) {
    return `${STOCK_ANALYSIS_BASE}/stocks/${getShortTicker(symbol).toLowerCase()}/`;
  }

  function buildStockAnalysisStatisticsUrl(symbol) {
    return `${STOCK_ANALYSIS_BASE}/stocks/${getShortTicker(symbol).toLowerCase()}/statistics/`;
  }

  function buildWikipediaSearchUrl(query) {
    return `${WIKIPEDIA_API_BASE}?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&srlimit=1&origin=*`;
  }

  function buildWikipediaSummaryUrl(title) {
    return `${WIKIPEDIA_SUMMARY_BASE}/${encodeURIComponent(title)}`;
  }

  function buildWikidataWebsiteUrl(entityId) {
    return `${WIKIDATA_API_BASE}?action=wbgetclaims&entity=${encodeURIComponent(entityId)}&property=P856&format=json&origin=*`;
  }

  function parseTradingViewData(text) {
    const aboutSection = extractTradingViewAboutSection(text);
    const websiteLink = extractMarkdownLinkValue(text, "Website");

    return {
      companyName: aboutSection.aboutName,
      aboutSummary: aboutSection.summary,
      website: websiteLink.href || websiteLink.label,
      nextReportDate: findFollowingValue(text, "Next report date"),
      reportPeriod: findFollowingValue(text, "Report period"),
      epsEstimate: findFollowingValue(text, "EPS estimate"),
      revenueEstimate: findFollowingValue(text, "Revenue estimate"),
      marketCap: findFollowingValue(text, "Market capitalization")
    };
  }

  function parseOverviewData(text) {
    if (isLikelyNotFoundPage(text)) {
      return {};
    }

    const normalized = normalizeMarkdownText(text);
    const revenueLine = findLineValue(text, "Revenue (ttm)");
    const revenueGrowthMatch = revenueLine.match(/([+-]?\d+(?:\.\d+)?%)/);
    const aboutMatch = normalized.match(
      /(?:^|\n)## About [^\n]+\n+([\s\S]*?)(?=\n(?:Industry|Sector|CEO|Employees|Stock Exchange|Ticker Symbol|Website)\b|\n## )/i
    );
    const aboutSummary = aboutMatch
      ? aboutMatch[1]
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .join(" ")
      : "";

    return {
      marketCap: findLineValue(text, "Market Cap"),
      revenueGrowth: revenueGrowthMatch ? revenueGrowthMatch[1] : "",
      eps: findLineValue(text, "EPS"),
      forwardPe: findLineValue(text, "Forward PE"),
      aboutSummary,
      industry: findLineValue(text, "Industry"),
      sector: findLineValue(text, "Sector"),
      ceo: findLineValue(text, "CEO"),
      employees: findLineValue(text, "Employees"),
      website: findLineValue(text, "Website").replace(/\/+\s*$/, "")
    };
  }

  function parseWikipediaSearchTitle(payload) {
    return payload?.query?.search?.[0]?.title || "";
  }

  function parseWikipediaSummaryData(payload) {
    return {
      title: payload?.title || "",
      summary: String(payload?.extract || "").trim(),
      entityId: String(payload?.wikibase_item || "").trim()
    };
  }

  function parseWikidataWebsite(payload) {
    const claims = payload?.claims?.P856;
    if (!Array.isArray(claims)) {
      return "";
    }

    const preferred = claims.find((claim) => claim?.rank === "preferred") || claims[0];
    return String(preferred?.mainsnak?.datavalue?.value || "").trim();
  }

  function buildWikipediaSearchTerms(symbol) {
    const rawName = String(currentNameNode?.textContent || "").trim();
    const cleanedName = rawName
      .replace(/\b(incorporated|inc\.?|corporation|corp\.?|company|co\.?|limited|ltd\.?|plc|n\.v\.|ab\s*\(publ\)|\(publ\)|ab|s\.a\.|ag|holdings?)\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    return Array.from(
      new Set(
        [
          rawName,
          cleanedName,
          cleanedName ? `${cleanedName} company` : "",
          cleanedName ? `${cleanedName} corporation` : "",
          rawName.replace(/[.,]/g, "").trim()
        ].filter((value) => value && value.length >= 3)
      )
    );
  }

  async function fetchWikipediaCompanyProfile(symbol) {
    const staticFallback = COMPANY_PROFILE_FALLBACKS[symbol];
    if (staticFallback) {
      return {
        description: staticFallback.summary || "",
        website: staticFallback.website || ""
      };
    }

    const searchTerms = buildWikipediaSearchTerms(symbol);
    for (const term of searchTerms) {
      try {
        const searchPayload = await fetchJsonWithTimeout(buildWikipediaSearchUrl(term), QUOTE_TIMEOUT_MS);
        const title = parseWikipediaSearchTitle(searchPayload);
        if (!title) {
          continue;
        }

        const summaryPayload = await fetchJsonWithTimeout(buildWikipediaSummaryUrl(title), QUOTE_TIMEOUT_MS);
        const summaryData = parseWikipediaSummaryData(summaryPayload);
        if (!summaryData.summary) {
          continue;
        }

        let website = "";
        if (summaryData.entityId) {
          try {
            const websitePayload = await fetchJsonWithTimeout(buildWikidataWebsiteUrl(summaryData.entityId), QUOTE_TIMEOUT_MS);
            website = parseWikidataWebsite(websitePayload);
          } catch (_websiteError) {
            website = "";
          }
        }

        return {
          description: summaryData.summary,
          website
        };
      } catch (_error) {
        // Continue to next search candidate.
      }
    }

    return {};
  }

  function parseStatisticsData(text) {
    if (isLikelyNotFoundPage(text)) {
      return {};
    }

    return {
      earningsDate: findLineValue(text, "Earnings Date"),
      trailingPe: findLineValue(text, "P/E Ratio") || findLineValue(text, "PE Ratio"),
      forwardPe: findLineValue(text, "Forward PE"),
      debtEquity: findLineValue(text, "Debt / Equity"),
      profitMargin: findLineValue(text, "Profit Margin"),
      bookValuePerShare: findLineValue(text, "Book Value Per Share"),
      eps: findLineValue(text, "Loss Per Share") || findLineValue(text, "EPS"),
      revenueGrowthForecast: findLineValue(text, "Revenue Growth Forecast (5Y)")
    };
  }

  function setFinancialValue(node, value) {
    if (node) {
      node.textContent = value || "--";
    }
  }

  function setCompanySummaryValue(node, value, fallback = "--") {
    if (node) {
      node.textContent = value || fallback;
    }
  }

  function setCompanyWebsite(url) {
    if (!companySummaryNodes.website) {
      return;
    }

    const cleanUrl = String(url || "").trim();
    if (!cleanUrl || cleanUrl === "--" || cleanUrl === "n/a") {
      companySummaryNodes.website.textContent = cleanUrl || "--";
      companySummaryNodes.website.removeAttribute("href");
      return;
    }

    const href = /^https?:\/\//i.test(cleanUrl) ? cleanUrl : `https://${cleanUrl}`;
    companySummaryNodes.website.textContent = cleanUrl.replace(/^https?:\/\//i, "");
    companySummaryNodes.website.href = href;
  }

  function resetSupplementalPanels(symbol) {
    const fallback = COMPANY_PROFILE_FALLBACKS[symbol] || null;

    if (securityEarningsNode) {
      securityEarningsNode.textContent = isCorporateSecurity(symbol)
        ? "Next earnings: loading..."
        : "Next earnings: n/a for this asset";
    }

    if (companySummaryNodes.summary) {
      companySummaryNodes.summary.textContent = isCorporateSecurity(symbol)
        ? fallback?.summary || "Loading company summary..."
        : "Company summary is not available for this asset.";
    }

    setCompanyWebsite(fallback?.website || (isCorporateSecurity(symbol) ? "" : "n/a"));

    Object.values(financialNodes).forEach((node) => {
      if (node) {
        node.textContent = isCorporateSecurity(symbol) ? "--" : "n/a";
      }
    });
  }

  function hasSupplementalValues() {
    return Boolean(
      securityEarningsNode?.textContent?.trim() &&
      securityEarningsNode.textContent.trim() !== "Next earnings: loading..."
    );
  }

  function buildEarningsLabel(symbol, tradingViewData, statisticsData) {
    if (!isCorporateSecurity(symbol)) {
      return "Next earnings: n/a for this asset";
    }

    const tradingDate = formatDateLabel(tradingViewData.nextReportDate);
    const statsDate = formatDateLabel(statisticsData.earningsDate);
    let nextDateLabel = tradingDate || statsDate || "date unavailable";

    if (tradingDate && statsDate && tradingDate !== statsDate) {
      const [tradingMonthDay, tradingYear] = tradingDate.split(", ");
      const [statsMonthDay, statsYear] = statsDate.split(", ");
      const tradingMonth = tradingMonthDay.split(" ")[0];
      const statsParts = statsMonthDay.split(" ");
      const statsMonth = statsParts[0];
      const statsDay = statsParts[1];

      nextDateLabel =
        tradingYear === statsYear && tradingMonth === statsMonth
          ? `est. ${tradingMonthDay}-${statsDay}, ${statsYear}`
          : `est. ${tradingDate} - ${statsDate}`;
    }

    const details = [];
    if (tradingViewData.reportPeriod) {
      details.push(tradingViewData.reportPeriod);
    }
    if (tradingViewData.epsEstimate) {
      details.push(`EPS est ${tradingViewData.epsEstimate}`);
    }
    if (tradingViewData.revenueEstimate) {
      details.push(`Rev est ${tradingViewData.revenueEstimate}`);
    }

    return `Next earnings: ${nextDateLabel}${details.length ? ` · ${details.join(" · ")}` : ""}`;
  }

  function pickFirstNonEmpty(...values) {
    return values.find((value) => String(value || "").trim()) || "";
  }

  function buildFallbackSummary(symbol, companyProfileData, overviewData) {
    const staticFallback = COMPANY_PROFILE_FALLBACKS[symbol];
    if (staticFallback?.summary) {
      return staticFallback.summary;
    }

    const companyName = String(currentNameNode?.textContent || "").trim();
    const industry = pickFirstNonEmpty(overviewData.industry);
    const sector = pickFirstNonEmpty(overviewData.sector);

    if (companyName && industry && sector) {
      return `${companyName} operates in the ${industry} industry within the ${sector} sector.`;
    }

    return "Company summary is not available right now.";
  }

  function applySupplementalData(symbol, companyProfileData, overviewData, statisticsData, tradingViewData) {
    const staticFallback = COMPANY_PROFILE_FALLBACKS[symbol] || {};

    const shortTicker = getShortTicker(symbol);
    const currentName = String(currentNameNode?.textContent || "").trim();
    if (
      currentNameNode &&
      tradingViewData.companyName &&
      (!currentName || currentName.toUpperCase() === shortTicker.toUpperCase())
    ) {
      currentNameNode.textContent = tradingViewData.companyName;
    }

    if (securityEarningsNode) {
      securityEarningsNode.textContent = buildEarningsLabel(symbol, tradingViewData, statisticsData);
    }

    if (companySummaryNodes.summary) {
      companySummaryNodes.summary.textContent =
        pickFirstNonEmpty(tradingViewData.aboutSummary, companyProfileData.description, overviewData.aboutSummary) ||
        buildFallbackSummary(symbol, companyProfileData, overviewData);
    }
    setCompanyWebsite(
      pickFirstNonEmpty(tradingViewData.website, companyProfileData.website, overviewData.website, staticFallback.website)
    );

    const lastPrice = parseDisplayNumber(lastPriceNode?.textContent || "");
    const bookValuePerShare = parseDisplayNumber(statisticsData.bookValuePerShare);
    const priceToBook = Number.isFinite(lastPrice) && Number.isFinite(bookValuePerShare) && bookValuePerShare > 0
      ? lastPrice / bookValuePerShare
      : null;
    const revenueGrowth = overviewData.revenueGrowth || statisticsData.revenueGrowthForecast || "--";

    setFinancialValue(
      financialNodes.marketCap,
      overviewData.marketCap || tradingViewData.marketCap || "--"
    );
    setFinancialValue(
      financialNodes.trailingPe,
      statisticsData.trailingPe || "--"
    );
    setFinancialValue(
      financialNodes.forwardPe,
      statisticsData.forwardPe || overviewData.forwardPe || "--"
    );
    setFinancialValue(
      financialNodes.priceBook,
      Number.isFinite(priceToBook) ? formatRatio(priceToBook) : "--"
    );
    setFinancialValue(
      financialNodes.eps,
      statisticsData.eps || overviewData.eps || "--"
    );
    setFinancialValue(
      financialNodes.revenueGrowth,
      revenueGrowth || "--"
    );
    setFinancialValue(
      financialNodes.profitMargin,
      statisticsData.profitMargin || "--"
    );
    setFinancialValue(
      financialNodes.debtEquity,
      statisticsData.debtEquity || "--"
    );
  }

  function setSecondaryView(view) {
    currentSecondaryView =
      view === "financial"
        ? "financial"
        : view === "technical"
          ? "technical"
          : view === "ticker"
            ? "ticker"
            : "summary";

    secondaryPanels.forEach((panel) => {
      panel.classList.toggle("is-hidden", panel.dataset.secondaryPanel !== currentSecondaryView);
    });

    secondaryViewButtons.forEach((button) => {
      const isActive = button.dataset.secondaryView === currentSecondaryView;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    if (secondaryTitleNode) {
      secondaryTitleNode.textContent =
        currentSecondaryView === "summary"
          ? "Company Summary"
          : currentSecondaryView === "ticker"
            ? "Ticker News"
            : currentSecondaryView === "financial"
              ? "Financial Data"
              : "Technical Read";
    }

    if (secondaryNoteNode) {
      secondaryNoteNode.textContent =
        currentSecondaryView === "summary"
          ? "Business summary"
          : currentSecondaryView === "technical"
            ? "Live signal"
            : "Core financials";
      secondaryNoteNode.classList.toggle("is-hidden", currentSecondaryView === "ticker");
    }

    if (selectedLabelNode) {
      selectedLabelNode.classList.toggle("is-hidden", currentSecondaryView !== "ticker");
    }

    if (financialLabelNode) {
      financialLabelNode.classList.toggle("is-hidden", currentSecondaryView !== "financial");
    }

    if (tickerRefreshTimerNode) {
      tickerRefreshTimerNode.classList.toggle("is-hidden", currentSecondaryView !== "ticker");
    }
  }

  function getTrendClass(value) {
    if (!Number.isFinite(value) || value === 0) {
      return "change-flat";
    }

    return value > 0 ? "change-up" : "change-down";
  }

  function formatChartTimestamp(timestamp, range) {
    const options = ["30m", "1h", "3h", "6h", "1d", "5d"].includes(range)
      ? { hour: "numeric", minute: "2-digit" }
      : { month: "short", day: "numeric" };

    return new Intl.DateTimeFormat("en-US", {
      timeZone: MARKET_TIMEZONE,
      ...options
    }).format(new Date(timestamp));
  }

  function formatChartUpdated(timestamp) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: MARKET_TIMEZONE,
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(timestamp));
  }

  function renderChartLoading(message) {
    if (!chartSlot) {
      return;
    }

    chartSlot.innerHTML = `<div class="panel-message">${escapeHtml(message)}</div>`;
  }

  function toChartPoints(result) {
    const timestamps = Array.isArray(result?.timestamp) ? result.timestamp : [];
    const quote = result?.indicators?.quote?.[0];

    if (!quote || !timestamps.length) {
      return [];
    }

    return timestamps
      .map((timestamp, index) => {
        const close = Number(quote.close?.[index]);
        const high = Number(quote.high?.[index]);
        const low = Number(quote.low?.[index]);
        const open = Number(quote.open?.[index]);
        const volume = Number(quote.volume?.[index]);

        if (!Number.isFinite(close) || !Number.isFinite(high) || !Number.isFinite(low)) {
          return null;
        }

        return {
          time: timestamp * 1000,
          open: Number.isFinite(open) ? open : close,
          high,
          low,
          close,
          volume: Number.isFinite(volume) ? Math.max(volume, 0) : 0
        };
      })
      .filter(Boolean);
  }

  function sanitizeChartPoints(points, range) {
    const positivePoints = points.filter((point) =>
      [point.open, point.high, point.low, point.close].every(Number.isFinite) &&
      point.open > 0 &&
      point.high > 0 &&
      point.low > 0 &&
      point.close > 0 &&
      point.high >= point.low
    );

    if (!positivePoints.length) {
      return [];
    }

    const lows = positivePoints.map((point) => point.low).sort((left, right) => left - right);
    const highs = positivePoints.map((point) => point.high).sort((left, right) => left - right);
    const intraday = ["30m", "1h", "3h", "6h", "1d", "5d"].includes(range);
    const lowerCore = percentile(lows, intraday ? 0.02 : 0.01) ?? lows[0];
    const upperCore = percentile(highs, intraday ? 0.98 : 0.99) ?? highs[highs.length - 1];
    const coreSpan = Math.max(upperCore - lowerCore, positivePoints[positivePoints.length - 1].close * 0.02, 0.25);
    const allowedLower = lowerCore - coreSpan * 0.45;
    const allowedUpper = upperCore + coreSpan * 0.45;

    const filtered = positivePoints.filter((point) =>
      point.high >= allowedLower &&
      point.low <= allowedUpper &&
      point.close >= allowedLower &&
      point.close <= allowedUpper
    );

    return filtered.length >= Math.max(12, Math.floor(positivePoints.length * 0.7))
      ? filtered
      : positivePoints;
  }

  function trimChartPointsForRange(points, range) {
    const config = CHART_CONFIG[range];

    if (!config?.lookbackMs || !points.length) {
      return points;
    }

    const latestTime = points[points.length - 1].time;
    const cutoff = latestTime - config.lookbackMs;
    const trimmed = points.filter((point) => point.time >= cutoff);

    if (trimmed.length >= 12) {
      return trimmed;
    }

    return points.slice(-Math.min(points.length, 75));
  }

  function pickLabelIndexes(length, desiredCount) {
    if (length <= 1) {
      return [0];
    }

    const step = Math.max(1, Math.floor((length - 1) / (desiredCount - 1)));
    const indexes = new Set([0, length - 1]);

    for (let index = step; index < length - 1; index += step) {
      indexes.add(index);
    }

    return Array.from(indexes)
      .sort((left, right) => left - right)
      .slice(0, desiredCount);
  }

  function buildCustomChartMarkup(symbol, range, result) {
    const points = sanitizeChartPoints(trimChartPointsForRange(toChartPoints(result), range), range);
    if (!points.length) {
      return null;
    }

    const meta = result.meta || {};
    const lastPoint = points[points.length - 1];
    const referencePrice = Number.isFinite(Number(meta.chartPreviousClose))
      ? Number(meta.chartPreviousClose)
      : Number.isFinite(Number(meta.previousClose))
        ? Number(meta.previousClose)
        : points[0].open;
    const delta = Number.isFinite(referencePrice) ? lastPoint.close - referencePrice : null;
    const deltaPercent = Number.isFinite(delta) && Number.isFinite(referencePrice) && referencePrice !== 0
      ? (delta / referencePrice) * 100
      : null;
    const highs = points.map((point) => point.high).sort((left, right) => left - right);
    const lows = points.map((point) => point.low).sort((left, right) => left - right);
    const volumes = points.map((point) => point.volume).sort((left, right) => left - right);
    const visibleVolume = points.reduce((sum, point) => sum + (Number.isFinite(point.volume) ? point.volume : 0), 0);
    const intradayRange = ["30m", "1h", "3h", "6h", "1d", "5d"].includes(range);
    const minPrice = percentile(lows, intradayRange ? 0.02 : 0.01) ?? lows[0];
    const maxPrice = percentile(highs, intradayRange ? 0.98 : 0.99) ?? highs[highs.length - 1];
    const maxVolume = Math.max(percentile(volumes, 0.96) ?? volumes[volumes.length - 1] ?? 1, 1);
    const shortIntradayRange = ["30m", "1h", "3h", "6h"].includes(range);
    const pricePadding = Math.max((maxPrice - minPrice) * (shortIntradayRange ? 0.14 : intradayRange ? 0.12 : 0.08), lastPoint.close * 0.0075, 0.08);
    const priceMin = minPrice - pricePadding;
    const priceMax = maxPrice + pricePadding;
    const width = 1000;
    const height = 680;
    const marginLeft = 52;
    const marginRight = 76;
    const marginTop = 18;
    const marginBottom = 36;
    const volumeHeight = 98;
    const volumeGap = 18;
    const plotWidth = width - marginLeft - marginRight;
    const priceHeight = height - marginTop - marginBottom - volumeHeight - volumeGap;
    const volumeTop = marginTop + priceHeight + volumeGap;
    const volumeBottom = volumeTop + volumeHeight;
    const xStep = points.length > 1 ? plotWidth / (points.length - 1) : plotWidth;
    const candleWidth = Math.max(2, Math.min(10, xStep * 0.62));
    const volumeBarWidth = Math.max(1.5, Math.min(7, candleWidth * 0.58));
    const priceY = (value) => marginTop + ((priceMax - value) / (priceMax - priceMin)) * priceHeight;
    const xAt = (index) => marginLeft + (points.length === 1 ? plotWidth / 2 : index * xStep);
    const volumeY = (value) => volumeBottom - (value / maxVolume) * volumeHeight;
    const currentPriceY = priceY(lastPoint.close);
    const labelY = Math.min(Math.max(currentPriceY, marginTop + 14), marginTop + priceHeight - 6);

    const horizontalGrid = Array.from({ length: 5 }, (_, index) => {
      const ratio = index / 4;
      const y = marginTop + ratio * priceHeight;
      const price = priceMax - ratio * (priceMax - priceMin);
      return `
        <line class="custom-chart-grid-line" x1="${marginLeft}" y1="${y.toFixed(2)}" x2="${(width - marginRight).toFixed(2)}" y2="${y.toFixed(2)}"></line>
        <text class="custom-chart-axis-label" x="${width - marginRight + 10}" y="${(y + 4).toFixed(2)}">${escapeHtml(formatPrice(price))}</text>
      `;
    }).join("");

    const verticalIndexes = pickLabelIndexes(points.length, ["30m", "1h"].includes(range) ? 5 : 6);
    const verticalGrid = verticalIndexes.map((index) => {
      const x = xAt(index);
      return `
        <line class="custom-chart-grid-line" x1="${x.toFixed(2)}" y1="${marginTop}" x2="${x.toFixed(2)}" y2="${volumeBottom.toFixed(2)}"></line>
        <text class="custom-chart-axis-label" x="${x.toFixed(2)}" y="${height - 10}" text-anchor="middle">${escapeHtml(formatChartTimestamp(points[index].time, range))}</text>
      `;
    }).join("");
    const volumeGridMarkup = [maxVolume, maxVolume / 2].map((tickValue) => {
      const y = volumeY(tickValue);
      return `
        <line class="custom-chart-grid-line custom-chart-volume-grid-line" x1="${marginLeft}" y1="${y.toFixed(2)}" x2="${(width - marginRight).toFixed(2)}" y2="${y.toFixed(2)}"></line>
        <text class="custom-chart-axis-label custom-chart-volume-axis-label" x="${(marginLeft - 8).toFixed(2)}" y="${(y + 4).toFixed(2)}" text-anchor="end">${escapeHtml(formatVolume(tickValue))}</text>
      `;
    }).join("");

    const candles = points.map((point, index) => {
      const x = xAt(index);
      const openY = priceY(clamp(point.open, priceMin, priceMax));
      const closeY = priceY(clamp(point.close, priceMin, priceMax));
      const highY = priceY(clamp(point.high, priceMin, priceMax));
      const lowY = priceY(clamp(point.low, priceMin, priceMax));
      const barTop = Math.min(openY, closeY);
      const barHeight = Math.max(Math.abs(closeY - openY), 1.5);
      const isUp = point.close >= point.open;
      const className = isUp ? "custom-chart-candle-up" : "custom-chart-candle-down";
      const wickClass = isUp ? "custom-chart-candle-wick is-up" : "custom-chart-candle-wick is-down";
      const volumeClass = isUp ? "custom-chart-volume-up" : "custom-chart-volume-down";
      const volumeBarTop = volumeY(Math.min(point.volume, maxVolume));

      return `
        <line class="${wickClass}" x1="${x.toFixed(2)}" y1="${highY.toFixed(2)}" x2="${x.toFixed(2)}" y2="${lowY.toFixed(2)}"></line>
        <rect class="${className}" x="${(x - candleWidth / 2).toFixed(2)}" y="${barTop.toFixed(2)}" width="${candleWidth.toFixed(2)}" height="${barHeight.toFixed(2)}" rx="0.6"></rect>
        <rect class="${volumeClass}" x="${(x - volumeBarWidth / 2).toFixed(2)}" y="${volumeBarTop.toFixed(2)}" width="${volumeBarWidth.toFixed(2)}" height="${(volumeBottom - volumeBarTop).toFixed(2)}"></rect>
      `;
    }).join("");

    const labelWidth = 62;
    const labelHeight = 22;
    const priceLineMarkup = `
      <line class="custom-chart-price-line" x1="${marginLeft}" y1="${currentPriceY.toFixed(2)}" x2="${(width - marginRight).toFixed(2)}" y2="${currentPriceY.toFixed(2)}"></line>
      <rect class="custom-chart-price-label" x="${(width - marginRight + 8).toFixed(2)}" y="${(labelY - labelHeight / 2).toFixed(2)}" width="${labelWidth}" height="${labelHeight}" rx="0"></rect>
      <text class="custom-chart-price-label-text" x="${(width - marginRight + 8 + labelWidth / 2).toFixed(2)}" y="${(labelY + 4).toFixed(2)}" text-anchor="middle">${escapeHtml(formatPrice(lastPoint.close))}</text>
    `;
    const title = currentNameNode?.textContent?.trim() || getShortTicker(symbol);
    const subtitle = `${getShortTicker(symbol)} · ${CHART_CONFIG[range]?.label || range.toUpperCase()}`;
    const updated = `Updated ${formatChartUpdated(lastPoint.time)} ET`;
    const deltaClass = getTrendClass(delta);

    return `
      <div class="custom-chart-shell">
        <div class="custom-chart-head">
          <div class="custom-chart-title-group">
            <div class="custom-chart-title">${escapeHtml(title)}</div>
            <div class="custom-chart-subtitle">${escapeHtml(subtitle)}</div>
            <div class="custom-chart-stats">
              <span>O <strong>${escapeHtml(formatPrice(lastPoint.open))}</strong></span>
              <span>H <strong>${escapeHtml(formatPrice(lastPoint.high))}</strong></span>
              <span>L <strong>${escapeHtml(formatPrice(lastPoint.low))}</strong></span>
              <span>C <strong>${escapeHtml(formatPrice(lastPoint.close))}</strong></span>
              <span class="${deltaClass}">Δ <strong>${escapeHtml(formatSignedPrice(delta))} (${escapeHtml(formatPercent(deltaPercent))})</strong></span>
              <span>Vol <strong>${escapeHtml(formatVolume(visibleVolume))}</strong></span>
            </div>
          </div>
          <div class="custom-chart-side">
            <div class="custom-chart-updated">${escapeHtml(updated)}</div>
          </div>
        </div>
        <div class="custom-chart-surface">
          <svg class="custom-chart-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-label="${escapeHtml(`${title} ${subtitle} chart`)}">
            ${horizontalGrid}
            ${verticalGrid}
            <line class="custom-chart-axis-line" x1="${marginLeft}" y1="${volumeBottom.toFixed(2)}" x2="${(width - marginRight).toFixed(2)}" y2="${volumeBottom.toFixed(2)}"></line>
            ${volumeGridMarkup}
            ${candles}
            ${priceLineMarkup}
          </svg>
        </div>
      </div>
    `;
  }

  function renderCustomChart(symbol, range) {
    if (!chartSlot) {
      return;
    }

    const renderId = ++currentChartRenderId;
    const cachedResult = getCachedChartResult(symbol, range);
    const hadChart = Boolean(chartSlot.querySelector(".custom-chart-shell"));
    const cachedMarkup = cachedResult ? buildCustomChartMarkup(symbol, range, cachedResult) : null;

    if (cachedMarkup && !hadChart) {
      chartSlot.innerHTML = cachedMarkup;
    } else if (!hadChart) {
      renderChartLoading("Loading custom chart...");
    }

    fetchChartResult(symbol, range)
      .then((result) => {
        if (renderId !== currentChartRenderId || readCurrentSymbol() !== symbol || getCurrentRange() !== range) {
          return;
        }

        const markup = buildCustomChartMarkup(symbol, range, result);
        if (markup) {
          chartSlot.innerHTML = markup;
        } else if (!hadChart) {
          chartSlot.innerHTML = '<div class="chart-empty">Chart data is unavailable for this symbol.</div>';
        }
      })
      .catch(() => {
        if (renderId !== currentChartRenderId) {
          return;
        }

        if (!hadChart) {
          chartSlot.innerHTML = '<div class="chart-empty">The custom chart could not be loaded right now.</div>';
        }
      });
  }

  function queueChartRefresh(delayMs = 120) {
    const symbol = readCurrentSymbol();
    const range = getCurrentRange();
    window.setTimeout(() => {
      renderCustomChart(symbol, range);
    }, delayMs);
  }

  function refreshSupplementalData(force = false) {
    const symbol = readCurrentSymbol();
    const symbolChanged = currentSupplementalSymbol && currentSupplementalSymbol !== symbol;
    currentSymbol = symbol;
    currentSupplementalSymbol = symbol;

    if (!isCorporateSecurity(symbol)) {
      resetSupplementalPanels(symbol);
      return;
    }

    const cached = getCachedSupplemental(symbol);
    if (cached) {
      applySupplementalData(
        symbol,
        cached.companyProfileData || {},
        cached.overviewData || {},
        cached.statisticsData || {},
        cached.tradingViewData || {}
      );
    } else if (!hasSupplementalValues() || symbolChanged) {
      resetSupplementalPanels(symbol);
    }

    if (!force && cached && Date.now() - lastFundamentalRefreshAt < FUNDAMENTAL_REFRESH_MS) {
      return;
    }

    if (pendingSupplementalRequests.has(symbol)) {
      return;
    }

    const renderId = ++currentSupplementalRenderId;
    lastFundamentalRefreshAt = Date.now();
    const request = Promise.allSettled([
      fetchWikipediaCompanyProfile(symbol),
      fetchTextShared(buildProxyUrl(buildStockAnalysisOverviewUrl(symbol))),
      fetchTextShared(buildProxyUrl(buildStockAnalysisStatisticsUrl(symbol))),
      fetchTextShared(buildProxyUrl(buildTradingViewSymbolUrl(symbol)))
    ])
      .then((results) => {
        if (renderId !== currentSupplementalRenderId || readCurrentSymbol() !== symbol) {
          return;
        }

        const companyProfileData = results[0].status === "fulfilled" ? results[0].value || {} : {};
        const overviewData = results[1].status === "fulfilled" ? parseOverviewData(results[1].value) : {};
        const statisticsData = results[2].status === "fulfilled" ? parseStatisticsData(results[2].value) : {};
        const tradingViewData = results[3].status === "fulfilled" ? parseTradingViewData(results[3].value) : {};

        const payload = {
          companyProfileData,
          overviewData,
          statisticsData,
          tradingViewData
        };

        setCachedSupplemental(symbol, payload);
        applySupplementalData(symbol, companyProfileData, overviewData, statisticsData, tradingViewData);
      })
      .finally(() => {
        pendingSupplementalRequests.delete(symbol);
      });

    pendingSupplementalRequests.set(symbol, request);
  }

  function bindSecondaryTabs() {
    secondaryViewButtons.forEach((button) => {
      button.addEventListener(
        "click",
        (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          setSecondaryView(button.dataset.secondaryView || "summary");
        },
        true
      );
    });
  }

  function bindChartRefresh() {
    rangeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        queueChartRefresh(10);
      });
    });

    if (chartRefreshIntervalId) {
      window.clearInterval(chartRefreshIntervalId);
    }

    chartRefreshIntervalId = window.setInterval(() => {
      if (!document.hidden) {
        queueChartRefresh(0);
      }
    }, CHART_REFRESH_MS);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        queueChartRefresh(0);
        refreshSupplementalData(true);
      }
    });

    window.addEventListener("focus", () => {
      queueChartRefresh(0);
      refreshSupplementalData(true);
    });

    window.addEventListener("pageshow", () => {
      queueChartRefresh(0);
      refreshSupplementalData(true);
    });
  }

  function observeSymbolChanges() {
    if (!currentSymbolNode) {
      return;
    }

    const observer = new MutationObserver(() => {
      const nextSymbol = readCurrentSymbol();
      if (nextSymbol === currentSymbol) {
        return;
      }

      currentSymbol = nextSymbol;
      lastFundamentalRefreshAt = 0;
      refreshSupplementalData(true);
      queueChartRefresh(20);
    });

    observer.observe(currentSymbolNode, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  bindSecondaryTabs();
  bindChartRefresh();
  observeSymbolChanges();
  setSecondaryView("summary");
  refreshSupplementalData(true);
  queueChartRefresh(20);
});
