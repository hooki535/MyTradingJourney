# Replay chart tools

The chart workspace uses original SVG icons on a consistent 24px grid. Drawing
symbols use thin strokes and circular anchor handles. Long/short position
tools use three levels and rising/falling dotted guides. Chart controls,
replay controls, journal tabs, undo/redo,
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
- Undo and redo remain in the top chart toolbar.
- Tool search and shortcut help sit in the top toolbar; favorites toggle at
  the bottom of the drawing rail. Duplicate rail controls are hidden.
- Rail order follows lines, Fibonacci, patterns, projection, shapes, notes,
  and icons. Lines/channels, projection/volume/measurers, and brushes/arrows/
  shapes have separate menu sections. Canonical engine tool IDs are unchanged.
- AVWAP appears in the volume section and arrow tools in the shapes section;
  both remain searchable and retain their saved tool identifiers.
- Menu text and anchor handles follow light/dark themes; favorite stars remain
  visible on touch layouts.
- Drawing selection uses blue; the surrounding Goat-style workspace keeps
  its charcoal and gold palette. Backtesting defaults to dark for accounts
  without a saved appearance; saved preferences and other pages are unchanged.
- Floating replay and drawing controls inherit the selected page palette so
  their text stays readable in light mode.

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
available browser. Cloudflare prevented submission; authenticated sessions
could not be inspected or created. User screenshots of the failed handoff
did not show the Goat workspace. The existing Goat-style layout is retained.
The latest visual pass was checked on desktop and a 390px phone frame: grouped
menus, favorites surviving reload, saved drawing hide/lock controls, tool
search, and both theme palettes. The phone page has no horizontal overflow.
TradingView's public tool screenshots informed the hand-drawn SVG shapes:
https://www.tradingview.com/support/solutions/43000703396-drawing-tools-available-on-tradingview/
https://www.tradingview.com/support/solutions/43000475660-how-to-use-long-and-short-position-drawing-tools/
TradingView's official favorites documentation informed the pinning workflow:
https://www.tradingview.com/support/solutions/43000662392-how-to-favorite-indicators-financials-drawing-tools-and-timeframes/
