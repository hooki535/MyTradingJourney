# Before and after trade charts

The trade-review dialog now uses the same interactive Lightweight Charts
renderer and custom drawing engine as replay. The static candle SVG has been
removed. Review includes a tool rail with searchable group menus, pan/zoom,
timeframe selection, Before/After tabs, side-by-side comparison, object
selection/hide/lock, undo/redo, deletion, and drawing properties.

The order ticket's **Review setup chart** opens a planning view before an order
is placed. Saving applies its drawings to the live replay without submitting
an order. New orders automatically freeze their submission-time annotations,
levels, indicator selection, chart type and timeframe. Each exit, including a
partial exit, records a separate after-state. No candle data is duplicated in
these vector snapshots. Review data is limited to the submission prefix or
exit prefix; Before does not show the actual future market fill or exit marker.

`tradeCharts` is an optional addition to the existing session/market snapshot.
Its keys reuse the established execution key, with symbol scope supplied by
the market. `before` and `after` retain captured originals. `beforeReview` and
`afterReview` hold editable review copies. Saving review annotations does not
change the replay cursor, live drawings, orders, execution history or results.
Previous/Next exit saves the current review before navigating. Manual Discard
leaves the current review draft unapplied. Existing review notes keep their
original record keys and fields.

Session restoration sanitizes drawing properties and rejects snapshot cursors
beyond the relevant decision/exit boundary. Older sessions remain supported;
when original captures are absent, the chart explicitly labels its view as
reconstructed history using the current session's drawing state. It does not
present those drawings as a historical capture. Partial exits retain distinct
after snapshots and the same original setup capture.

Completed replay operations that produce an exit pause and open its review.
When several exits occur in the same operation, navigation exposes each exit.
The before/after chart level range includes the planned entry, stop and target
instead of clipping off-price levels from the miniature chart scale.

Drawing settings keep their validated Style, Coordinates, Visibility and
Template behavior. Text and font controls now have a separate Text tab where
supported. Tabs support arrow/Home/End keyboard navigation. Review properties
open in a separate modal so the chart and draft remain intact; both property
dialogs follow dark/light appearance. Each chart now has its own SVG clipping
identifier, preventing drawings from being clipped by another chart instance.

References:
- https://www.tradingview.com/support/solutions/43000518095-trendline-drawing-tool/
- https://www.tradingview.com/support/solutions/43000516984-rectangle-drawing-tool/
- https://tradingview.github.io/lightweight-charts/docs/api/interfaces/SeriesOptionsCommon

The requested public TradingView chart page denied automated retrieval. The
official drawing-tool and chart API documentation supplied the settings and
scale references. No proprietary charting-library code or account integration
is included.

Validation: the full 169-test Node suite, including seven new tests for capture
immutability, candle-prefix limits, original-versus-review drawings, portfolio
scope, partial exits, legacy histories, invalid cursors and snapshot cleaning.
Browser QA covers setup drawing save, order submission, automatic partial-exit
review, drawing and precise coordinates, properties/Text tab, save/reload,
repeated Compare toggles, trade navigation, dark/light themes and phone layout.
