# GoldFlow AI Elite — rebuilt project

A static trading workspace designed for GitHub Pages. The project includes a functional local Profit Manager tracker, market quote display, multi-timeframe rule-based signal scanner, trade planner, risk desk, CSV candle backtester, signal lifecycle log, export, and embedded TradingView chart.

## Quick deploy (GitHub Pages)

1. Create a new public GitHub repository.
2. Upload the **contents of this ZIP directly into the repository root** (so `index.html` is at the root, not nested inside another folder).
3. Commit to `main`.
4. Open **Settings → Pages** and select **Deploy from a branch → `main` → `/ (root)`**.
5. Open the published site, enter the Profit Manager tab, set equity/target/direction/risk limits, and press **Save & start monitoring**. The target tracker and signal journal save in that browser using local storage.

## Live market data: what this build does

- **Quote cascade:** tries the XAUS XAU/USD spot endpoint first, then Gold-API, Metals.live, and Yahoo reference sources. XAUS has an open browser CORS policy and its documented spot response uses `spot_usd_oz` / `updated_at`; the parser in this build handles those fields and checks freshness.
- **Candles for scanning:** tries XAUS's `/api/v1/chart?symbol=xau&range=5d&interval=5m` OHLC endpoint first, then a Yahoo Finance XAU/USD reference series and public CORS relays. It validates OHLC bars and rejects stale/insufficient data rather than inventing candles.
- **Refresh:** quote polling is configurable in Settings & data. The scanner rechecks while the page is open. Browser sleep, network policy, source outages, CORS, market closure, and provider throttling can still interrupt a feed. If the status says unavailable/stale, treat it as unavailable/stale; do not trade from stale data.
- **TradingView is separate:** the embedded chart is rendered by TradingView and is not a data API that the app can read. The scanner uses its own quote/candle sources.
- **Reference feed is not broker execution data:** it does not equal your active MT5 broker's bid/ask, spread, contract specification, or fill price. This project does not connect to MT5 and does not place, manage, or close broker orders.

## Profit Manager behaviour

- Saves equity, daily profit target, allowed direction (BUY/SELL/BOTH), risk percentage, daily loss cap, and minimum reward:risk.
- Calculates profit still needed, target return versus the entered equity, per-trade risk budget, progress bar, and an estimated equity after realised P/L.
- Tracks manually entered realised P/L and open risk; closing a tracked signal can add its entered realised result to the daily total.
- Stores signal history and lifecycle (NEW SIGNAL → TAKE/SKIP → HOLD/CLOSE), allows signal details to expand, and exports the log to CSV.
- Rolls the realised-P/L counter at the new day in South African time while retaining signal history.
- Blocks new signals after the target is reached or the daily loss/open-risk budget is used. Prevents taking another tracked signal while a prior signal is still marked TAKEN/HOLD. These are local UI guardrails; they cannot block a trade entered independently in MT5.
- It never promises a daily profit or guarantees a correct trade. A rules-based signal is a candidate, not an instruction.

## Optional authenticated data proxy

For a more controlled candle source, the `cloudflare-worker/worker.js` file can be deployed as a Cloudflare Worker with a provider API key stored as a Worker Secret named `TWELVE_DATA_API_KEY`. Never put a provider key in this public repository. Configure the deployed Worker base URL in **Settings & data**. The exact provider symbol/plan entitlement and request quotas must be verified with the provider.

## Known constraints (important)

- No browser-only app can guarantee uninterrupted live data from third-party providers. The included public providers are best-effort and may be delayed, rate-limited, or unavailable.
- A TradingView embed does not expose its candles to this application.
- Public spot data is indicative, not a broker executable quote; third-party candles may differ from the active broker.
- The app does not receive DXY, Treasury yields, a news calendar, true order-flow/volume-delta, MT5 account equity, floating P/L, or open positions automatically. Those are not fabricated.
- The app does not execute trades. Verify every setup, lot size, tick value, spread, margin, and risk calculation in your broker terminal.

## Files

- `index.html` — all app tabs and layout
- `app.js` — quote/candle data, target tracker, risk and signal logic
- `styles.css` — responsive black-and-gold UI
- `cloudflare-worker/worker.js` — optional secure API proxy
- `assets/` — branding assets
- `sw.js` — service worker cache (versioned for this build)
- `tests/smoke-test.js` — static integrity smoke tests
