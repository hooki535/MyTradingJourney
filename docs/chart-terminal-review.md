# Chart terminal ZIP review and integration

Reviewed `chart-terminal.zip`, extracted under `work/chart-terminal`.

## Findings
- Useful: chart appearance preferences, viewport navigation, reset and scale controls, compact terminal layout ideas.
- Prototype uses generated 15-minute candles for four symbols, not downloaded historical prices. It exposes only five intervals and does not implement replay execution.
- Drawings map time to logical index assuming uninterrupted uniform bars; this fails for real forex weekend/session gaps.
- Existing drawings have no edit handles; Long/Short targets are fixed at 2R. Replacing the current engine would remove editable positions and the broader drawing catalog.
- The chart SVG only repaints on visible time range changes, so price-only scale changes can leave stale geometry.
- The archive lacks Vite/TanStack configuration, application entry scaffolding, lockfile and tests; it is not a complete standalone build.

## Adapted into the existing local chart
- Earlier/later viewport buttons, reset to 160 revealed candles and automatic price scaling.
- Appearance dialog: grid, current-price line, automatic/log price scale, crosshair style, rising/falling candle colors and chart background.
- Preferences use existing workspace settings storage. Existing history sources, timeframe aggregation, position handles, order execution and account records stay in place.
- Chart options are reapplied when series change; kinetic panning and resize range preservation follow the supplied terminal design.

## Validation
25 focused chart/drawing/workstation tests passed, including new viewport/state isolation and appearance persistence checks. Browser verified applying grid visibility, reset and earlier-candle navigation. Screenshot: outputs/chart-terminal-upgrade.png. No live publication.

## Direct Backtesting integration
The terminal is integrated into the existing replay screen, not linked as a separate application. Added single, two-column, two-row, three-column, four, six and eight-chart layouts; pane timeframe selectors and maximize; active-pane drawing/edit navigation; crosshair/timeframe/time-range synchronization; shared or separate drawings; a session watchlist using revealed prices; range/date navigation; Auto/Log controls; on-chart Buy/Sell ticket shortcuts and optional one-click simulation; eraser; indicator favorites, recent and category filters; and Chart/Candles/Axes/Legend/Trading settings.

All panes deliberately follow the session market and common replay clock. Other symbols must be part of a multi-market session and can be selected through the watchlist. Alert creates a chart reference line, matching the prototype; it is not an email/push alert service. Export image uses the existing chart export. This does not introduce external live execution.

Validation: 264 tests passed before the final shared-array replacement fix; four layout tests passed afterward, including the new shared deletion/independent drawings regression. Browser verified four charts with separate 1m/5m/15m/30m displays. Subsequent browser connections timed out, so active-pane editing, remaining layout sizes and expanded settings still need final interactive review. Fixed layout-selector event binding to target only dialog buttons. Changes remain local and unpublished.

## 9 November review follow-up
Fixed automatic price scale being reapplied when settings were only read or replay refreshed. Added a regression for manual scale preservation. Drawing edit controls now follow the active pane and are preserved when layouts are rebuilt. The local preview server was restarted after it had stopped. Browser reconnection still needs verification; no publication was performed.

Linked-range review: added suppression for delayed viewport echoes rounded to different chart intervals. Sixteen focused chart/layout regressions pass, including preservation of manual price scaling and drawing replacement arrays. Browser opened the local preview but stalled during the subsequent four-chart selection; that visual check is not confirmed. No remote changes were made.
