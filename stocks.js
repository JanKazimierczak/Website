document.addEventListener("DOMContentLoaded", () => {
  // Change `defaultSymbol` if you want a different main ticker on first load.
  const DASHBOARD_CONFIG = {
    defaultSymbol: "AMEX:SPY",
    defaultRange: "1d"
  };

  const RSS2JSON_API = "https://api.rss2json.com/v1/api.json?rss_url=";
  const MARKET_NEWS_QUERY = "stock market OR bitcoin OR gold OR federal reserve";
  const MARKET_NEWS_QUERY_VARIANTS = [
    MARKET_NEWS_QUERY,
    "stocks OR equities OR earnings OR inflation OR treasury yields"
  ];
  const MAJOR_NEWS_SITES = [
    "reuters.com",
    "cnbc.com",
    "bloomberg.com",
    "wsj.com",
    "marketwatch.com",
    "barrons.com",
    "finance.yahoo.com",
    "seekingalpha.com",
    "foxbusiness.com",
    "investing.com"
  ];
  const DIRECT_MARKET_RSS_FEEDS = [
    {
      url: "https://seekingalpha.com/market_currents.xml",
      source: "Seeking Alpha"
    },
    {
      url: "https://moxie.foxbusiness.com/google-publisher/markets.xml",
      source: "Fox Business"
    },
    {
      url: "https://www.investing.com/rss/news_25.rss",
      source: "Investing.com"
    },
    {
      url: "https://www.investing.com/rss/news_11.rss",
      source: "Investing.com"
    }
  ];
  const AUTO_QUOTE_REFRESH_MS = 30 * 1000;
  const AUTO_NEWS_REFRESH_MS = 90 * 1000;
  const NEWS_TIMEOUT_MS = 4500;
  const NEWS_CACHE_TTL_MS = 60 * 1000;
  const QUOTE_TIMEOUT_MS = 3200;
  const MARKET_TIMEZONE = "America/New_York";
  const MIRROR_PREFIX = "https://r.jina.ai/http://";
  const QUOTE_CACHE_PREFIX = "stocks.quote";
  const MARKET_NEWS_CACHE_KEY = "stocks.news.market";
  const TICKER_NEWS_CACHE_PREFIX = "stocks.news.ticker";
  const PERSISTED_NEWS_CACHE_TTL_MS = 5 * 60 * 1000;

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

  const SYMBOL_DIRECTORY = {
    "NASDAQ:ALM": {
      name: "Almonty Industries Inc.",
      meta: "NASDAQ / USD / EQUITY"
    },
    "NASDAQ:AAPL": {
      name: "Apple Inc.",
      meta: "NASDAQ / USD / EQUITY"
    },
    "NASDAQ:MSFT": {
      name: "Microsoft Corporation",
      meta: "NASDAQ / USD / EQUITY"
    },
    "NASDAQ:NVDA": {
      name: "NVIDIA Corporation",
      meta: "NASDAQ / USD / EQUITY"
    },
    "NASDAQ:TSLA": {
      name: "Tesla, Inc.",
      meta: "NASDAQ / USD / EQUITY"
    },
    "AMEX:SPY": {
      name: "SPDR S&P 500 ETF Trust",
      meta: "AMEX / USD / ETF"
    },
    "BITSTAMP:BTCUSD": {
      name: "Bitcoin / US Dollar",
      meta: "BITSTAMP / USD / CRYPTO"
    },
    "TVC:GOLD": {
      name: "Gold Spot",
      meta: "TVC / USD / COMMODITY"
    },
    "FOREXCOM:NSXUSD": {
      name: "Nasdaq 100 Index",
      meta: "FOREXCOM / USD / INDEX"
    },
    "FOREXCOM:SPXUSD": {
      name: "S&P 500 Index",
      meta: "FOREXCOM / USD / INDEX"
    },
    "FOREXCOM:DJI": {
      name: "Dow Jones Industrial Average",
      meta: "FOREXCOM / USD / INDEX"
    }
  };

  const SYMBOL_ALIASES = {
    ALM: "NASDAQ:ALM",
    "NASDAQ:ALM": "NASDAQ:ALM",
    AAPL: "NASDAQ:AAPL",
    "NASDAQ:AAPL": "NASDAQ:AAPL",
    MSFT: "NASDAQ:MSFT",
    "NASDAQ:MSFT": "NASDAQ:MSFT",
    NVDA: "NASDAQ:NVDA",
    "NASDAQ:NVDA": "NASDAQ:NVDA",
    TSLA: "NASDAQ:TSLA",
    "NASDAQ:TSLA": "NASDAQ:TSLA",
    SPY: "AMEX:SPY",
    "AMEX:SPY": "AMEX:SPY",
    BTC: "BITSTAMP:BTCUSD",
    BTCUSD: "BITSTAMP:BTCUSD",
    "BTC-USD": "BITSTAMP:BTCUSD",
    "BITSTAMP:BTCUSD": "BITSTAMP:BTCUSD",
    GOLD: "TVC:GOLD",
    "TVC:GOLD": "TVC:GOLD",
    NASDAQ: "FOREXCOM:NSXUSD",
    NSXUSD: "FOREXCOM:NSXUSD",
    "FOREXCOM:NSXUSD": "FOREXCOM:NSXUSD",
    SPX: "FOREXCOM:SPXUSD",
    GSPC: "FOREXCOM:SPXUSD",
    SP500: "FOREXCOM:SPXUSD",
    "S&P500": "FOREXCOM:SPXUSD",
    "FOREXCOM:SPXUSD": "FOREXCOM:SPXUSD",
    DJI: "FOREXCOM:DJI",
    DOW: "FOREXCOM:DJI",
    "FOREXCOM:DJI": "FOREXCOM:DJI"
  };

  const RANGE_TO_INTERVAL = {
    "30m": "1",
    "1h": "1",
    "3h": "1",
    "6h": "5",
    "1d": "5",
    "5d": "30",
    "1mo": "60",
    "6mo": "D",
    "1y": "W"
  };

  const symbolForm = document.querySelector("[data-symbol-form]");
  const symbolInput = document.querySelector("[data-symbol-input]");
  const currentSymbolNode = document.querySelector("[data-current-symbol]");
  const currentNameNode = document.querySelector("[data-current-name]");
  const currentMetaNode = document.querySelector("[data-current-meta]");
  const marketSessionNode = document.querySelector("[data-market-session]");
  const marketClockNode = document.querySelector("[data-market-clock]");
  const quoteRefreshTimerNode = document.querySelector("[data-quote-refresh-timer]");
  const quoteBoardRefreshTimerNode = document.querySelector("[data-quote-board-refresh-timer]");
  const lastPriceNode = document.querySelector("[data-last-price]");
  const lastChangeNode = document.querySelector("[data-last-change]");
  const headerSymbolNode = document.querySelector("[data-header-symbol]");
  const selectedLabelNode = document.querySelector("[data-selected-label]");
  const metricOpenNode = document.querySelector("[data-metric-open]");
  const metricVwapNode = document.querySelector("[data-metric-vwap]");
  const metricPrevCloseNode = document.querySelector("[data-metric-prev-close]");
  const metricDayHighNode = document.querySelector("[data-metric-day-high]");
  const metricDayLowNode = document.querySelector("[data-metric-day-low]");
  const metric52WeekHighNode = document.querySelector("[data-metric-52w-high]");
  const metric52WeekLowNode = document.querySelector("[data-metric-52w-low]");
  const metricVolumeNode = document.querySelector("[data-metric-volume]");
  const breakingNewsList = document.querySelector("[data-breaking-news-list]");
  const breakingRefreshTimerNode = document.querySelector("[data-breaking-refresh-timer]");
  const tickerNewsList = document.querySelector("[data-ticker-news-list]");
  const tickerRefreshTimerNode = document.querySelector("[data-ticker-refresh-timer]");
  const quickPickButtons = Array.from(document.querySelectorAll("[data-symbol]"));
  const rangeButtons = Array.from(document.querySelectorAll("[data-range]"));

  let dashboardInitialized = false;
  let currentSymbol = DASHBOARD_CONFIG.defaultSymbol;
  let currentRange = DASHBOARD_CONFIG.defaultRange;
  let newsRenderId = 0;
  let quoteRenderId = 0;
  let currentQuoteSnapshot = null;
  let quoteIntervalId = null;
  let newsIntervalId = null;
  let refreshCountdownIntervalId = null;
  let lastQuoteRefreshAt = 0;
  let lastNewsRefreshAt = 0;
  const newsCache = new Map();
  const quoteSnapshotCache = new Map();
  const pendingQuoteRequests = new Map();
  const MARKET_WEEKDAY_INDEX = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };

  function normalizeSymbol(value) {
    const cleaned = (value || "").trim().toUpperCase().replace(/\s+/g, "");
    if (!cleaned) {
      return DASHBOARD_CONFIG.defaultSymbol;
    }

    if (SYMBOL_ALIASES[cleaned]) {
      return SYMBOL_ALIASES[cleaned];
    }

    if (cleaned.includes(":")) {
      return cleaned;
    }

    return `NASDAQ:${cleaned}`;
  }

  function getInitialSymbol() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("symbol") || params.get("tvwidgetsymbol");
    return normalizeSymbol(fromUrl || DASHBOARD_CONFIG.defaultSymbol);
  }

  function getShortTicker(symbol) {
    return symbol.includes(":") ? symbol.split(":").slice(1).join(":") : symbol;
  }

  function getSymbolMeta(symbol) {
    return SYMBOL_DIRECTORY[symbol] || {
      name: getShortTicker(symbol),
      meta: `${symbol.split(":")[0] || "MARKET"} / LIVE / FEED`
    };
  }

  function decodeHtml(value) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(value || "", "text/html");
    return doc.documentElement.textContent || "";
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

  function getTrendClass(value) {
    if (!Number.isFinite(value) || value === 0) {
      return "metric-flat";
    }

    return value > 0 ? "metric-up" : "metric-down";
  }

  function clearNode(node) {
    if (!node) {
      return;
    }

    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function getYahooSymbol(symbol) {
    return YAHOO_SYMBOL_OVERRIDES[symbol] || getShortTicker(symbol);
  }

  function buildMirrorUrl(symbol, interval = "5m", range = "1d") {
    const yahooSymbol = encodeURIComponent(getYahooSymbol(symbol));
    const upstream = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`;
    return `${MIRROR_PREFIX}${upstream}`;
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
      // Ignore storage failures.
    }
  }

  function getQuoteCacheKey(symbol) {
    return `${QUOTE_CACHE_PREFIX}:${symbol}`;
  }

  function getTickerNewsCacheKey(symbol) {
    return `${TICKER_NEWS_CACHE_PREFIX}:${symbol}`;
  }

  function extractMirrorJson(rawValue) {
    const text = typeof rawValue === "string" ? rawValue : rawValue?.contents || "";
    const jsonStart = text.indexOf("{");

    if (jsonStart === -1) {
      throw new Error("No JSON payload found in quote response");
    }

    return JSON.parse(text.slice(jsonStart));
  }

  async function fetchTextWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return await response.text();
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function fetchJsonWithTimeout(url, timeoutMs) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return await response.json();
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function fetchQuoteSnapshot(symbol) {
    const cacheKey = getQuoteCacheKey(symbol);
    const cached = quoteSnapshotCache.get(cacheKey) || readStorageCache(cacheKey, AUTO_QUOTE_REFRESH_MS);
    if (cached) {
      quoteSnapshotCache.set(cacheKey, cached);
    }

    if (pendingQuoteRequests.has(cacheKey)) {
      return pendingQuoteRequests.get(cacheKey);
    }

    const mirrorUrl = buildMirrorUrl(symbol, "1m", "1d");
    const candidateRequests = [
      () => fetchJsonWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(mirrorUrl)}`, QUOTE_TIMEOUT_MS),
      () => fetchTextWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(mirrorUrl)}`, QUOTE_TIMEOUT_MS),
      () => fetchTextWithTimeout(mirrorUrl, QUOTE_TIMEOUT_MS)
    ];

    const request = Promise.any(
      candidateRequests.map((runRequest) =>
        Promise.resolve()
          .then(runRequest)
          .then((payload) => {
            const parsed = extractMirrorJson(payload);
            const result = parsed?.chart?.result?.[0];
            if (!result) {
              throw new Error("Quote data is unavailable");
            }

            quoteSnapshotCache.set(cacheKey, result);
            writeStorageCache(cacheKey, result);
            return result;
          })
      )
    )
      .catch((error) => {
        if (cached) {
          return cached;
        }

        throw error?.errors?.[0] || error || new Error("Quote data is unavailable");
      })
      .finally(() => {
        pendingQuoteRequests.delete(cacheKey);
      });

    pendingQuoteRequests.set(cacheKey, request);
    return request;
  }

  function computeSessionVwap(result) {
    const quote = result?.indicators?.quote?.[0];
    if (!quote) {
      return null;
    }

    const highs = quote.high || [];
    const lows = quote.low || [];
    const closes = quote.close || [];
    const volumes = quote.volume || [];

    let weightedSum = 0;
    let totalVolume = 0;

    for (let index = 0; index < volumes.length; index += 1) {
      const high = Number(highs[index]);
      const low = Number(lows[index]);
      const close = Number(closes[index]);
      const volume = Number(volumes[index]);

      if (!Number.isFinite(high) || !Number.isFinite(low) || !Number.isFinite(close) || !Number.isFinite(volume) || volume <= 0) {
        continue;
      }

      const typicalPrice = (high + low + close) / 3;
      weightedSum += typicalPrice * volume;
      totalVolume += volume;
    }

    return totalVolume > 0 ? weightedSum / totalVolume : null;
  }

  function setMetricValue(node, value, className = "metric-flat") {
    if (!node) {
      return;
    }

    node.textContent = value;
    node.className = className;
  }

  function resetQuoteSnapshot() {
    currentQuoteSnapshot = null;

    if (lastPriceNode) {
      lastPriceNode.textContent = "--";
    }

    if (lastChangeNode) {
      lastChangeNode.textContent = "Loading quote";
      lastChangeNode.className = "security-change change-flat";
    }

    setMetricValue(metricOpenNode, "--");
    setMetricValue(metricVwapNode, "--");
    setMetricValue(metricPrevCloseNode, "--");
    setMetricValue(metricDayHighNode, "--");
    setMetricValue(metricDayLowNode, "--");
    setMetricValue(metric52WeekHighNode, "--");
    setMetricValue(metric52WeekLowNode, "--");
    setMetricValue(metricVolumeNode, "--");
  }

  function applyQuoteSnapshot(symbol, result) {
    const meta = result?.meta || {};
    const quote = result?.indicators?.quote?.[0] || {};
    const openingPrice = Number(quote.open?.find((value) => Number.isFinite(value)));
    const currentPrice = Number(meta.regularMarketPrice);
    const previousClose = Number(meta.previousClose ?? meta.chartPreviousClose);
    const dayHigh = Number(meta.regularMarketDayHigh);
    const dayLow = Number(meta.regularMarketDayLow);
    const yearHigh = Number(meta.fiftyTwoWeekHigh);
    const yearLow = Number(meta.fiftyTwoWeekLow);
    const volume = Number(meta.regularMarketVolume);
    const vwap = computeSessionVwap(result);
    const change = Number.isFinite(currentPrice) && Number.isFinite(previousClose) ? currentPrice - previousClose : null;
    const percentChange = Number.isFinite(change) && Number.isFinite(previousClose) && previousClose !== 0
      ? (change / previousClose) * 100
      : null;

    currentQuoteSnapshot = { symbol, currentPrice, change, percentChange };

    if (lastPriceNode) {
      lastPriceNode.textContent = formatPrice(currentPrice);
    }

    if (lastChangeNode) {
      lastChangeNode.textContent = `${formatSignedPrice(change)} (${formatPercent(percentChange)})`;
      lastChangeNode.className = `security-change ${getTrendClass(change).replace("metric", "change")}`;
    }

    setMetricValue(metricOpenNode, formatPrice(openingPrice));
    setMetricValue(metricVwapNode, formatPrice(vwap));
    setMetricValue(metricPrevCloseNode, formatPrice(previousClose), getTrendClass(change));
    setMetricValue(metricDayHighNode, formatPrice(dayHigh), "metric-up");
    setMetricValue(metricDayLowNode, formatPrice(dayLow), "metric-down");
    setMetricValue(metric52WeekHighNode, formatPrice(yearHigh));
    setMetricValue(metric52WeekLowNode, formatPrice(yearLow));
    setMetricValue(metricVolumeNode, formatVolume(volume));
  }

  function parseFeedDate(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return null;
    }

    const naiveMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (naiveMatch) {
      const [, year, month, day, hour, minute, second = "00"] = naiveMatch;
      return new Date(Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      ));
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function formatNewsDate(value) {
    const date = parseFeedDate(value);
    if (!date) {
      return "Recent";
    }

    return `${new Intl.DateTimeFormat("en-US", {
      timeZone: MARKET_TIMEZONE,
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(date)} ET`;
  }

  function getMarketParts(date = new Date()) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: MARKET_TIMEZONE,
      weekday: "short",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).formatToParts(date);

    const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return {
      weekdayShort: map.weekday || "Mon",
      hour: Number(map.hour || 0),
      minute: Number(map.minute || 0),
      second: Number(map.second || 0)
    };
  }

  function formatMarketClock(date = new Date()) {
    return `${new Intl.DateTimeFormat("en-US", {
      timeZone: MARKET_TIMEZONE,
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit"
    }).format(date)} ET`;
  }

  function getNextWeekdayLabel(weekdayIndex) {
    if (weekdayIndex === 5) {
      return "Mon";
    }

    if (weekdayIndex === 6) {
      return "Mon";
    }

    return "Tomorrow";
  }

  function getMarketSessionLabel(symbol, date = new Date()) {
    if (symbol.startsWith("BITSTAMP:")) {
      return "Open · 24/7 market";
    }

    if (symbol.startsWith("FOREXCOM:")) {
      const { weekdayShort } = getMarketParts(date);
      const weekdayIndex = MARKET_WEEKDAY_INDEX[weekdayShort] ?? 1;
      return weekdayIndex === 0 || weekdayIndex === 6 ? "Closed · global market reopens Sun" : "Open · global market";
    }

    if (symbol.startsWith("TVC:")) {
      const { weekdayShort } = getMarketParts(date);
      const weekdayIndex = MARKET_WEEKDAY_INDEX[weekdayShort] ?? 1;
      return weekdayIndex === 0 || weekdayIndex === 6 ? "Closed · global session resumes Sun" : "Open · global session";
    }

    const { weekdayShort, hour, minute } = getMarketParts(date);
    const weekdayIndex = MARKET_WEEKDAY_INDEX[weekdayShort] ?? 1;
    const totalMinutes = hour * 60 + minute;
    const openMinutes = 9 * 60 + 30;
    const closeMinutes = 16 * 60;

    if (weekdayIndex >= 1 && weekdayIndex <= 5 && totalMinutes >= openMinutes && totalMinutes < closeMinutes) {
      return "Open · closes 4:00 PM ET";
    }

    if (weekdayIndex >= 1 && weekdayIndex <= 5 && totalMinutes < openMinutes) {
      return "Closed · opens 9:30 AM ET";
    }

    return `Closed · opens ${getNextWeekdayLabel(weekdayIndex)} 9:30 AM ET`;
  }

  function updateMarketClock() {
    if (marketClockNode) {
      marketClockNode.textContent = formatMarketClock();
    }

    if (marketSessionNode) {
      marketSessionNode.textContent = getMarketSessionLabel(currentSymbol);
    }
  }

  function formatCountdownLabel(milliseconds) {
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
      return "Now";
    }

    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      if (seconds === 0) {
        return `${minutes} min`;
      }

      return `${minutes} min ${seconds} sec`;
    }

    return `${totalSeconds} sec`;
  }

  function updateRefreshCountdowns() {
    updateMarketClock();

    const remainingQuoteMs = AUTO_QUOTE_REFRESH_MS - (Date.now() - lastQuoteRefreshAt);

    if (quoteRefreshTimerNode) {
      quoteRefreshTimerNode.textContent = formatCountdownLabel(remainingQuoteMs);
    }

    if (quoteBoardRefreshTimerNode) {
      quoteBoardRefreshTimerNode.textContent = formatCountdownLabel(remainingQuoteMs);
    }

    const remainingNewsMs = AUTO_NEWS_REFRESH_MS - (Date.now() - lastNewsRefreshAt);

    if (breakingRefreshTimerNode) {
      breakingRefreshTimerNode.textContent = formatCountdownLabel(remainingNewsMs);
    }

    if (tickerRefreshTimerNode) {
      tickerRefreshTimerNode.textContent = formatCountdownLabel(remainingNewsMs);
    }
  }

  function buildRssProxyUrl(rssUrl) {
    return `${RSS2JSON_API}${encodeURIComponent(rssUrl)}`;
  }

  function buildGoogleNewsRssUrl(query) {
    return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  }

  function buildYahooFinanceNewsRssUrl(symbol) {
    return `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${encodeURIComponent(getYahooSymbol(symbol))}&region=US&lang=en-US`;
  }

  function buildSeekingAlphaTickerNewsRssUrl(symbol) {
    return `https://seekingalpha.com/api/sa/combined/${encodeURIComponent(getYahooSymbol(symbol))}.xml`;
  }

  async function fetchRssFeed(rssUrl, limit, sourceOverride = "") {
    const cacheKey = `${rssUrl}::${limit}::${sourceOverride}`;
    const cached = newsCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < NEWS_CACHE_TTL_MS) {
      return cached.items;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), NEWS_TIMEOUT_MS);
    let response;

    try {
      response = await fetch(buildRssProxyUrl(rssUrl), {
        headers: {
          Accept: "application/json"
        },
        signal: controller.signal
      });
    } finally {
      window.clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`News request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const items = Array.isArray(payload.items) ? payload.items.slice(0, limit) : [];

    const parsedItems = items.map((item) => ({
      title: decodeHtml(item.title || "Headline"),
      link: item.link || "#",
      source: decodeHtml(sourceOverride || item.author || payload.feed?.title || "Google News"),
      date: item.pubDate || ""
    }));

    newsCache.set(cacheKey, {
      timestamp: now,
      items: parsedItems
    });

    return parsedItems;
  }

  async function fetchGoogleNews(query, limit) {
    return fetchRssFeed(buildGoogleNewsRssUrl(query), limit);
  }

  async function fetchYahooFinanceNews(symbol, limit) {
    return fetchRssFeed(buildYahooFinanceNewsRssUrl(symbol), limit, "Yahoo Finance");
  }

  async function fetchSeekingAlphaTickerNews(symbol, limit) {
    return fetchRssFeed(buildSeekingAlphaTickerNewsRssUrl(symbol), limit, "Seeking Alpha");
  }

  async function fetchDirectFeed(feed, limit) {
    return fetchRssFeed(feed.url, limit, feed.source);
  }

  function normalizeNewsUrl(value) {
    if (!value) {
      return "";
    }

    try {
      const url = new URL(value);
      url.hash = "";

      [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "utm_term",
        "utm_content",
        "guccounter",
        "guce_referrer",
        "guce_referrer_sig"
      ].forEach((key) => {
        url.searchParams.delete(key);
      });

      const search = url.searchParams.toString();
      return `${url.origin}${url.pathname}${search ? `?${search}` : ""}`.replace(/\/$/, "");
    } catch (error) {
      return value.trim();
    }
  }

  function normalizeNewsTitle(value) {
    return decodeHtml(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function getNewsTimestamp(item) {
    const timestamp = Date.parse(item?.date || "");
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function getNewsSourcePriority(item) {
    const source = (item?.source || "").toLowerCase();

    if (source.includes("reuters") || source.includes("bloomberg") || source.includes("cnbc")) {
      return 5;
    }

    if (
      source.includes("wall street journal") ||
      source.includes("wsj") ||
      source.includes("marketwatch") ||
      source.includes("barron") ||
      source.includes("financial times")
    ) {
      return 4;
    }

    if (
      source.includes("seeking alpha") ||
      source.includes("fox business") ||
      source.includes("investing.com")
    ) {
      return 3;
    }

    if (source.includes("yahoo")) {
      return 2;
    }

    if (source.includes("google news")) {
      return 1;
    }

    return 0;
  }

  function dedupeAndSortNews(items, limit) {
    const sorted = [...items].sort((left, right) => {
      const timeDelta = getNewsTimestamp(right) - getNewsTimestamp(left);
      if (timeDelta !== 0) {
        return timeDelta;
      }

      return getNewsSourcePriority(right) - getNewsSourcePriority(left);
    });

    const seenLinks = new Set();
    const seenTitles = new Set();
    const merged = [];

    sorted.forEach((item) => {
      if (!item?.title) {
        return;
      }

      const linkKey = normalizeNewsUrl(item.link);
      const titleKey = normalizeNewsTitle(item.title);

      if ((linkKey && seenLinks.has(linkKey)) || (titleKey && seenTitles.has(titleKey))) {
        return;
      }

      if (linkKey) {
        seenLinks.add(linkKey);
      }

      if (titleKey) {
        seenTitles.add(titleKey);
      }

      merged.push(item);
    });

    return merged.slice(0, limit);
  }

  async function fetchMergedNews(loaders, limit) {
    const settled = await Promise.allSettled(loaders.map((loader) => loader()));
    const fulfilled = settled.filter((result) => result.status === "fulfilled");

    if (!fulfilled.length) {
      throw new Error("No news feeds are available");
    }

    const items = fulfilled
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value);

    return dedupeAndSortNews(items, limit);
  }

  function buildPublisherQueries(baseQuery) {
    return MAJOR_NEWS_SITES.map((site) => `${baseQuery} site:${site}`);
  }

  function buildTickerNewsQueries(symbol) {
    const meta = getSymbolMeta(symbol);
    const ticker = getShortTicker(symbol);

    return [
      `${meta.name} OR ${ticker} stock`,
      `"${meta.name}" OR "${ticker}" earnings OR "${ticker}" guidance`
    ];
  }

  async function fetchMarketNews(limit) {
    const perFeedLimit = Math.max(limit, 6);
    const loaders = [
      ...MARKET_NEWS_QUERY_VARIANTS.map((query, index) => () => fetchGoogleNews(query, index === 0 ? limit * 2 : perFeedLimit)),
      ...MARKET_NEWS_QUERY_VARIANTS.flatMap((query) =>
        buildPublisherQueries(query).map((publisherQuery) => () => fetchGoogleNews(publisherQuery, perFeedLimit))
      ),
      ...DIRECT_MARKET_RSS_FEEDS.map((feed) => () => fetchDirectFeed(feed, perFeedLimit))
    ];

    return fetchMergedNews(loaders, limit);
  }

  async function fetchTickerNews(symbol, limit) {
    const perFeedLimit = Math.max(limit, 6);
    const tickerQueries = buildTickerNewsQueries(symbol);
    const loaders = [
      ...tickerQueries.map((query, index) => () => fetchGoogleNews(query, index === 0 ? limit * 2 : perFeedLimit)),
      ...tickerQueries.flatMap((query) =>
        buildPublisherQueries(query).map((publisherQuery) => () => fetchGoogleNews(publisherQuery, perFeedLimit))
      ),
      () => fetchYahooFinanceNews(symbol, perFeedLimit),
      () => fetchSeekingAlphaTickerNews(symbol, perFeedLimit)
    ];

    return fetchMergedNews(loaders, limit);
  }

  function renderNewsMessage(node, message) {
    if (!node) {
      return;
    }

    clearNode(node);
    const item = document.createElement("li");
    item.className = "news-empty";
    item.textContent = message;
    node.appendChild(item);
  }

  function renderNewsItems(node, items, emptyMessage) {
    if (!node) {
      return;
    }

    if (!items.length) {
      renderNewsMessage(node, emptyMessage);
      return;
    }

    clearNode(node);

    items.forEach((item) => {
      const row = document.createElement("li");
      row.className = "news-item";

      const link = document.createElement("a");
      link.href = item.link || "#";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = item.title;

      const meta = document.createElement("div");
      meta.className = "news-meta";

      const source = document.createElement("span");
      source.textContent = item.source;

      const date = document.createElement("span");
      date.textContent = formatNewsDate(item.date);

      meta.append(source, date);
      row.append(link, meta);
      node.appendChild(row);
    });
  }

  function setQuickPickState(symbol) {
    quickPickButtons.forEach((button) => {
      button.classList.toggle("is-active", normalizeSymbol(button.dataset.symbol) === symbol);
    });
  }

  function setRangeState(range) {
    rangeButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.range === range);
    });
  }

  function setUrlSymbol(symbol) {
    const url = new URL(window.location.href);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("tvwidgetsymbol", symbol);
    window.history.replaceState({}, "", url.toString());
  }

  function updateHeader(symbol) {
    const meta = getSymbolMeta(symbol);

    if (currentSymbolNode) {
      currentSymbolNode.textContent = symbol;
    }

    if (currentNameNode) {
      currentNameNode.textContent = meta.name;
    }

    if (currentMetaNode) {
      currentMetaNode.textContent = meta.meta;
    }

    if (headerSymbolNode) {
      headerSymbolNode.textContent = symbol;
    }

    if (selectedLabelNode) {
      selectedLabelNode.textContent = symbol;
    }

    if (symbolInput) {
      symbolInput.value = getShortTicker(symbol);
    }

    updateMarketClock();

    if (currentQuoteSnapshot?.symbol === symbol) {
      lastPriceNode.textContent = formatPrice(currentQuoteSnapshot.currentPrice);
      lastChangeNode.textContent = `${formatSignedPrice(currentQuoteSnapshot.change)} (${formatPercent(currentQuoteSnapshot.percentChange)})`;
      lastChangeNode.className = `security-change ${getTrendClass(currentQuoteSnapshot.change).replace("metric", "change")}`;
      return;
    }

    resetQuoteSnapshot();
  }

  function createWidgetFrame(slotName) {
    const slot = document.querySelector(`[data-widget-slot="${slotName}"]`);
    if (!slot) {
      return null;
    }

    const frame = document.createElement("div");
    frame.className = "tradingview-widget-container";
    frame.style.width = "100%";
    frame.style.height = "100%";

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    widget.style.width = "100%";
    widget.style.height = "100%";

    frame.appendChild(widget);
    slot.innerHTML = "";
    slot.appendChild(frame);
    return frame;
  }

  function renderWidget(slotName, scriptName, config) {
    const frame = createWidgetFrame(slotName);
    if (!frame) {
      return;
    }

    const script = document.createElement("script");
    script.src = `https://s3.tradingview.com/external-embedding/${scriptName}`;
    script.async = true;
    script.type = "text/javascript";
    script.text = JSON.stringify(config);
    frame.appendChild(script);
  }

  function renderTickerTape(symbol) {
    renderWidget("ticker-tape", "embed-widget-ticker-tape.js", {
      symbols: [
        { proName: "FOREXCOM:NSXUSD", title: "NASDAQ" },
        { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
        { proName: "FOREXCOM:DJI", title: "DOW" },
        { proName: "TVC:GOLD", title: "GOLD" },
        { proName: "BITSTAMP:BTCUSD", title: "BTC" },
        { proName: symbol, title: getShortTicker(symbol) }
      ],
      showSymbolLogo: false,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "en"
    });
  }

  function renderChart(symbol) {
    void symbol;
    // The page uses the custom chart from stocks-extra.js. Do not load the
    // TradingView advanced-chart widget underneath it.
  }

  function renderTechnical(symbol) {
    renderWidget("technical-analysis", "embed-widget-technical-analysis.js", {
      interval: "1h",
      width: "100%",
      isTransparent: true,
      height: "100%",
      symbol,
      showIntervalTabs: false,
      displayMode: "single",
      locale: "en",
      colorTheme: "dark"
    });
  }

  async function loadQuotePanel(symbol) {
    const thisRender = ++quoteRenderId;
    lastQuoteRefreshAt = Date.now();
    updateRefreshCountdowns();

    const cached = quoteSnapshotCache.get(getQuoteCacheKey(symbol)) || readStorageCache(getQuoteCacheKey(symbol), AUTO_QUOTE_REFRESH_MS);
    if (cached) {
      quoteSnapshotCache.set(getQuoteCacheKey(symbol), cached);
      applyQuoteSnapshot(symbol, cached);
    }

    try {
      const result = await fetchQuoteSnapshot(symbol);

      if (thisRender !== quoteRenderId) {
        return;
      }

      applyQuoteSnapshot(symbol, result);
    } catch (error) {
      if (thisRender !== quoteRenderId) {
        return;
      }

      if (lastChangeNode) {
        lastChangeNode.textContent = "Quote feed unavailable";
        lastChangeNode.className = "security-change change-flat";
      }
    }
  }

  async function loadNewsPanels(symbol) {
    const thisRender = ++newsRenderId;
    const ticker = getShortTicker(symbol);
    lastNewsRefreshAt = Date.now();
    updateRefreshCountdowns();
    const cachedMarketNews = readStorageCache(MARKET_NEWS_CACHE_KEY, PERSISTED_NEWS_CACHE_TTL_MS);
    const cachedTickerNews = readStorageCache(getTickerNewsCacheKey(symbol), PERSISTED_NEWS_CACHE_TTL_MS);

    if (cachedMarketNews?.length) {
      renderNewsItems(breakingNewsList, cachedMarketNews, "No market headlines are available right now.");
    } else if (!breakingNewsList?.children.length) {
      renderNewsMessage(breakingNewsList, "Loading market headlines...");
    }

    if (cachedTickerNews?.length) {
      renderNewsItems(tickerNewsList, cachedTickerNews, `No current headlines were found for ${ticker}.`);
    } else if (!tickerNewsList?.children.length) {
      renderNewsMessage(tickerNewsList, `Loading ${ticker} headlines...`);
    }

    const [marketResult, tickerResult] = await Promise.allSettled([
      fetchMarketNews(12),
      fetchTickerNews(symbol, 20)
    ]);

    if (thisRender !== newsRenderId) {
      return;
    }

    if (marketResult.status === "fulfilled") {
      writeStorageCache(MARKET_NEWS_CACHE_KEY, marketResult.value);
      renderNewsItems(
        breakingNewsList,
        marketResult.value,
        "No market headlines are available right now."
      );
    } else {
      renderNewsMessage(breakingNewsList, "Market headlines could not be loaded right now.");
    }

    if (tickerResult.status === "fulfilled") {
      writeStorageCache(getTickerNewsCacheKey(symbol), tickerResult.value);
      renderNewsItems(
        tickerNewsList,
        tickerResult.value,
        `No current headlines were found for ${ticker}.`
      );
    } else {
      renderNewsMessage(tickerNewsList, `Ticker headlines could not be loaded for ${ticker}.`);
    }
  }

  function refreshQuoteIfNeeded(force = false) {
    if (!dashboardInitialized) {
      return;
    }

    if (document.hidden && !force) {
      return;
    }

    if (!force && Date.now() - lastQuoteRefreshAt < AUTO_QUOTE_REFRESH_MS - 1000) {
      return;
    }

    loadQuotePanel(currentSymbol);
  }

  function refreshNewsIfNeeded(force = false) {
    if (!dashboardInitialized) {
      return;
    }

    if (document.hidden && !force) {
      return;
    }

    if (!force && Date.now() - lastNewsRefreshAt < AUTO_NEWS_REFRESH_MS - 1000) {
      return;
    }

    loadNewsPanels(currentSymbol);
  }

  function startAutoRefresh() {
    if (quoteIntervalId) {
      window.clearInterval(quoteIntervalId);
    }

    if (newsIntervalId) {
      window.clearInterval(newsIntervalId);
    }

    quoteIntervalId = window.setInterval(() => {
      refreshQuoteIfNeeded();
    }, AUTO_QUOTE_REFRESH_MS);

    newsIntervalId = window.setInterval(() => {
      refreshNewsIfNeeded();
    }, AUTO_NEWS_REFRESH_MS);

    if (refreshCountdownIntervalId) {
      window.clearInterval(refreshCountdownIntervalId);
    }

    refreshCountdownIntervalId = window.setInterval(() => {
      updateRefreshCountdowns();
    }, 1000);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        refreshQuoteIfNeeded(true);
        refreshNewsIfNeeded(true);
      }
    });

    window.addEventListener("focus", () => {
      refreshQuoteIfNeeded(true);
      refreshNewsIfNeeded(true);
    });

    window.addEventListener("pageshow", () => {
      refreshQuoteIfNeeded(true);
      refreshNewsIfNeeded(true);
    });
  }

  function renderDashboard(rawSymbol) {
    const symbol = normalizeSymbol(rawSymbol);
    currentSymbol = symbol;
    updateHeader(symbol);
    setQuickPickState(symbol);
    setRangeState(currentRange);
    setUrlSymbol(symbol);

    renderTickerTape(symbol);
    renderChart(symbol);
    renderTechnical(symbol);
    loadQuotePanel(symbol);
    loadNewsPanels(symbol);
  }

  function bindEvents() {
    if (symbolForm && symbolInput) {
      symbolForm.addEventListener("submit", (event) => {
        event.preventDefault();
        renderDashboard(symbolInput.value);
      });
    }

    quickPickButtons.forEach((button) => {
      button.addEventListener("click", () => {
        renderDashboard(button.dataset.symbol || DASHBOARD_CONFIG.defaultSymbol);
      });
    });

    rangeButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const nextRange = button.dataset.range || DASHBOARD_CONFIG.defaultRange;
        if (nextRange === currentRange) {
          return;
        }

        currentRange = nextRange;
        setRangeState(currentRange);
        if (dashboardInitialized) {
          renderChart(currentSymbol);
        }
      });
    });

  }

  bindEvents();
  dashboardInitialized = true;
  renderDashboard(getInitialSymbol());
  startAutoRefresh();
  updateRefreshCountdowns();
});
