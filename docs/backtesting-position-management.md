# Backtesting position management

Compared the current replay UI with the six user-supplied screenshots of the
project and Goat Funded Trader. The engine already supported partial exits;
the Open trades table did not expose them. This update reuses that execution
model and adds explicit controls in the table and position banner.

- The close dialog accepts 25/50/75/100% presets, a percentage slider, a custom
  percentage, forex lots or base units. It previews the quantity closing and
  remaining size. Percentages always refer to the remaining position.
- Full and partial closes queue for the next source candle open. Sizes do not
  change until replay processes that candle. Configured costs and stop/target
  gap priority still apply. A second close request is rejected while queued.
- Open rows show unrealized P&L separately from realized partial-exit results.
  Partial exits retain the Open tab while a remainder exists; a full exit
  switches to Closed exits. Reopening a session selects its relevant tab.
- Edit controls change a pending order's entry/SL/TP, or an open position's
  SL/TP. Size, direction, type and original trade risk are retained. Levels
  become effective on subsequent candles; historical exits are not rewritten.
- Moving a stop to entry is a preparation button, followed by Save levels.
  It is validated against the last revealed price and does not claim to cover
  fees, slippage or gaps. Original risk remains the denominator for R results.
- Edits append a validated `amend` event to the existing action history.
  Single-market and shared-clock portfolio restoration replay these events.
  Existing session IDs, storage keys, snapshots and account sync are retained.
- Position dialogs use the existing charcoal/gold or light palette. The mixed
  dark header/light body shown in the screenshot is corrected. Table actions
  use compact accessible icon buttons. Mobile dialogs scroll without page
  overflow. Drawing-to-order opens the Order panel even if Journal was active.

Validation: 162 Node tests passed, including quantity conversion, invalid sizes,
prospective amendments, original-risk retention, pending edits and portfolio
restoration. Browser checks on bundled historical EURUSD candles covered a
0.1-lot entry, 25% partial close to 0.075 lots, persistence, level edits, full
closure, pending-entry edits, dark/light themes and a 390px phone frame.
No real orders or account credentials are involved in the isolated preview.

The source screenshots show one or more Goat positions, while this engine
continues to allow one position/pending order per market. This update does not
claim multiple simultaneous positions in the same market or tick execution.
