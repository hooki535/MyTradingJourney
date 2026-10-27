# Replay workbench upgrade

The existing simulation engine, action history, session IDs, strategy snapshots, storage keys and owner-scoped account synchronization are retained. This is an original implementation informed by FX Replay's public guides, not an integration with its service or market-data licenses.

## Existing capabilities retained

Archived OHLC/CSV and configured history sources, market/limit/stop orders, next-open execution, configured costs, stop-first ambiguous-bar resolution, partial exits, multi-market shared equity/clock, drawing tools and templates, account challenges, frozen strategy rules, research briefs, execution reviews, analytics, CSV exports and workspace backups remain in place.

## New workflow

- The replay bar sits below the chart by default. Float moves the existing bar onto the primary chart; its original drag/keyboard grip still works. Dock returns it below the chart.
- Sync uses the primary chart timeframe. Disable Sync to select an independent source or aggregated interval. A timeframe step advances to the next boundary, processing all intervening source bars. The last candle can remain partially built. Seconds data is not fabricated from minute or hourly data.
- Go to advances to the next London 08:00, New York 08:00 or Tokyo 09:00 local opening, the next UTC day, a UTC date, a price touch or the active instrument's position close. Weekends and local daylight-saving offsets are handled for opening shortcuts. These are explicit research windows, not broker hours or trade recommendations.
- Time jumps stop on the first available source timestamp at or after the target, within loaded history. Price searches process each candle before checking its range; they stop on a touching OHLC bar or at the selected search window. The maximum window cannot skip an out-of-window source bar. A missed level leaves the replay at the processed time. Position-close mode continues through partial exits until the active position is flat.
- Pause on exit stops any replay step or time/price jump on an execution, including a partial close. Position-close mode deliberately continues through partial exits. Challenge completion/failure always stops a run. Batches yield every 200 engine steps; Stop skip and ordinary pause preserve processed trades and bars. Navigation and owner changes dispose of replay jobs.
- Two charts adds a second timeframe view of the active symbol. Both derive from the same revealed source prefix and shared replay clock. Context-pane drawings are cloned/locked. Pan, zoom and crosshair remain independent. It does not imply a tick feed or independently advancing charts.
- The ticket has Order, Journal and Markets panels. Journal reuses `session.notes` and existing trade-review records. Markets lists the existing portfolio pairs and last revealed closes. Relative order presets store risk percentage, stop distance and target R; applying one only prepares a market ticket and reuses the existing risk-size calculation. The user still submits the order.
- Focus provides a larger chart surface; Escape leaves focus. The existing light/dark theme, fullscreen, drawing tools, chart resizing and attribution remain available. Standard viewport fitting yields to manually resized or previously customized chart heights.

## Persistence

New preferences use `onepercent:backtest-replay:v1` in the existing in-memory workspace preference map. The existing `onepercent:backtest-` allowlist already includes it in the same account snapshot and backups. No existing key is renamed or reset, and no database schema, RLS, authentication or sharing policy changes. Browser storage in the test preview is a separate mock fixture and is never deployed.

## Boundaries

No economic-news feed, order-flow/tick reconstruction, seconds candles, FX Replay login, paid data access, automatic breakeven engine or non-destructive rewind was added. Loaded OHLC coverage remains authoritative. Users may restart a new attempt using the existing action. The original data-source and Lightweight Charts attributions remain visible.

## Verification

`node --test tests/*.test.cjs` covers deterministic manual-vs-skip equivalence, partial exit handling, challenge interruption, portfolio clocks, bounded/cancelled runs, price windows, invalid inputs, DST/weekends, calendar-month steps and relative risk presets, alongside the full existing suite.

Browser checks use genuine bundled SiftingIO candles and a preview-only account adapter. They cover step/sync, London jump, preset creation/application, next-open entry, partial close, position-close jump, notes, restore, themes, two charts, autoplay, floating/docked controls, focus and mobile layout.

## Behavioral references

- https://support.fxreplay.com/articles/mastering-the-replay-feature
- https://support.fxreplay.com/articles/how-to-skip-ahead-go-to-sessions-future-date-price
- https://support.fxreplay.com/articles/new-chart-whats-changed
