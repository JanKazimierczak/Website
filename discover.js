document.addEventListener("DOMContentLoaded", () => {
  const RSS2JSON_API = "https://api.rss2json.com/v1/api.json?rss_url=";
  const MIRROR_PREFIX = "https://r.jina.ai/http://";
  const FETCH_TIMEOUT_MS = 12000;
  const DISCOVERY_SCAN_REFRESH_MS = 2 * 60 * 1000;
  const DISCOVERY_NEWS_REFRESH_MS = 90 * 1000;
  const DISCOVERY_LONG_TERM_REFRESH_MS = 15 * 60 * 1000;
  const QUOTE_TIMEOUT_MS = 5500;
  const NEWS_TIMEOUT_MS = 4500;
  const NEWS_CACHE_TTL_MS = 60 * 1000;
  const NEWS_TIMEZONE = "America/New_York";
  const MARKET_NEWS_QUERY = "stock market OR earnings OR movers OR volume OR federal reserve";
  const EARNINGS_NEWS_QUERY = "earnings OR guidance OR outlook OR revenue OR EPS stocks";
  const IPO_NEWS_QUERY = "IPO OR market debut OR uplisting OR filed to go public stocks";
  const NASDAQ_IPO_CALENDAR_PAGE = "https://www.nasdaq.com/market-activity/ipos";
  const TRADINGVIEW_TOP_GAINERS_PAGE = "https://www.tradingview.com/markets/stocks-usa/market-movers-gainers/";
  const STOCK_ANALYSIS_GAINERS_PAGE = "https://stockanalysis.com/markets/gainers/";
  const STOCK_ANALYSIS_ACTIVE_PAGE = "https://stockanalysis.com/markets/active/";
  const PRIORITY_NEWS_SITES = [
    "reuters.com",
    "cnbc.com",
    "bloomberg.com",
    "marketwatch.com",
    "finance.yahoo.com",
    "seekingalpha.com"
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
  const YAHOO_SYMBOL_OVERRIDES = {
    "NASDAQ:ALM": "ALM",
    "NASDAQ:AAPL": "AAPL",
    "NASDAQ:MSFT": "MSFT",
    "NASDAQ:NVDA": "NVDA",
    "NASDAQ:TSLA": "TSLA",
    "NASDAQ:AMZN": "AMZN",
    "NASDAQ:META": "META",
    "NASDAQ:GOOGL": "GOOGL",
    "NASDAQ:AMD": "AMD",
    "NASDAQ:MU": "MU",
    "NASDAQ:AVGO": "AVGO",
    "NASDAQ:QCOM": "QCOM",
    "NASDAQ:HOOD": "HOOD",
    "NASDAQ:HIMS": "HIMS",
    "NASDAQ:TEM": "TEM",
    "NASDAQ:CRDO": "CRDO",
    "NYSE:PLTR": "PLTR",
    "NYSE:RKLB": "RKLB",
    "NYSE:CCJ": "CCJ",
    "NYSE:JPM": "JPM",
    "NYSE:XOM": "XOM",
    "NYSE:LLY": "LLY",
    "AMEX:SMH": "SMH",
    "AMEX:SPY": "SPY",
    "FOREXCOM:NSXUSD": "^IXIC",
    "FOREXCOM:SPXUSD": "^GSPC",
    "FOREXCOM:DJI": "^DJI",
    "TVC:GOLD": "GC=F",
    "BITSTAMP:BTCUSD": "BTC-USD"
  };
  const DISCOVERY_UNIVERSE = [
    { symbol: "NASDAQ:ALM", ticker: "ALM", name: "Almonty Industries Inc." },
    { symbol: "NASDAQ:NVDA", ticker: "NVDA", name: "NVIDIA Corporation" },
    { symbol: "NASDAQ:AAPL", ticker: "AAPL", name: "Apple Inc." },
    { symbol: "NASDAQ:MSFT", ticker: "MSFT", name: "Microsoft Corporation" },
    { symbol: "NASDAQ:AMZN", ticker: "AMZN", name: "Amazon.com, Inc." },
    { symbol: "NASDAQ:META", ticker: "META", name: "Meta Platforms, Inc." },
    { symbol: "NASDAQ:GOOGL", ticker: "GOOGL", name: "Alphabet Inc." },
    { symbol: "NASDAQ:AMD", ticker: "AMD", name: "Advanced Micro Devices, Inc." },
    { symbol: "NASDAQ:MU", ticker: "MU", name: "Micron Technology, Inc." },
    { symbol: "NASDAQ:AVGO", ticker: "AVGO", name: "Broadcom Inc." },
    { symbol: "NASDAQ:QCOM", ticker: "QCOM", name: "QUALCOMM Incorporated" },
    { symbol: "NYSE:PLTR", ticker: "PLTR", name: "Palantir Technologies Inc." },
    { symbol: "NASDAQ:TSLA", ticker: "TSLA", name: "Tesla, Inc." },
    { symbol: "NASDAQ:HOOD", ticker: "HOOD", name: "Robinhood Markets, Inc." },
    { symbol: "NASDAQ:HIMS", ticker: "HIMS", name: "Hims & Hers Health, Inc." },
    { symbol: "NYSE:RKLB", ticker: "RKLB", name: "Rocket Lab USA, Inc." },
    { symbol: "NASDAQ:TEM", ticker: "TEM", name: "Tempus AI, Inc." },
    { symbol: "NASDAQ:CRDO", ticker: "CRDO", name: "Credo Technology Group Holding Ltd" },
    { symbol: "NYSE:CCJ", ticker: "CCJ", name: "Cameco Corporation" },
    { symbol: "NYSE:JPM", ticker: "JPM", name: "JPMorgan Chase & Co." },
    { symbol: "NYSE:XOM", ticker: "XOM", name: "Exxon Mobil Corporation" },
    { symbol: "NYSE:LLY", ticker: "LLY", name: "Eli Lilly and Company" },
    { symbol: "AMEX:SMH", ticker: "SMH", name: "VanEck Semiconductor ETF" }
  ];
  const CHART_REQUESTS = {
    intraday: { interval: "5m", range: "1d" },
    longTerm: { interval: "1d", range: "1y" }
  };

  const scanTimerNode = document.querySelector("[data-discovery-scan-timer]");
  const newsTimerNode = document.querySelector("[data-discovery-news-timer]");
  const openForm = document.querySelector("[data-discovery-open-form]");
  const openInput = document.querySelector("[data-discovery-open-input]");
  const summaryUniverseNode = document.querySelector("[data-discovery-universe-count]");
  const summaryMoverNode = document.querySelector("[data-discovery-summary-mover]");
  const summaryActiveNode = document.querySelector("[data-discovery-summary-active]");
  const summaryPullbackNode = document.querySelector("[data-discovery-summary-pullback]");
  const summaryEarningsNode = document.querySelector("[data-discovery-summary-earnings]");
  const summaryValueNode = document.querySelector("[data-discovery-summary-value]");
  const newsNoteNode = document.querySelector("[data-discovery-news-note]");
  const newsListNode = document.querySelector("[data-discovery-news-list]");
  const listNodes = {
    movers: document.querySelector('[data-discovery-list="movers"]'),
    active: document.querySelector('[data-discovery-list="active"]'),
    earnings: document.querySelector('[data-discovery-list="earnings"]'),
    pullback: document.querySelector('[data-discovery-list="pullback"]'),
    value: document.querySelector('[data-discovery-list="value"]'),
    ipo: document.querySelector('[data-discovery-list="ipo"]'),
    focus: document.querySelector('[data-discovery-list="focus"]')
  };

  const newsCache = new Map();
  let currentPanels = {
    movers: [],
    active: [],
    earnings: [],
    pullback: [],
    value: [],
    ipo: [],
    focus: []
  };
  let lastScanRefreshAt = 0;
  let lastNewsRefreshAt = 0;
  let lastLongTermRefreshAt = 0;
  let scanIntervalId = null;
  let newsIntervalId = null;
  let countdownIntervalId = null;
  let longTermSnapshotCache = new Map();

  function clearNode(node) {
    if (!node) {
      return;
    }

    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }
  }

  function getShortTicker(symbol) {
    return symbol.includes(":") ? symbol.split(":").slice(1).join(":") : symbol;
  }

  function getYahooSymbol(symbol) {
    return YAHOO_SYMBOL_OVERRIDES[symbol] || getShortTicker(symbol);
  }

  function buildMirrorUrl(symbol, interval, range) {
    const yahooSymbol = encodeURIComponent(getYahooSymbol(symbol));
    const upstream = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=${interval}&range=${range}`;
    return `${MIRROR_PREFIX}${upstream}`;
  }

  function buildTradingViewTopGainersMirrorUrl() {
    return `${MIRROR_PREFIX}${TRADINGVIEW_TOP_GAINERS_PAGE}`;
  }

  function buildStockAnalysisGainersMirrorUrl() {
    return `${MIRROR_PREFIX}${STOCK_ANALYSIS_GAINERS_PAGE}`;
  }

  function buildStockAnalysisActiveMirrorUrl() {
    return `${MIRROR_PREFIX}${STOCK_ANALYSIS_ACTIVE_PAGE}`;
  }

  function buildNasdaqIpoCalendarMirrorUrl(monthKey) {
    const upstream = `https://api.nasdaq.com/api/ipo/calendar?date=${monthKey}`;
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

  async function fetchTextWithTimeout(url, timeoutMs = QUOTE_TIMEOUT_MS) {
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

  async function fetchPageMirrorText(url, timeoutMs = FETCH_TIMEOUT_MS) {
    const loaders = [
      () => fetchTextWithTimeout(url, timeoutMs),
      () => fetchTextWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`, timeoutMs),
      () => fetchJsonWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, timeoutMs)
        .then((payload) => payload?.contents || "")
    ];

    let lastError = null;

    for (const load of loaders) {
      try {
        const text = await load();
        if (typeof text === "string" && text.trim()) {
          return text;
        }
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Page mirror is unavailable");
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

  async function fetchChartResult(symbol, interval, range) {
    const mirrorUrl = buildMirrorUrl(symbol, interval, range);
    const candidateRequests = [
      () => fetchJsonWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(mirrorUrl)}`),
      () => fetchTextWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(mirrorUrl)}`),
      () => fetchTextWithTimeout(mirrorUrl)
    ];

    let lastError = null;

    for (const runRequest of candidateRequests) {
      try {
        const payload = extractMirrorJson(await runRequest());
        const result = payload?.chart?.result?.[0];
        if (result) {
          return result;
        }
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("Chart data is unavailable");
  }

  async function fetchNasdaqIpoCalendar(monthKey) {
    const payload = extractMirrorJson(await fetchTextWithTimeout(buildNasdaqIpoCalendarMirrorUrl(monthKey), FETCH_TIMEOUT_MS));
    return {
      upcoming: payload?.data?.upcoming?.upcomingTable?.rows || [],
      priced: payload?.data?.priced?.rows || [],
      filed: payload?.data?.filed?.rows || [],
      lastUpdated: payload?.data?.upcoming?.lastUpdatedTime || ""
    };
  }

  function decodeHtml(value) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(value || "", "text/html");
    return doc.documentElement.textContent || "";
  }

  function buildGoogleNewsRssUrl(query) {
    return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  }

  function buildRssProxyUrl(rssUrl) {
    return `${RSS2JSON_API}${encodeURIComponent(rssUrl)}`;
  }

  async function fetchRssFeed(rssUrl, limit, sourceOverride = "", timeoutMs = NEWS_TIMEOUT_MS) {
    const cacheKey = `${rssUrl}::${limit}::${sourceOverride}`;
    const cached = newsCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < NEWS_CACHE_TTL_MS) {
      return cached.items;
    }

    const payload = await fetchJsonWithTimeout(buildRssProxyUrl(rssUrl), timeoutMs);
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
      ].forEach((key) => url.searchParams.delete(key));

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

    if (source.includes("marketwatch") || source.includes("wall street journal") || source.includes("wsj")) {
      return 4;
    }

    if (source.includes("seeking alpha") || source.includes("fox business") || source.includes("investing.com")) {
      return 3;
    }

    if (source.includes("yahoo")) {
      return 2;
    }

    return 1;
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
      const linkKey = normalizeNewsUrl(item.link);
      const titleKey = normalizeNewsTitle(item.title);

      if (!item.title || (linkKey && seenLinks.has(linkKey)) || (titleKey && seenTitles.has(titleKey))) {
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

  function getTrailingClose(points, sessionsAgo) {
    let seen = 0;

    for (let index = points.length - 1; index >= 0; index -= 1) {
      const close = Number(points[index]?.close);
      if (!Number.isFinite(close)) {
        continue;
      }

      if (seen === sessionsAgo) {
        return close;
      }

      seen += 1;
    }

    return null;
  }

  function average(values) {
    const filtered = values.filter((value) => Number.isFinite(value));
    if (!filtered.length) {
      return null;
    }

    return filtered.reduce((sum, value) => sum + value, 0) / filtered.length;
  }

  function parseCompactNumber(value) {
    const normalized = String(value || "")
      .replace(/,/g, "")
      .trim()
      .toUpperCase();

    if (!normalized || normalized === "—" || normalized === "--") {
      return null;
    }

    const match = normalized.match(/^(-?\d+(?:\.\d+)?)([KMBT])?$/);
    if (!match) {
      const numeric = Number(normalized);
      return Number.isFinite(numeric) ? numeric : null;
    }

    const base = Number(match[1]);
    const multiplier = {
      K: 1e3,
      M: 1e6,
      B: 1e9,
      T: 1e12
    }[match[2] || ""] || 1;

    return Number.isFinite(base) ? base * multiplier : null;
  }

  function extractMarkdownLinkText(value) {
    const match = String(value || "").match(/\[([^\]]+)\]\([^)]+\)/);
    return match ? match[1].trim() : String(value || "").trim();
  }

  function parseMarkdownTableCells(line) {
    return String(line || "")
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
  }

  function computePercentChange(current, previous) {
    if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
      return null;
    }

    return ((current - previous) / previous) * 100;
  }

  function buildIntradaySnapshot(definition, result) {
    const points = toChartPoints(result);
    if (!points.length) {
      return null;
    }

    const meta = result.meta || {};
    const currentPrice = Number.isFinite(Number(meta.regularMarketPrice))
      ? Number(meta.regularMarketPrice)
      : points[points.length - 1].close;
    const previousClose = Number.isFinite(Number(meta.chartPreviousClose))
      ? Number(meta.chartPreviousClose)
      : Number.isFinite(Number(meta.previousClose))
        ? Number(meta.previousClose)
        : points[0].open;
    const changePercent = computePercentChange(currentPrice, previousClose);
    const changeValue = Number.isFinite(changePercent) ? currentPrice - previousClose : null;
    const totalVolume = points.reduce((sum, point) => sum + (Number.isFinite(point.volume) ? point.volume : 0), 0);
    const dayHigh = Math.max(...points.map((point) => point.high));
    const dayLow = Math.min(...points.map((point) => point.low));

    return {
      ...definition,
      currentPrice,
      previousClose,
      changePercent,
      changeValue,
      volume: totalVolume,
      dollarVolume: Number.isFinite(currentPrice) ? currentPrice * totalVolume : null,
      dayHigh,
      dayLow,
      lastTimestamp: points[points.length - 1].time
    };
  }

  function buildLongTermSnapshot(definition, result) {
    const points = toChartPoints(result);
    if (!points.length) {
      return null;
    }

    const meta = result.meta || {};
    const currentPrice = Number.isFinite(Number(meta.regularMarketPrice))
      ? Number(meta.regularMarketPrice)
      : points[points.length - 1].close;
    const fiftyTwoWeekHigh = Math.max(...points.map((point) => point.high));
    const fiftyTwoWeekLow = Math.min(...points.map((point) => point.low));
    const oneMonthClose = getTrailingClose(points, 21);
    const threeMonthClose = getTrailingClose(points, 63);
    const sixMonthClose = getTrailingClose(points, 126);
    const avgDailyVolume = average(points.slice(-20).map((point) => point.volume));
    const moving20 = average(points.slice(-20).map((point) => point.close));

    return {
      ...definition,
      fiftyTwoWeekHigh,
      fiftyTwoWeekLow,
      discountToHigh: Number.isFinite(fiftyTwoWeekHigh) && fiftyTwoWeekHigh > 0
        ? ((fiftyTwoWeekHigh - currentPrice) / fiftyTwoWeekHigh) * 100
        : null,
      distanceFromLow: Number.isFinite(fiftyTwoWeekLow) && fiftyTwoWeekLow > 0
        ? ((currentPrice - fiftyTwoWeekLow) / fiftyTwoWeekLow) * 100
        : null,
      oneMonthReturn: computePercentChange(currentPrice, oneMonthClose),
      threeMonthReturn: computePercentChange(currentPrice, threeMonthClose),
      sixMonthReturn: computePercentChange(currentPrice, sixMonthClose),
      avgDailyVolume,
      moving20
    };
  }

  function mergeSnapshots(intradaySnapshots, longTermSnapshots) {
    const merged = new Map();

    intradaySnapshots.forEach((snapshot) => {
      if (snapshot) {
        merged.set(snapshot.symbol, { ...snapshot });
      }
    });

    longTermSnapshots.forEach((snapshot) => {
      if (!snapshot) {
        return;
      }

      merged.set(snapshot.symbol, {
        ...(merged.get(snapshot.symbol) || {}),
        ...snapshot
      });
    });

    return Array.from(merged.values()).filter((snapshot) => Number.isFinite(snapshot.currentPrice));
  }

  function collectOpportunityCandidates(...collections) {
    const merged = new Map();

    collections.flat().forEach((item) => {
      if (!item) {
        return;
      }

      const rawSymbol = String(item.symbol || item.ticker || "").trim();
      if (!rawSymbol) {
        return;
      }

      const ticker = (item.ticker || getShortTicker(rawSymbol)).toUpperCase();
      const existing = merged.get(ticker) || {
        symbol: rawSymbol,
        ticker,
        name: item.name || item.nameText || ticker
      };
      const preferredSymbol = rawSymbol.includes(":") ? rawSymbol : existing.symbol;

      merged.set(ticker, {
        ...existing,
        ...item,
        symbol: preferredSymbol || rawSymbol,
        ticker,
        name: item.name || item.nameText || existing.name || ticker
      });
    });

    return Array.from(merged.values());
  }

  async function fetchLongTermSnapshots(definitions, forceRefresh = false) {
    const deduped = collectOpportunityCandidates(definitions).map(({ symbol, ticker, name }) => ({
      symbol,
      ticker,
      name
    }));

    const missingDefinitions = deduped.filter((definition) => forceRefresh || !longTermSnapshotCache.has(definition.symbol));

    if (missingDefinitions.length) {
      const settled = await Promise.allSettled(
        missingDefinitions.map((definition) =>
          fetchChartResult(definition.symbol, CHART_REQUESTS.longTerm.interval, CHART_REQUESTS.longTerm.range)
            .then((result) => buildLongTermSnapshot(definition, result))
        )
      );

      settled
        .filter((result) => result.status === "fulfilled" && result.value)
        .forEach((result) => {
          longTermSnapshotCache.set(result.value.symbol, result.value);
        });
    }

    return deduped
      .map((definition) => longTermSnapshotCache.get(definition.symbol) || null)
      .filter(Boolean);
  }

  function formatCountdownLabel(milliseconds) {
    if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
      return "Now";
    }

    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes > 0) {
      return seconds === 0 ? `${minutes} min` : `${minutes} min ${seconds} sec`;
    }

    return `${totalSeconds} sec`;
  }

  function updateCountdowns() {
    if (scanTimerNode) {
      const scanRemaining = Math.min(
        DISCOVERY_SCAN_REFRESH_MS - (Date.now() - lastScanRefreshAt),
        DISCOVERY_LONG_TERM_REFRESH_MS - (Date.now() - lastLongTermRefreshAt)
      );
      scanTimerNode.textContent = formatCountdownLabel(scanRemaining);
    }

    if (newsTimerNode) {
      newsTimerNode.textContent = formatCountdownLabel(
        DISCOVERY_NEWS_REFRESH_MS - (Date.now() - lastNewsRefreshAt)
      );
    }
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
      timeZone: NEWS_TIMEZONE,
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(date)} ET`;
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

  function formatVolume(value) {
    if (!Number.isFinite(value)) {
      return "--";
    }

    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2
    }).format(value);
  }

  function formatDollarVolume(value) {
    if (!Number.isFinite(value)) {
      return "--";
    }

    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 1
    }).format(value);
  }

  function formatPercent(value) {
    if (!Number.isFinite(value)) {
      return "--";
    }

    const prefix = value > 0 ? "+" : "";
    return `${prefix}${value.toFixed(2)}%`;
  }

  function getTrendClass(value) {
    if (!Number.isFinite(value) || value === 0) {
      return "change-flat";
    }

    return value > 0 ? "change-up" : "change-down";
  }

  function renderScannerEmpty(node, message) {
    if (!node) {
      return;
    }

    clearNode(node);
    const row = document.createElement("li");
    row.className = "scanner-empty";
    row.textContent = message;
    node.appendChild(row);
  }

  function createScannerRow(item) {
    const row = document.createElement("a");
    row.className = "scanner-row";
    row.href = item.href || "#";

    if (item.external) {
      row.target = "_blank";
      row.rel = "noopener noreferrer";
    } else {
      row.rel = "noopener";
    }

    const top = document.createElement("div");
    top.className = "scanner-row-top";

    const symbol = document.createElement("span");
    symbol.className = "scanner-row-symbol";
    symbol.textContent = item.symbolLabel;

    const primary = document.createElement("span");
    primary.className = `scanner-row-primary ${item.primaryClass || ""}`.trim();
    primary.textContent = item.primaryText;

    const name = document.createElement("div");
    name.className = "scanner-row-name";
    name.textContent = item.nameText;

    const meta = document.createElement("div");
    meta.className = "scanner-row-meta";
    (item.metaParts || []).forEach((part) => {
      const span = document.createElement("span");
      span.textContent = part;
      meta.appendChild(span);
    });

    const footer = document.createElement("div");
    footer.className = "scanner-row-footer";
    (item.footerParts || []).forEach((part) => {
      const span = document.createElement("span");
      span.textContent = part;
      footer.appendChild(span);
    });

    top.append(symbol, primary);
    row.append(top, name, meta, footer);
    return row;
  }

  function renderScannerPanel(kind, items, emptyMessage) {
    const node = listNodes[kind];
    if (!node) {
      return;
    }

    if (!items.length) {
      renderScannerEmpty(node, emptyMessage);
      return;
    }

    clearNode(node);
    items.forEach((item) => {
      node.appendChild(createScannerRow(item));
    });
  }

  function renderNewsPanel(items) {
    if (!newsListNode) {
      return;
    }

    if (!items.length) {
      renderScannerEmpty(newsListNode, "Catalyst headlines could not be loaded right now.");
      return;
    }

    clearNode(newsListNode);

    items.forEach((item) => {
      const row = document.createElement("li");
      row.className = "scanner-row";

      const link = document.createElement("a");
      link.href = item.link || "#";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "scanner-row-name";
      link.textContent = item.title;

      const meta = document.createElement("div");
      meta.className = "scanner-row-meta";

      const source = document.createElement("span");
      source.textContent = item.source;

      const date = document.createElement("span");
      date.textContent = formatNewsDate(item.date);

      meta.append(source, date);
      row.append(link, meta);
      newsListNode.appendChild(row);
    });
  }

  function buildDashboardUrl(symbol) {
    return `stocks.html?symbol=${encodeURIComponent(symbol)}`;
  }

  function parseTradingViewMoverRows(text, limit) {
    const pattern = /(?:!\[Image[^\]]*\]\([^)]+\))?[A-Z]?\[([A-Z0-9.\-]+)\]\(https:\/\/www\.tradingview\.com\/symbols\/([A-Z]+)-([A-Z0-9.\-]+)\/[^)]*\)\[([^\]]+)\]\(https:\/\/www\.tradingview\.com\/symbols\/[A-Z]+-[A-Z0-9.\-]+\/[^)]*\)\s*D([+-]\d+(?:\.\d+)?)%([\d,]+(?:\.\d+)?)\s*USD\s*([\d,]+(?:\.\d+)?)\s*([KMBT])?/g;
    const rows = [];
    const seen = new Set();
    const sourceText = String(text || "").replace(/\s+/g, " ");
    let match = pattern.exec(sourceText);

    while (match && rows.length < limit) {
      const [, displayedTicker, exchange, urlTicker, name, changeText, priceText, volumeBase, volumeSuffix = ""] = match;
      const ticker = displayedTicker || urlTicker;
      const symbol = `${exchange}:${ticker}`;

      if (!seen.has(symbol)) {
        seen.add(symbol);

        const changePercent = Number(changeText);
        const currentPrice = Number(priceText.replace(/,/g, ""));
        const volume = parseCompactNumber(`${volumeBase}${volumeSuffix}`);
        const dollarVolume = Number.isFinite(currentPrice) && Number.isFinite(volume) ? currentPrice * volume : null;

        rows.push({
          symbol,
          ticker,
          name,
          exchange,
          changePercent,
          currentPrice,
          volume,
          dollarVolume,
          symbolLabel: ticker,
          primaryText: `${formatPercent(changePercent)} · ${formatPrice(currentPrice)}`,
          primaryClass: getTrendClass(changePercent),
          nameText: name,
          metaParts: [
            `${exchange}`,
            Number.isFinite(volume) ? `${formatVolume(volume)} shares` : "Volume --"
          ],
          footerParts: [
            Number.isFinite(dollarVolume) ? `${formatDollarVolume(dollarVolume)} $vol` : "Dollar volume --",
            "Open dashboard"
          ],
          href: buildDashboardUrl(symbol)
        });
      }

      match = pattern.exec(sourceText);
    }

    return rows;
  }

  function parseStockAnalysisGainerRows(text, limit) {
    const rows = String(text || "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^\|\s*\d+\s*\|/.test(line));
    const parsed = [];

    for (const line of rows) {
      const cells = parseMarkdownTableCells(line);
      if (cells.length < 7) {
        continue;
      }

      const ticker = extractMarkdownLinkText(cells[1]).toUpperCase();
      const name = cells[2];
      const changePercent = Number(cells[3].replace(/[%+,]/g, ""));
      const currentPrice = Number(cells[4].replace(/,/g, ""));
      const volume = parseCompactNumber(cells[5]);
      const dollarVolume = Number.isFinite(currentPrice) && Number.isFinite(volume) ? currentPrice * volume : null;
      const marketCapText = cells[6];

      if (!ticker || !Number.isFinite(changePercent) || !Number.isFinite(currentPrice)) {
        continue;
      }

      parsed.push({
        symbol: ticker,
        ticker,
        name,
        currentPrice,
        volume,
        dollarVolume,
        changePercent,
        symbolLabel: ticker,
        primaryText: `${formatPercent(changePercent)} · ${formatPrice(currentPrice)}`,
        primaryClass: getTrendClass(changePercent),
        nameText: name,
        metaParts: [
          Number.isFinite(volume) ? `${formatVolume(volume)} shares` : "Volume --",
          marketCapText.trim()
        ],
        footerParts: [
          Number.isFinite(dollarVolume) ? `${formatDollarVolume(dollarVolume)} $vol` : "Dollar volume --",
          "Open dashboard"
        ],
        href: buildDashboardUrl(ticker)
      });

      if (parsed.length >= limit) {
        break;
      }
    }

    return parsed;
  }

  async function fetchTopMoverRows(limit) {
    let tradingViewError = null;
    try {
      const tradingViewText = await fetchPageMirrorText(buildTradingViewTopGainersMirrorUrl(), FETCH_TIMEOUT_MS);
      const tradingViewRows = parseTradingViewMoverRows(tradingViewText, limit);
      if (tradingViewRows.length) {
        return tradingViewRows;
      }
    } catch (error) {
      tradingViewError = error;
      // Fall through to StockAnalysis mirror parsing.
    }

    const stockAnalysisText = await fetchPageMirrorText(buildStockAnalysisGainersMirrorUrl(), FETCH_TIMEOUT_MS);
    const stockAnalysisRows = parseStockAnalysisGainerRows(stockAnalysisText, limit);
    if (stockAnalysisRows.length) {
      return stockAnalysisRows;
    }

    throw tradingViewError || new Error("Top mover feeds returned no rows");
  }

  function parseStockAnalysisActiveRows(text, limit) {
    const rows = String(text || "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("|"));
    const parsed = [];

    for (const line of rows) {
      const match = line.match(/^\|\s*\d+\s*\|\s*\[([A-Z0-9.\-]+)\]\((https:\/\/stockanalysis\.com\/stocks\/[^)]+)\)\s*\|\s*([^|]+?)\s*\|\s*([\d,]+)\s*\|\s*([\d.]+)\s*\|\s*([+-]?\d+(?:\.\d+)?)%\s*\|\s*([^|]+?)\s*\|$/);
      if (!match) {
        continue;
      }

      const [, ticker, , name, volumeText, priceText, changeText, marketCapText] = match;
      const currentPrice = Number(priceText.replace(/,/g, ""));
      const volume = parseCompactNumber(volumeText);
      const dollarVolume = Number.isFinite(currentPrice) && Number.isFinite(volume) ? currentPrice * volume : null;
      const changePercent = Number(changeText);

      parsed.push({
        symbol: ticker,
        ticker,
        name,
        currentPrice,
        volume,
        dollarVolume,
        changePercent,
        symbolLabel: ticker,
        primaryText: `${formatVolume(volume)} · ${formatPrice(currentPrice)}`,
        primaryClass: getTrendClass(changePercent),
        nameText: name,
        metaParts: [
          `${formatPercent(changePercent)}`,
          marketCapText.trim()
        ],
        footerParts: [
          Number.isFinite(dollarVolume) ? `${formatDollarVolume(dollarVolume)} $vol` : "Dollar volume --",
          "Open dashboard"
        ],
        href: buildDashboardUrl(ticker)
      });

      if (parsed.length >= limit) {
        break;
      }
    }

    return parsed;
  }

  async function fetchBroadActiveRows(limit) {
    const text = await fetchPageMirrorText(buildStockAnalysisActiveMirrorUrl(), FETCH_TIMEOUT_MS);
    return parseStockAnalysisActiveRows(text, limit);
  }

  function buildActiveRows(snapshots) {
    return snapshots
      .filter((snapshot) =>
        Number.isFinite(snapshot.currentPrice) &&
        snapshot.currentPrice >= 2 &&
        Number.isFinite(snapshot.dollarVolume) &&
        snapshot.dollarVolume >= 50e6
      )
      .sort((left, right) => (right.dollarVolume || 0) - (left.dollarVolume || 0))
      .slice(0, 10)
      .map((snapshot) => ({
        symbolLabel: snapshot.ticker,
        primaryText: `${formatDollarVolume(snapshot.dollarVolume)} · ${formatPrice(snapshot.currentPrice)}`,
        primaryClass: getTrendClass(snapshot.changeValue),
        nameText: snapshot.name,
        metaParts: [
          `${formatVolume(snapshot.volume)} shares`,
          Number.isFinite(snapshot.changePercent) ? formatPercent(snapshot.changePercent) : "--"
        ],
        footerParts: [
          Number.isFinite(snapshot.dayHigh) && Number.isFinite(snapshot.dayLow)
            ? `${formatPrice(snapshot.dayLow)}-${formatPrice(snapshot.dayHigh)}`
            : "Range --",
          "Open dashboard"
        ],
        href: buildDashboardUrl(snapshot.symbol)
      }));
  }

  function buildPullbackRows(snapshots) {
    const candidates = snapshots
      .filter((snapshot) =>
        Number.isFinite(snapshot.currentPrice) &&
        snapshot.currentPrice >= 2 &&
        Number.isFinite(snapshot.discountToHigh) &&
        snapshot.discountToHigh >= 5 &&
        snapshot.discountToHigh <= 45 &&
        Number.isFinite(snapshot.oneMonthReturn) &&
        snapshot.oneMonthReturn >= -8 &&
        Number.isFinite(snapshot.moving20) &&
        snapshot.currentPrice >= snapshot.moving20 * 0.95 &&
        Number.isFinite(snapshot.avgDailyVolume) &&
        snapshot.avgDailyVolume >= 100000
      );
    const rankedPool = candidates.length
      ? candidates
      : snapshots.filter((snapshot) =>
        Number.isFinite(snapshot.currentPrice) &&
        snapshot.currentPrice >= 2 &&
        Number.isFinite(snapshot.discountToHigh) &&
        Number.isFinite(snapshot.oneMonthReturn)
      );

    const strictCandidates = rankedPool.filter((snapshot) =>
      snapshot.discountToHigh >= 10 &&
      snapshot.discountToHigh <= 30 &&
      snapshot.oneMonthReturn >= 0 &&
      snapshot.currentPrice >= snapshot.moving20
    );

    const rankedCandidates = (strictCandidates.length ? strictCandidates : rankedPool)
      .sort((left, right) => {
        const leftScore = (left.oneMonthReturn || 0) + (left.currentPrice >= left.moving20 ? 6 : 0) - Math.abs((left.discountToHigh || 0) - 15);
        const rightScore = (right.oneMonthReturn || 0) + (right.currentPrice >= right.moving20 ? 6 : 0) - Math.abs((right.discountToHigh || 0) - 15);
        if (rightScore !== leftScore) {
          return rightScore - leftScore;
        }

        return (right.avgDailyVolume || 0) - (left.avgDailyVolume || 0);
      })
      .slice(0, 10);

    return rankedCandidates
      .map((snapshot) => ({
        symbol: snapshot.symbol,
        ticker: snapshot.ticker,
        name: snapshot.name,
        currentPrice: snapshot.currentPrice,
        changePercent: snapshot.changePercent,
        dollarVolume: snapshot.dollarVolume,
        discountToHigh: snapshot.discountToHigh,
        oneMonthReturn: snapshot.oneMonthReturn,
        symbolLabel: snapshot.ticker,
        primaryText: `1M ${formatPercent(snapshot.oneMonthReturn)} · ${snapshot.discountToHigh.toFixed(1)}% off high`,
        primaryClass: "change-up",
        nameText: snapshot.name,
        metaParts: [
          `52W H ${formatPrice(snapshot.fiftyTwoWeekHigh)}`,
          snapshot.currentPrice >= snapshot.moving20 ? "Above 20D avg" : "Near 20D avg"
        ],
        footerParts: [
          `Now ${formatPrice(snapshot.currentPrice)}`,
          "Open dashboard"
        ],
        href: buildDashboardUrl(snapshot.symbol)
      }));
  }

  function buildValueRows(snapshots) {
    const candidates = snapshots
      .filter((snapshot) =>
        Number.isFinite(snapshot.currentPrice) &&
        snapshot.currentPrice >= 2 &&
        Number.isFinite(snapshot.discountToHigh) &&
        snapshot.discountToHigh >= 12 &&
        Number.isFinite(snapshot.distanceFromLow) &&
        snapshot.distanceFromLow >= 5 &&
        Number.isFinite(snapshot.oneMonthReturn) &&
        snapshot.oneMonthReturn >= -10 &&
        Number.isFinite(snapshot.sixMonthReturn) &&
        snapshot.sixMonthReturn >= -25 &&
        Number.isFinite(snapshot.avgDailyVolume) &&
        snapshot.avgDailyVolume >= 100000
      );
    const rankedPool = candidates.length
      ? candidates
      : snapshots.filter((snapshot) =>
        Number.isFinite(snapshot.currentPrice) &&
        snapshot.currentPrice >= 2 &&
        Number.isFinite(snapshot.discountToHigh) &&
        Number.isFinite(snapshot.distanceFromLow)
      );

    const strictCandidates = rankedPool.filter((snapshot) =>
      snapshot.discountToHigh >= 18 &&
      snapshot.distanceFromLow >= 10 &&
      snapshot.oneMonthReturn >= -5 &&
      snapshot.sixMonthReturn >= -15
    );

    const rankedCandidates = (strictCandidates.length ? strictCandidates : rankedPool)
      .sort((left, right) => {
        const leftScore = (left.discountToHigh || 0) + (left.distanceFromLow || 0) * 0.35 + (left.currentPrice >= left.moving20 ? 5 : 0) - Math.max(0, -(left.oneMonthReturn || 0));
        const rightScore = (right.discountToHigh || 0) + (right.distanceFromLow || 0) * 0.35 + (right.currentPrice >= right.moving20 ? 5 : 0) - Math.max(0, -(right.oneMonthReturn || 0));
        if (rightScore !== leftScore) {
          return rightScore - leftScore;
        }

        return (right.avgDailyVolume || 0) - (left.avgDailyVolume || 0);
      })
      .slice(0, 10);

    return rankedCandidates
      .map((snapshot) => ({
        symbol: snapshot.symbol,
        ticker: snapshot.ticker,
        name: snapshot.name,
        currentPrice: snapshot.currentPrice,
        changePercent: snapshot.changePercent,
        dollarVolume: snapshot.dollarVolume,
        discountToHigh: snapshot.discountToHigh,
        oneMonthReturn: snapshot.oneMonthReturn,
        sixMonthReturn: snapshot.sixMonthReturn,
        symbolLabel: snapshot.ticker,
        primaryText: `${snapshot.discountToHigh.toFixed(1)}% off high · ${formatPrice(snapshot.currentPrice)}`,
        primaryClass: "change-flat",
        nameText: snapshot.name,
        metaParts: [
          `1M ${formatPercent(snapshot.oneMonthReturn)}`,
          `6M ${formatPercent(snapshot.sixMonthReturn)}`
        ],
        footerParts: [
          `52W L ${formatPrice(snapshot.fiftyTwoWeekLow)}`,
          "Open dashboard"
        ],
        href: buildDashboardUrl(snapshot.symbol)
      }));
  }

  function buildFocusRows() {
    const buckets = [
      { label: "Mover", items: currentPanels.movers, weight: 6 },
      { label: "Active", items: currentPanels.active, weight: 5 },
      { label: "Pullback", items: currentPanels.pullback, weight: 4 },
      { label: "Value", items: currentPanels.value, weight: 4 },
      {
        label: "Earnings",
        items: currentPanels.earnings
          .filter((item) => item?.tickerLabel && item.tickerLabel !== "EARN")
          .map((item) => ({
            symbol: item.tickerLabel,
            ticker: item.tickerLabel,
            name: item.title,
            href: buildDashboardUrl(item.tickerLabel)
          })),
        weight: 3
      },
      {
        label: "IPO",
        items: currentPanels.ipo
          .filter((item) => item?.symbolLabel && item.symbolLabel !== "IPO")
          .map((item) => ({
            symbol: item.symbol || item.symbolLabel,
            ticker: item.ticker || getShortTicker(item.symbol || item.symbolLabel),
            name: item.name || item.nameText || item.symbolLabel,
            href: item.href || buildDashboardUrl(item.symbol || item.symbolLabel)
          })),
        weight: 2
      }
    ];

    const merged = new Map();

    buckets.forEach((bucket) => {
      bucket.items.slice(0, 10).forEach((item, index) => {
        const rawSymbol = item?.symbol || item?.ticker || item?.symbolLabel || item?.tickerLabel || "";
        if (!rawSymbol) {
          return;
        }

        const symbol = String(rawSymbol).trim();
        const ticker = getShortTicker(symbol);

        if (!ticker || ticker === "EARN" || ticker === "IPO") {
          return;
        }

        const entry = merged.get(ticker) || {
          symbol,
          ticker,
          name: item.name || item.nameText || item.title || ticker,
          href: item.href || buildDashboardUrl(symbol),
          currentPrice: null,
          changePercent: null,
          dollarVolume: null,
          score: 0,
          tags: []
        };

        entry.symbol = entry.symbol || symbol;
        entry.name = entry.name || item.name || item.nameText || item.title || ticker;
        entry.href = entry.href || item.href || buildDashboardUrl(symbol);

        if (Number.isFinite(item.currentPrice)) {
          entry.currentPrice = item.currentPrice;
        }
        if (Number.isFinite(item.changePercent)) {
          entry.changePercent = item.changePercent;
        }
        if (Number.isFinite(item.dollarVolume)) {
          entry.dollarVolume = item.dollarVolume;
        }

        entry.score += bucket.weight * Math.max(1, 6 - index);
        if (!entry.tags.includes(bucket.label)) {
          entry.tags.push(bucket.label);
        }

        merged.set(ticker, entry);
      });
    });

    return Array.from(merged.values())
      .sort((left, right) => {
        const scoreDelta = (right.score || 0) - (left.score || 0);
        if (scoreDelta !== 0) {
          return scoreDelta;
        }

        const dollarVolumeDelta = (right.dollarVolume || 0) - (left.dollarVolume || 0);
        if (dollarVolumeDelta !== 0) {
          return dollarVolumeDelta;
        }

        return (right.changePercent || 0) - (left.changePercent || 0);
      })
      .slice(0, 10)
      .map((entry) => {
        const tagLabel = entry.tags.slice(0, 2).join(" + ");
        const overflowTag = entry.tags.length > 2 ? " +" : "";
        const leadMetric = Number.isFinite(entry.changePercent)
          ? formatPercent(entry.changePercent)
          : Number.isFinite(entry.currentPrice)
            ? formatPrice(entry.currentPrice)
            : `${entry.score} pts`;

        return {
          ...entry,
          symbolLabel: entry.ticker,
          primaryText: `${leadMetric} · ${tagLabel}${overflowTag}`,
          primaryClass: getTrendClass(entry.changePercent),
          nameText: entry.name,
          metaParts: [
            Number.isFinite(entry.currentPrice) ? `Price ${formatPrice(entry.currentPrice)}` : "Catalyst signal",
            Number.isFinite(entry.dollarVolume) ? `${formatDollarVolume(entry.dollarVolume)} $vol` : "Watchlist"
          ],
          footerParts: [
            `Score ${entry.score}`,
            "Open dashboard"
          ]
        };
      });
  }

  function buildPublisherQueries(baseQuery) {
    return PRIORITY_NEWS_SITES.map((site) => `${baseQuery} site:${site}`);
  }

  function getFocusCandidates() {
    const leadLists = [
      ...currentPanels.movers.slice(0, 2),
      ...currentPanels.active.slice(0, 2),
      ...currentPanels.pullback.slice(0, 2),
      ...currentPanels.value.slice(0, 2)
    ];
    const seen = new Set();

    return leadLists
      .filter((item) => {
        const symbol = item?.symbol || item?.ticker;
        if (!symbol || seen.has(symbol)) {
          return false;
        }

        seen.add(symbol);
        return true;
      })
      .map((item) => ({
        symbol: item.symbol || item.ticker,
        ticker: item.ticker,
        name: item.name || item.company || item.nameText || item.ticker
      }));
  }

  function annotateFocusTicker(items, focusItems) {
    return items.map((item) => {
      const normalizedTitle = normalizeNewsTitle(item.title);
      const matched = focusItems.find((focus) => {
        const ticker = focus.ticker.toLowerCase();
        const name = normalizeNewsTitle(focus.name);
        return normalizedTitle.includes(ticker.toLowerCase()) || (name && normalizedTitle.includes(name));
      });

      return {
        ...item,
        tickerLabel: matched?.ticker || item.tickerLabel || ""
      };
    });
  }

  function keywordFilter(items, expression) {
    return items.filter((item) => expression.test(`${item.title} ${item.source}`));
  }

  async function fetchDiscoveryNews(limit) {
    const focusItems = getFocusCandidates().slice(0, 4);
    const loaders = [
      () => fetchRssFeed(buildGoogleNewsRssUrl(MARKET_NEWS_QUERY), limit * 2),
      ...buildPublisherQueries(MARKET_NEWS_QUERY).map((query) => () => fetchRssFeed(buildGoogleNewsRssUrl(query), limit)),
      ...focusItems.map((item) => () => fetchRssFeed(buildGoogleNewsRssUrl(`${item.name} OR ${item.ticker} stock`), Math.max(4, Math.ceil(limit / 2)))),
      ...DIRECT_MARKET_RSS_FEEDS.map((feed) => () => fetchRssFeed(feed.url, limit, feed.source))
    ];

    const settled = await Promise.allSettled(loaders.map((loader) => loader()));
    const items = settled
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value);

    return annotateFocusTicker(dedupeAndSortNews(items, limit), focusItems);
  }

  async function fetchEarningsRadar(limit) {
    const focusItems = getFocusCandidates().slice(0, 5);
    const loaders = [
      () => fetchRssFeed(buildGoogleNewsRssUrl(EARNINGS_NEWS_QUERY), limit * 2),
      ...buildPublisherQueries(EARNINGS_NEWS_QUERY).map((query) => () => fetchRssFeed(buildGoogleNewsRssUrl(query), limit)),
      ...focusItems.map((item) => () =>
        fetchRssFeed(
          buildGoogleNewsRssUrl(`${item.name} OR ${item.ticker} earnings OR guidance OR revenue OR EPS OR outlook`),
          Math.max(4, Math.ceil(limit / 2))
        ).then((items) => items.map((article) => ({ ...article, tickerLabel: item.ticker })))
      )
    ];

    const settled = await Promise.allSettled(loaders.map((loader) => loader()));
    const items = settled
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value);

    return keywordFilter(
      annotateFocusTicker(dedupeAndSortNews(items, limit * 2), focusItems),
      /(earnings|guidance|outlook|revenue|eps|results|forecast|preview)/i
    ).slice(0, limit);
  }

  async function fetchIpoWatch(limit) {
    const loaders = [
      () => fetchRssFeed(buildGoogleNewsRssUrl(IPO_NEWS_QUERY), limit * 2),
      ...buildPublisherQueries(IPO_NEWS_QUERY).map((query) => () => fetchRssFeed(buildGoogleNewsRssUrl(query), limit))
    ];

    const settled = await Promise.allSettled(loaders.map((loader) => loader()));
    const items = settled
      .filter((result) => result.status === "fulfilled")
      .flatMap((result) => result.value);

    return keywordFilter(
      dedupeAndSortNews(items, limit * 2),
      /(ipo|market debut|debut|listing|uplisting|go public|public offering|priced its ipo|files to go public)/i
    ).slice(0, limit);
  }

  function buildHeadlineRows(items, fallbackLabel) {
    return items.map((item) => ({
      symbolLabel: item.tickerLabel || fallbackLabel,
      primaryText: formatNewsDate(item.date),
      primaryClass: "",
      nameText: item.title,
      metaParts: [item.source],
      footerParts: [formatNewsDate(item.date), "Open"],
      href: item.link || "#",
      external: true
    }));
  }

  function buildIpoCalendarRows(calendar, limit) {
    const items = [];
    const pushRows = (rows, status, dateKey) => {
      rows.forEach((row) => {
        items.push({
          symbolLabel: row.proposedTickerSymbol || status.toUpperCase(),
          primaryText: `${row[dateKey] || "--"} · ${status}`,
          primaryClass: "",
          nameText: row.companyName || "Upcoming listing",
          metaParts: [
            row.proposedExchange || row.dollarValueOfSharesOffered || "Nasdaq IPO Calendar",
            row.proposedSharePrice ? `Price ${row.proposedSharePrice}` : (row.sharesOffered ? `${row.sharesOffered} shares` : "Listing")
          ],
          footerParts: [
            row.dollarValueOfSharesOffered || (row.sharesOffered ? `${row.sharesOffered} shares` : "EDGAR"),
            "Open"
          ],
          href: NASDAQ_IPO_CALENDAR_PAGE,
          external: true
        });
      });
    };

    pushRows(calendar.upcoming.slice(0, 4), "Upcoming", "expectedPriceDate");
    pushRows(calendar.priced.slice(0, 3), "Priced", "pricedDate");
    pushRows(calendar.filed.slice(0, 3), "Filed", "filedDate");
    return items.slice(0, limit);
  }

  function updateSummaryPanel(screenedCount) {
    if (summaryUniverseNode) {
      summaryUniverseNode.textContent = String(screenedCount);
    }

    if (summaryMoverNode) {
      const top = currentPanels.movers[0];
      summaryMoverNode.textContent = top ? `${top.ticker} ${formatPercent(top.changePercent)}` : "--";
    }

    if (summaryActiveNode) {
      const top = currentPanels.active[0];
      summaryActiveNode.textContent = top ? `${top.ticker} ${formatDollarVolume(top.dollarVolume)}` : "--";
    }

    if (summaryPullbackNode) {
      const top = currentPanels.pullback[0];
      summaryPullbackNode.textContent = top ? `${top.ticker} ${top.discountToHigh.toFixed(1)}% off` : "--";
    }

    if (summaryEarningsNode) {
      const top = currentPanels.earnings[0];
      summaryEarningsNode.textContent = top ? (top.tickerLabel || "News") : "--";
    }

    if (summaryValueNode) {
      const top = currentPanels.value[0];
      summaryValueNode.textContent = top ? `${top.ticker} ${top.discountToHigh.toFixed(1)}% off` : "--";
    }
  }

  async function fetchUniverseScans(forceLongTerm) {
    const intradaySettled = await Promise.allSettled(
      DISCOVERY_UNIVERSE.map((definition) =>
        fetchChartResult(definition.symbol, CHART_REQUESTS.intraday.interval, CHART_REQUESTS.intraday.range)
          .then((result) => buildIntradaySnapshot(definition, result))
      )
    );

    const intradaySnapshots = intradaySettled
      .filter((result) => result.status === "fulfilled" && result.value)
      .map((result) => result.value);

    const longTermSnapshots = await fetchLongTermSnapshots(DISCOVERY_UNIVERSE, forceLongTerm);
    return mergeSnapshots(intradaySnapshots, longTermSnapshots);
  }

  function renderMarketTape() {
    const slot = document.querySelector("[data-widget-slot='discovery-tape']");
    if (!slot) {
      return;
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

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.type = "text/javascript";
    script.text = JSON.stringify({
      symbols: [
        { proName: "FOREXCOM:NSXUSD", title: "NASDAQ" },
        { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
        { proName: "FOREXCOM:DJI", title: "DOW" },
        { proName: "TVC:GOLD", title: "GOLD" },
        { proName: "BITSTAMP:BTCUSD", title: "BTC" },
        { proName: "AMEX:SPY", title: "SPY" }
      ],
      showSymbolLogo: false,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "en"
    });

    frame.appendChild(script);
  }

  function refreshScanPanels(force = false) {
    if (document.hidden && !force) {
      return;
    }

    const now = Date.now();
    if (!force && now - lastScanRefreshAt < DISCOVERY_SCAN_REFRESH_MS - 1000) {
      return;
    }

    const shouldRefreshLongTerm = force || now - lastLongTermRefreshAt >= DISCOVERY_LONG_TERM_REFRESH_MS - 1000;
    lastScanRefreshAt = now;
    if (shouldRefreshLongTerm) {
      lastLongTermRefreshAt = now;
    }
    updateCountdowns();

    Promise.allSettled([
      fetchUniverseScans(shouldRefreshLongTerm),
      fetchTopMoverRows(12),
      fetchBroadActiveRows(10)
    ])
      .then(async ([snapshotResult, moverResult, activeResult]) => {
        const snapshots = snapshotResult.status === "fulfilled" ? snapshotResult.value : [];
        if (moverResult.status === "fulfilled" && moverResult.value.length) {
          currentPanels.movers = moverResult.value;
        } else if (!Array.isArray(currentPanels.movers)) {
          currentPanels.movers = [];
        }

        const fallbackActive = buildActiveRows(snapshots).map((row, index) => ({
          ...snapshots
            .filter((snapshot) =>
              Number.isFinite(snapshot.currentPrice) &&
              snapshot.currentPrice >= 2 &&
              Number.isFinite(snapshot.dollarVolume) &&
              snapshot.dollarVolume >= 50e6
            )
            .sort((left, right) => (right.dollarVolume || 0) - (left.dollarVolume || 0))[index],
          ...row
        }));

        currentPanels.active = activeResult.status === "fulfilled" && activeResult.value.length
          ? activeResult.value
          : fallbackActive;

        const opportunityCandidates = collectOpportunityCandidates(
          snapshots,
          currentPanels.movers,
          currentPanels.active
        );
        const opportunityLongTerm = await fetchLongTermSnapshots(
          opportunityCandidates.map(({ symbol, ticker, name }) => ({ symbol, ticker, name })),
          shouldRefreshLongTerm
        );
        const opportunitySnapshots = mergeSnapshots(opportunityCandidates, opportunityLongTerm);

        currentPanels.pullback = buildPullbackRows(opportunitySnapshots);
        currentPanels.value = buildValueRows(opportunitySnapshots);

        currentPanels.focus = buildFocusRows();

        renderScannerPanel("movers", currentPanels.movers, "No top movers are available right now.");
        renderScannerPanel("active", currentPanels.active, "No active names passed the current screen.");
        renderScannerPanel("pullback", currentPanels.pullback, "No clean pullback setups are available right now.");
        renderScannerPanel("value", currentPanels.value, "No range-discount candidates passed the current filter.");
        renderScannerPanel("focus", currentPanels.focus, "No cross-panel setups are available right now.");
        updateSummaryPanel(snapshots.length);

        if (newsNoteNode) {
          const moverLead = currentPanels.movers[0]?.ticker || "markets";
          const valueLead = currentPanels.value[0]?.ticker || "watchlist";
          newsNoteNode.textContent = `${moverLead} + ${valueLead} catalysts`;
        }

        refreshNewsPanels(true);
      })
      .catch(() => {
        currentPanels.movers = [];
        currentPanels.active = [];
        currentPanels.pullback = [];
        currentPanels.value = [];
        currentPanels.focus = [];
        renderScannerPanel("movers", [], "Market scan is unavailable right now.");
        renderScannerPanel("active", [], "Market scan is unavailable right now.");
        renderScannerPanel("pullback", [], "Market scan is unavailable right now.");
        renderScannerPanel("value", [], "Market scan is unavailable right now.");
        renderScannerPanel("focus", [], "Market scan is unavailable right now.");
        updateSummaryPanel(0);
      });
  }

  function refreshNewsPanels(force = false) {
    if (document.hidden && !force) {
      return;
    }

    const now = Date.now();
    if (!force && now - lastNewsRefreshAt < DISCOVERY_NEWS_REFRESH_MS - 1000) {
      return;
    }

    lastNewsRefreshAt = now;
    updateCountdowns();

    Promise.allSettled([
      fetchDiscoveryNews(18),
      fetchEarningsRadar(10),
      fetchNasdaqIpoCalendar(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`)
        .then((calendar) => buildIpoCalendarRows(calendar, 10))
        .catch(() => fetchIpoWatch(10).then((items) => buildHeadlineRows(items, "IPO")))
    ]).then((results) => {
      const marketNews = results[0].status === "fulfilled" ? results[0].value : [];
      const earningsNews = results[1].status === "fulfilled" ? results[1].value : [];
      const ipoNews = results[2].status === "fulfilled" ? results[2].value : [];

      currentPanels.earnings = earningsNews;
      currentPanels.ipo = ipoNews;
      currentPanels.focus = buildFocusRows();

      renderNewsPanel(marketNews);
      renderScannerPanel(
        "earnings",
        buildHeadlineRows(earningsNews, "EARN"),
        "No earnings or guidance catalysts are available right now."
      );
      renderScannerPanel(
        "ipo",
        ipoNews,
        "No IPO or listing headlines are available right now."
      );
      renderScannerPanel(
        "focus",
        currentPanels.focus,
        "No cross-panel setups are available right now."
      );

      updateSummaryPanel(
        new Set([
          ...currentPanels.movers.map((item) => item.symbol),
          ...currentPanels.active.map((item) => item.symbol),
          ...currentPanels.pullback.map((item) => item.symbol),
          ...currentPanels.value.map((item) => item.symbol)
        ]).size
      );
    });
  }

  function bindEvents() {
    if (openForm && openInput) {
      openForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const rawValue = openInput.value.trim();
        if (!rawValue) {
          return;
        }

        const target = rawValue.split(",")[0].trim();
        if (!target) {
          return;
        }

        window.location.href = `stocks.html?symbol=${encodeURIComponent(target)}`;
      });
    }
  }

  function startIntervals() {
    if (scanIntervalId) {
      window.clearInterval(scanIntervalId);
    }

    if (newsIntervalId) {
      window.clearInterval(newsIntervalId);
    }

    if (countdownIntervalId) {
      window.clearInterval(countdownIntervalId);
    }

    scanIntervalId = window.setInterval(() => {
      refreshScanPanels();
    }, DISCOVERY_SCAN_REFRESH_MS);

    newsIntervalId = window.setInterval(() => {
      refreshNewsPanels();
    }, DISCOVERY_NEWS_REFRESH_MS);

    countdownIntervalId = window.setInterval(() => {
      updateCountdowns();
    }, 1000);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        refreshScanPanels(true);
        refreshNewsPanels(true);
      }
    });

    window.addEventListener("focus", () => {
      refreshScanPanels(true);
      refreshNewsPanels(true);
    });
  }

  bindEvents();
  renderMarketTape();
  renderScannerEmpty(listNodes.movers, "Loading top movers...");
  renderScannerEmpty(listNodes.active, "Loading most active names...");
  renderScannerEmpty(listNodes.earnings, "Loading earnings catalysts...");
  renderScannerEmpty(listNodes.pullback, "Loading pullback setups...");
  renderScannerEmpty(listNodes.value, "Loading value watch...");
  renderScannerEmpty(listNodes.ipo, "Loading IPO watch...");
  renderScannerEmpty(listNodes.focus, "Loading focus list...");
  renderScannerEmpty(newsListNode, "Loading catalyst headlines...");
  refreshScanPanels(true);
  refreshNewsPanels(true);
  startIntervals();
  updateCountdowns();
});
