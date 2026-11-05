# Authenticated backtesting reference audit — 4 November 2026

Inspected Goat Funded Trader in the user's authenticated browser. Created one clearly named simulated session, `MTJ reference inspection`, starting 10 January 2023 on EURUSD. A simulated market order, 50% partial close and final close were used to inspect the position workflow. The reference session remains in that account as an inspection record; no funded/live account orders were placed.

## Observed areas and implementation

| Area | Observed reference | MyTradingJourney implementation |
| --- | --- | --- |
| Session overview | Charcoal surfaces, gold selected controls, tutorial card, search, visible sort/date/instrument filters | Dedicated scoped stylesheet prevents the editorial green theme from overriding backtesting; inline filters retain existing state and handlers |
| Grid / List | Grid cards or a table with name, symbols, return, net P&L, balance, win rate, period and actions | Added an actual semantic session table with ten-row pagination, resume/stats controls, rename, export, delete and a fresh-attempt action |
| Session creation | Balance, searchable five-pair selector, UTC dates, optional strategy/name/description | Existing form retained; source, archive selector and coverage remain visible. Database history remains the default; no silent sample fallback |
| Replay | Large central chart, compact account header, replay controls, expandable ticket, resize handle | Compact header playback, viewport-aware chart height, responsive ticket styling and sidebar collapse; original chart resizing, step controls and docking retained |
| Drawing tools | TradingView group rail, indicators, object tree, chart type, save, screenshot and fullscreen | Existing original drawing registry, menus, renderer, settings, indicator list, object tree, export and fullscreen retained |
| Order ticket | Initial/current reference, six risk presets, percentage/cash sizing, Market/Limit/Stop, lots, Buy/Sell, SL/TP | Existing risk/contract conversions and engine reused; added explicit Cancel and mobile Escape/focus handling |
| Positions | Pending/Open/Closed tabs, editable levels, partial close, breakeven and close controls | Existing actions retained; added a direct breakeven preparation button which opens level editing and requires Save |
| Partial close | 25/50/75/100%, custom percentage/lots, result preview | Existing percentage/lots/units dialog and next-source-open fill rule retained |
| Settings | Session info, Time and Costs tabs; separate shortcuts panel | Existing keyboard-accessible settings and shortcuts retained and restyled; adds no fee-model changes |
| Go to | Session presets and a UTC date jump | Existing DST-aware session/date/price/position-exit skip remains available and processes every source candle |
| Analytics | Overview, Wins vs Losses, Calendar; monthly/hour/symbol/duration/R distributions | Added completed-position count/P&L breakdowns for these dimensions and a cumulative realized-equity panel |
| Calendar | Year overview, month/day view and summaries | Existing yearly view retained; added navigable month grid with day P&L, exit counts, daily details and day-result totals |
| Strategies | Name, description, colors and dynamic checklist | Existing searchable strategies, checklist editor, frozen session playbooks and strategy analytics retained and restyled |
| Challenges | Model and account-size selection, rule summary, past challenges | Existing study presets retained and restyled; they remain explicitly independent of live prop-firm terms |

## Preservation and numerical semantics

No changes to Supabase configuration, history RPCs, pair inventories, history data, authentication, storage keys, existing snapshots or execution-engine rules. TheOnePercent remains the candle source. The dedicated stylesheet applies only to `body[data-page=backtesting]`.

The distribution module receives completed positions from the existing engine. Partial exits count once when a position completes; position P&L is assigned to its final-close month in those breakdowns. The existing calendar and realized day totals continue to use each execution's exit timestamp, including partials. Missing R values occupy an explicit unmeasured bucket. Month/day boundaries and entry-hour groups use UTC.

Costs stay locked after an order under the existing reproducibility rules. Queued orders and partial/full closes continue to fill on the next source candle, with stop/target priority retained. Breakeven preparation does not amend a position until the user saves valid levels.

## Validation and limits

- The 225-test Node suite passes, including four new UTC, duration/R-boundary, partial-exit and leap-year tests.
- An isolated DOM harness exercised the actual session form, list/filter/pagination/rename functions, calendar navigation and breakeven preparation. It used controlled account/history fixtures, made no authenticated database writes and verified the database selection never falls back to a sample after a failure.
- Syntax and Git whitespace checks pass.
- Browser inspection of the reference was performed on the live authenticated site. Visual verification of the edited MyTradingJourney page remains outstanding: the cloud browser cannot reach the local HTTP server and rejects file-protocol navigation. No pixel-perfect or mobile visual-verification claim is made.
- Goat's full licensed TradingView Charting Library is not bundled or replaced. MyTradingJourney continues to use Lightweight Charts and its own drawing implementations. Existing one-position/pending-order-per-market limits and source-timeframe limits remain. Historical coverage is source-specific; unavailable pairs/timeframes are not fabricated.

## Follow-up tools and chart inspection — 5 November 2026

The inspection findings below describe the starting behaviour. The viewport and magnet issues are fixed in the follow-up change; broader chart appearance parity remains outstanding. Goat was inspected live while authenticated; MyTradingJourney findings below come from its source and isolated chart reproductions. Its authenticated live comparison is awaiting completion of Google device verification.

| Behaviour | Goat live observation | MyTradingJourney finding |
| --- | --- | --- |
| Pan during replay | After panning back, Next advances the replay without moving the visible historical window; a return-to-latest control appears | `backtest-chart.js` resets the logical range when the replay cursor changes, losing manual pan/zoom |
| Magnet on higher timeframes | Toolbar describes snapping to the nearest candle OHLC value | Magnet currently reads a raw source bar after mapping the displayed coordinate; an aggregated H4 candle can therefore snap to one constituent H1 candle rather than the displayed H4 OHLC |
| Drawing placement and editing | Two-click trend line, selected anchors, floating toolbar, double-click settings; Style/Text/Coordinates/Visibility and templates | Existing drawing menus and settings cover these concepts, but menu grouping and per-tool options differ |
| Drawing undo | Creating a trend line exposes Undo create Trend Line; undo removes the drawing and exposes redo | Existing custom undo/redo requires a separate authenticated interaction check |
| Chart appearance | Separate Symbol, Status line, Scales and Canvas tabs expose candle bodies/borders/wicks, price lines, OHLC, scale labels, countdown, timezone, grids, crosshair, margins and watermark | Current desk chart settings primarily expose chart height/privacy; broad appearance parity is incomplete |
| Chat | Intercom support launcher opens a Home panel with Messages/Help tabs, help search and a Send us a message action; AI Mentor is a separate navigation destination | No equivalent support messenger was established in the backtesting source inspection. No messages were sent and AI Mentor responses were not tested |

The temporary Goat trend line was removed using undo. One additional simulated replay candle was advanced to verify viewport behaviour. No market-history source, database configuration or execution rules were changed during this follow-up inspection.

Follow-up fix validation: six chart interaction regression tests cover historical panning, latest-candle following with retained zoom, partial aggregated candles, earlier-context insertion, intentional viewport resets, aggregated magnet OHLC and unrevealed-price isolation. No candle source or execution-engine changes are included.
