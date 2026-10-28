# Replay chart tools

The chart workspace uses original SVG icons on a consistent 24px grid. Drawing
symbols reuse the registered geometry catalogue; control icons use the same
stroke weight, and long/short position tools have distinct arrows and colored
risk/reward regions. Chart controls, replay controls, journal tabs, undo/redo,
settings and the object tree use the shared `BacktestIcons` module.

## Drawing workflow

- Split buttons recall the last tool selected in each group.
- Stars pin up to eight tools to a floating favorites toolbar.
- The favorites grip supports dragging and arrow-key movement. Positions are
  saved proportionally to the chart size. The toolbar can be hidden and shown.
- Favorites and last-used tools are read after the account workspace loads,
  whenever a replay view is created. Preferences use the existing account
  preference map and backup format, with no additional local account database.
- The selected drawing tool appears below the chart on desktop.
- Undo and redo are available on the drawing rail and top chart toolbar.
- The help icon at the end of the rail explains tools and keyboard shortcuts.
- Menu text and anchor handles follow light/dark themes; favorite stars remain
  visible on touch layouts.

All registered tools remain backed by the existing drawing engine. Volume-based
tools still require source volume. No proprietary TradingView charting library,
icons, or account integration is included; Lightweight Charts attribution stays
visible.

## Repeat an experiment

Each session card's actions menu offers **Create fresh attempt**, also available
inside replay. The dialog allows a new name. It uses the existing single-market
or portfolio constructor to retain the dataset, initial replay time, starting
balance, costs, frozen strategy, research plan and challenge configuration.
Orders, trades, drawings, reviews and results start empty. The original session
is retained under its existing ID.

## Validation and reference limits

All 154 existing Node tests pass. Browser QA on bundled historical candles
verified drawing placement, undo/redo object counts, favorite selection and
persistence, keyboard movement and visibility, shortcut help, clean portfolio
restarts with the original still present, both themes and phone menu layout.
The phone viewport has no horizontal page overflow, and menu stars are visible.

The requested Goat Funded Trader backtesting URL redirects to sign-in in the
available browser. Its authenticated workspace was not inspected or copied.
TradingView's official favorites documentation informed the pinning workflow:
https://www.tradingview.com/support/solutions/43000662392-how-to-favorite-indicators-financials-drawing-tools-and-timeframes/
