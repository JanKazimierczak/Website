document.addEventListener("DOMContentLoaded", () => {
  // Change `defaultSymbol` if you want a different main ticker on first load.
  const DASHBOARD_CONFIG = {
    defaultSymbol: "NASDAQ:ALM",
    defaultRange: "6mo"
  };

  const RSS2JSON_API = "https://api.rss2json.com/v1/api.json?rss_url=";
  const MARKET_NEWS_QUERY = "stock market OR bitcoin OR gold OR federal reserve";
  const NEWS_TIMEOUT_MS = 4500;
  const QUOTE_TIMEOUT_MS = 5500;
  const MIRROR_PREFIX = "https://r.jina.ai/http://";

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
  const marketStateNode = document.querySelector("[data-market-state]");
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
  const tickerNewsList = document.querySelector("[data-ticker-news-list]");
  const quickPickButtons = Array.from(document.querySelectorAll("[data-symbol]"));
  const rangeButtons = Array.from(document.querySelectorAll("[data-range]"));

  let dashboardInitialized = false;
  let currentSymbol = DASHBOARD_CONFIG.defaultSymbol;
  let currentRange = DASHBOARD_CONFIG.defaultRange;
  let newsRenderId = 0;
  let quoteRenderId = 0;
  let currentQuoteSnapshot = null;

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
    const mirrorUrl = buildMirrorUrl(symbol, "1m", "1d");
    const candidateRequests = [
      () => fetchJsonWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(mirrorUrl)}`, QUOTE_TIMEOUT_MS),
      () => fetchTextWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(mirrorUrl)}`, QUOTE_TIMEOUT_MS),
      () => fetchTextWithTimeout(mirrorUrl, QUOTE_TIMEOUT_MS)
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

    throw lastError || new Error("Quote data is unavailable");
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

    if (marketStateNode) {
      marketStateNode.textContent = "Live via TradingView + quote feed";
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

  function formatNewsDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "Recent";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  }

  function buildNewsUrl(query) {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    return `${RSS2JSON_API}${encodeURIComponent(rssUrl)}`;
  }

  async function fetchNews(query, limit) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), NEWS_TIMEOUT_MS);
    let response;

    try {
      response = await fetch(buildNewsUrl(query), {
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

    return items.map((item) => ({
      title: decodeHtml(item.title || "Headline"),
      link: item.link || "#",
      source: decodeHtml(item.author || payload.feed?.title || "Google News"),
      date: item.pubDate || ""
    }));
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

    if (marketStateNode) {
      marketStateNode.textContent = "Live via TradingView";
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
    renderWidget("advanced-chart", "embed-widget-advanced-chart.js", {
      autosize: true,
      symbol,
      interval: RANGE_TO_INTERVAL[currentRange] || "D",
      timezone: "America/Toronto",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_side_toolbar: true,
      allow_symbol_change: false,
      withdateranges: false,
      save_image: false,
      calendar: false,
      support_host: "https://www.tradingview.com"
    });
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
    const meta = getSymbolMeta(symbol);
    const ticker = getShortTicker(symbol);

    renderNewsMessage(breakingNewsList, "Loading market headlines...");
    renderNewsMessage(tickerNewsList, `Loading ${ticker} headlines...`);

    const [marketResult, tickerResult] = await Promise.allSettled([
      fetchNews(MARKET_NEWS_QUERY, 8),
      fetchNews(`${meta.name} OR ${ticker} stock`, 12)
    ]);

    if (thisRender !== newsRenderId) {
      return;
    }

    if (marketResult.status === "fulfilled") {
      renderNewsItems(
        breakingNewsList,
        marketResult.value,
        "No market headlines are available right now."
      );
    } else {
      renderNewsMessage(breakingNewsList, "Market headlines could not be loaded right now.");
    }

    if (tickerResult.status === "fulfilled") {
      renderNewsItems(
        tickerNewsList,
        tickerResult.value,
        `No current headlines were found for ${ticker}.`
      );
    } else {
      renderNewsMessage(tickerNewsList, `Ticker headlines could not be loaded for ${ticker}.`);
    }
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
});
