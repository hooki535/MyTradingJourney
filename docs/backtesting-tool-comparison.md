# Tool comparison and review preview

7 November 2026. These changes are local review work; the live site remains on commit 7675632.

## Verified in Goat session 99433

- Fibonacci retracement: two-point placement, Style/Coordinates/Visibility tabs, enabled colored ratios, extension controls, labels/prices/background/reverse/font size, price+bar anchor fields, timeframe ranges.
- Long Position: annotation confirmation, Inputs/Style/Visibility tabs. Inputs include account size, lot size, risk % selector, entry, profit ticks/price, stop ticks/price. Style includes line, stop/target/text colors, font, price labels, compact stats and always-show stats. Independent target handle changed 1R to 1.63R without changing risk/quantity. Right handle changes projection width.
- Short Position: one-click mirrored box, confirmation can prepare a sell limit ticket from its entry/SL/TP. Created and cancelled a pending test order.
- Market trade: 0.3% of 10000 with entry 1.16832, stop 1.166, target 1.172 sized 0.129 lots. Saved SL edit to 1.1665. One next candle updated P&L. Partial close default 50% rounded to 0.06 lots; full close reconciled total realized -1.16. No live orders.
- Forecast menu contains long, short, forecast, date/price ranges, bars pattern, ghost feed, projection and fixed-range volume profile.
- Chart settings candle page: body/border/wick colors, previous-close color option, last/high/low lines, precision and UTC timezone. Scale page inspection was interrupted by browser timeouts; do not claim tested.

## Compared and improved locally

MyTradingJourney already had one-click positions, four independent handles, undo/redo and a confirmation before pending order preparation. Updated new shapes to 1:1, 100px initial width and visible-scale price distance, rounded new levels to displayed market precision. Rendered filled Target/Stop/Open P&L/Qty/R badges; quantity precision defaults to whole units. Reordered drawing rail and menu catalog to the reference grouping. Existing saved positions and execution rules are preserved.

The review preview runs at http://127.0.0.1:8895/pages/backtesting.html#session/preview-tools-chart via work/backtesting-review-server.cjs. It uses actual archived EURUSD sample candles in an in-memory demo account and never writes to the owner's database. Refresh restores demo data.

## Still to inspect and match

All remaining drawing tools and indicator settings; price-axis/time-axis scaling and reset gestures; timeframe transitions, order line dragging, complete chart settings, mobile behavior and pixel-level icon comparisons. Position input UI still differs: risk uses percent, with explicit contract/USD inputs; tick fields and the reference risk-unit selector have not been implemented. No claim of identical TradingView libraries or completed full parity.

## Drawing interaction corrections (7 November 2026)
Drawings repaint after price-axis gestures, using capture-phase viewport listeners because the chart can stop event propagation. Drawing drags temporarily disable chart scrolling/scaling and restore the previous options on release or cancellation. Position statistics badges now accept whole-position dragging. Saved price/bar anchors remain unchanged by viewport scaling.
Validation: 257 regression tests passed before the capture-phase refinement; focused drawing tests rerun afterward. Browser price-axis inspection exposed the event propagation issue; the final browser reload timed out, so final interactive verification remains outstanding. Local review only; not published.


Panning recovery correction: deep-copy scroll/scale settings before disabling drawing gestures; the chart library mutates its option objects in place. Restore gestures on window pointer-up, pointer-cancel and blur as well as SVG release. The regression harness now mimics in-place option mutation. All 10 focused drawing tests pass. Browser confirmed initial chart panning and position movement; the final follow-up drag timed out.
