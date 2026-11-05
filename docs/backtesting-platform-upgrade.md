# Chart workflow upgrade — 5 November 2026

The existing MyTradingJourney backtester now connects chart analysis, replay navigation, order preparation and trade review through a consistent workflow. No market prices, saved trades, execution rules or authentication policies were changed.

## Reference inspection

- TradingView: its official drawing-tool, favorites and Bar Replay help pages were inspected. Favorite tools and intervals, searchable chart actions, and chart context actions informed this implementation. The public chart shell loaded in a fresh QA browser, but the interactive chart did not finish rendering there. This is an original Lightweight Charts implementation, not the licensed Advanced Charts library or a claim of feature parity.
- Goat Funded: the public backtesting entry was opened; its application did not expose a usable signed-in workspace. Previously supplied screenshots informed the grouped tool rail, compact chart desk, ticket and account-stat hierarchy. No claim is made that every current authenticated interaction was tested.
- FX Replay: its official help pages for the backtesting journal, orders, presets, replay and navigation were inspected. Its public marketing site timed out in the QA browser. Session/date navigation and linked execution reviews informed the workflow.

Sources:

- https://www.tradingview.com/support/solutions/43000662392-how-to-favorite-indicators-financials-drawing-tools-and-timeframes/
- https://www.tradingview.com/support/solutions/43000703396-drawing-tools-available-on-tradingview/
- https://www.tradingview.com/support/solutions/43000474024-how-do-i-turn-bar-replay-on/
- https://support.fxreplay.com/categories/product-guide-features
- https://support.fxreplay.com/articles/tracking-your-trades-with-the-journal-feature
- https://app.goatfundedtrader.com/back-testing

## Changes

| Area | Result |
| --- | --- |
| Analysis tools | Ctrl/Cmd+K opens a searchable command menu covering drawing tools, indicators, timeframes, chart display and workspace actions. Unsupported volume/breadth studies remain explicitly unavailable. |
| Chart navigation | Favorite timeframe buttons, editable interval pins, fit-history and return-to-replay-candle controls. All ten requested intervals remain available when the source is fine enough. |
| Chart interaction | Right-click to add an exact horizontal price level or prepare a directionally correct buy/sell limit/stop ticket. Context prices match the chart scale precision. Drawing levels retain undo/redo. |
| Indicators | Active studies have compact removable chips; command search adds or removes supported studies through the same session state. |
| Replay | Historical UTC clock, source-candle progress, next-day and next-market-session actions. Skips delegate to the existing forward replay loop, processing every intervening candle and trade event. |
| Orders | Search and context actions only prepare the existing ticket. Stops/targets that no longer bracket the chosen entry are cleared. The user must review and explicitly submit. |
| Journal | A review queue surfaces unreviewed exits and links directly to the existing review dialog and session journal. Merely selecting the default emotion does not mark an exit reviewed. |
| Account and device | Timeframe pins are included in existing account preferences and backups. All added listeners and elements are removed on session/account changes. Responsive controls and dialogs support phones. |

## Validation

Automated tests cover pending-order direction, malformed preferences, command search, review classification, progress without reading future prices, context-price rounding, level validation and undo/redo. Existing execution, replay, drawing, account-sync and history checks are retained.

Browser QA uses a mock account and real local archived candles. It never writes to the owner's database workspace. It checks every requested timeframe, repeated command-dialog open/close, keyboard selection, indicator add/remove, saved pins after route changes, right-click ticket preparation without an execution event, drawing undo/redo, forward day skips, reproducible restore, and desktop/mobile layout. Published assets receive a separate live check.

## Practical limits

History coverage still varies by instrument and source. Missing candles are not synthesized, and unavailable seconds or volume are not advertised as present. Existing hourly sessions require a new minute-data session to use smaller intervals. Public pages and screenshots cannot establish full parity with authenticated TradingView, FX Replay or Goat Funded features. Economic news and licensed proprietary indicators are not fabricated or copied.
