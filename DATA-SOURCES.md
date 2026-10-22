# Data-source integrity notes

## Current build
No external market-data provider is connected. Quotes entered by hand are labelled manual/unverified; imported CSV is user-supplied. The app does not fetch public API prices, avoiding the risk of presenting an unreliable or stale endpoint as live.

## Spot XAUUSD
Spot gold is OTC and decentralized. A broker's bid/ask/tick feed is specific to that broker and is not a consolidated global tape. Validate timestamps, spread, trading session and outages.

## COMEX GC/MGC futures
Futures trades and order-book data are exchange-traded and can support genuine futures aggressor-side analytics if the feed supplies trade classification. They are not identical to spot XAUUSD; compare only after modelling futures/spot basis and contract expiry. A futures signal is proxy evidence, not spot order flow.

## Order-flow fields
CVD, footprint imbalances and stacked imbalances require classified trades and suitable historical data. Candle OHLCV alone cannot establish aggressor side, true absorption, DOM imbalance or institutional positioning. The current engine uses candle-derived structure heuristics only.

## Free/public APIs
Availability, terms, rate limits, delayed quotes, instrument coverage and API-key requirements change. This package does not claim that any public API is free or reliable enough for trade execution. Any future adapter must show provider, instrument, timestamp, delay and stale/error state, and keep private credentials server-side.
