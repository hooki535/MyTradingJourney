# Minute through monthly replay

New account database sessions prefer EURUSD's minute archive when available.
Minute sessions enable 1m, 5m, 15m, 30m, 1H, 2H, 4H, 1D, 1W and 1M, along with
the other existing chart intervals. Prices come from the selected archive.
Hourly/daily sessions keep their original data and execution history; the
Minute data button opens a new session rather than changing past fills.

The initial minute rollout covers the downloaded 2026 HistData files for 20 forex
pairs plus XAUUSD through 16 October. The separate US30/USA30 CFD minute archive
initially covers 12–16 October 2026. These are source coverage limits, not a claim
that every pair has minute history back to 2000. The session form shows each
archive's exact first and last timestamp. Missing/invalid source minutes are not
interpolated. Older H1/D1 archives remain available separately.

Full monthly M1 chunks can contain more than 10,000 candles. The cloud reader
validates all rows in bounded batches; the replay session still loads at most
5,000 by default and never exceeds its 10,000-candle limit.

Sparse higher-timeframe views additionally load earlier H1/D1 display context.
Every coarse source candle must be fully closed before the saved minute dataset
begins. Fine context supplies the initial partial hour/day, and the current
forming display candle uses only the revealed minute prefix. Weekly buckets
start Monday in UTC and monthly buckets follow calendar months. Source gaps
remain gaps. Context lives in memory outside snapshots and order execution.

Validation includes all ten views on real archived minute prices in desktop and
mobile browser fixtures, a monthly chunk exceeding 10,000 rows, rejection of an
invalid row beyond the first batch, unchanged replay candles/actions/cursor and
rejection of a still-forming coarse context candle. Browser fixtures use a
separate mock account and never write to the owner's trading records.
