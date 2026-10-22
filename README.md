# GoldFlow AI Elite — The Fundamental Edge

A static, mobile-first XAUUSD analysis and risk-planning PWA intended for GitHub Pages.

## Included working features
- Responsive dashboard and navigation.
- CSV OHLC candle import, validation, and recent-candle table.
- Candle-derived range break/sweep heuristics, ATR proxy, and candidate trade plan.
- Equity and risk calculator with configurable daily limits, drawdown warnings, and ZAR/USD/EUR/GBP display.
- Position-size estimate only when the user supplies broker-verified value-per-$1-per-lot and stop distance.
- Simple chronological candle-based backtest with basic metrics and explicit limitations.
- Local preference storage, CSV export, manifest, app icons, and service-worker shell caching.

## Important limitations
- There is **no connected live price feed**, broker connection, genuine bid/ask aggressor classification, CVD, footprint, DOM, COMEX feed, or economic calendar.
- Manual quote and imported candles are user-supplied, not independently verified. Synthetic demo candles are labelled and must not be used for trading.
- Scores are rule scores, not probabilities of winning. No profitability is claimed.
- Static GitHub Pages cannot safely store API secrets or run a private backend. For genuine data, add a provider adapter and secure backend separately; never place API secrets in this repository.
- The backtest is an approximate candle-based test, not order-flow validation. OHLC data cannot resolve the order of stop/target hits within the same candle.

## Publish from iPhone
1. Open the repository `https://github.com/kay222213/goldflow-ai` in Safari.
2. Add/upload the extracted ZIP contents to the repository root (the `index.html`, `styles.css`, `app.js`, `manifest.webmanifest`, `sw.js`, `README.md`, and `icons/` folder). Do **not** upload the ZIP itself.
3. Commit the files to the branch/folder configured for GitHub Pages.
4. Open `https://kay222213.github.io/goldflow-ai/` in Safari. If old content persists, wait for Pages to deploy, close the tab, reopen it, and refresh. The service worker updates the app shell, but a stale iOS home-screen install may need to be removed and re-added.
5. In Safari, tap Share → Add to Home Screen.

## CSV format
Required header names: `open,high,low,close`. Optional: `time` (or `timestamp`/`datetime`/`date`) and `volume`. One row per candle; use chronological order. The app rejects invalid OHLC rows.

## Testing checklist
- [ ] Open `index.html` through GitHub Pages (not a local `file://` URL).
- [ ] Switch between all four tabs.
- [ ] Import a known CSV and confirm candle count and last close.
- [ ] Test malformed CSV and confirm a readable error.
- [ ] Set balance 1000 and target 2000; risk panel should warn that target is 200% of balance.
- [ ] Position planner should refuse sizing until a broker-verified value-per-$1-move is entered.
- [ ] Run backtest with at least 100 candles and inspect limitations.
- [ ] Verify offline app shell only; never interpret cached candles or quotes as live.
- [ ] Add to iPhone home screen.

## Data-source architecture
This build is provider-independent and intentionally uses file/manual inputs only. For spot XAUUSD, broker quote/tick feeds represent that broker's OTC pricing, not the entire global market. COMEX GC/MGC trades and order book are exchange-specific futures data and differ from spot by basis, contract and expiry effects. Genuine aggressor-side delta/CVD requires classified trade data; candle volume cannot supply it. A secure backend may be required for protected provider credentials or streaming integrations.
