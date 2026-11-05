# Drawing tool behaviour and properties — 5 November 2026

## Inspection

The supplied screenshot shows the Long Position tool waiting for a second anchor. In the implementation, the second point combined the stop price with the horizontal extent, which made width changes also move the stop. The settings adapter omitted account size and risk inputs, and the renderer displayed only basic target/stop labels.

The reference used was TradingView's public documentation for [Long Position](https://www.tradingview.com/support/solutions/43000517002-long-position-drawing-tool/) and [position sizing](https://www.tradingview.com/support/solutions/43000475660-how-to-use-long-and-short-position-drawing-tools/). An attempt to interact with Long Position on the live TradingView chart reached its sign-in requirement before a drawing could be placed. No claim is made that live TradingView placement was tested. Earlier authenticated Goat chart inspections are recorded separately.

## Result

- Long and Short Position place a complete annotation with one click. A pointer preview shows profit and loss zones before saving. Initial stop distance uses only revealed display candles; default width is 15 displayed bars and default target is 2R.
- Entry, stop, target and right edge have separate handles. Stop/target drags keep width fixed, and width changes preserve all prices. Body dragging moves the complete drawing. Invalid price ordering is rejected. Drawing undo/redo and lock remain available.
- Position properties have Inputs, Style and Visibility tabs. Inputs include account size, risk %, units per lot, cash multiplier, quantity precision, entry, stop, target and source-bar coordinates. These are annotation estimates; they do not submit or amend orders.
- Sizing is rounded down to the requested quantity precision. Risk and reward cash values derive from the displayed quantity and saved contract inputs. Fees, slippage, margin/leverage constraints and changing FX conversion are outside this drawing estimate. Initial point value uses the session multiplier, or its entry-price inverse for inverse FX sessions; the user can edit it explicitly.
- Style controls change profit/stop colors and opacity, boundary lines, text, price labels, statistics visibility and compact labels.
- All registered tools use the shared compact properties window, keyboard-navigable tabs, scrollable content, stable template/Cancel/OK footer, responsive rows and draggable heading. Closing removes drawing-only styling before another form opens. Templates preserve edited geometry and Cancel does not commit edits.
- Additional implemented controls cover line extension and measurement statistics, channel background, pattern label/ratio visibility and label fonts. Quick controls omit line width/style for icons that do not support them. Advanced reference controls without a renderer implementation remain omitted rather than becoming inert settings.

Existing annotation formats, template storage keys, historical candle sources, replay execution and simulated account orders are preserved. Previously saved two-point position drawings still restore. This change is an original implementation using the existing custom chart; it does not bundle TradingView's proprietary drawing engine.

## Validation

All 240 Node tests pass, including six new drawing tests for placement, independent drags, preview isolation, undo/redo, risk sizing, saved inputs, style effects and pattern labels. An isolated DOM harness opened and submitted properties for all 242 registry entries (including glyphs), checked tab visibility and ARIA targets, and verified Cancel and template geometry isolation. Syntax and whitespace checks pass.

The DOM harness uses controlled drawings and performs no account/database writes. Signed-in live MyTradingJourney visual checks remain outstanding; this is not a claim of pixel-perfect parity or exhaustive live testing of every advanced tool.
