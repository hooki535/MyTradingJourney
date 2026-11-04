# Second history for MyTradingJourney

The existing backtesting app in this repository remains the consumer. The new
download tools do not replace the homepage, account system or replay engine.

## Run the private archive worker

```text
python tools/download-second-history.py --out LOCAL_PRIVATE_ARCHIVE --until 2026-11-04T00:00:00Z
```

Use an exclusive, completed UTC hour. `--start` defaults to 2000-01-01, but the
actual start for each instrument is clipped to its documented tick-history start
in `tools/seconds-instruments.json`. US30 maps to the approved USA30IDXUSD CFD.
The November 4 run downloads through November 3; incomplete hours are excluded.

There are 22 instruments. Work proceeds from recent hours backward across every
instrument. Every source hour has a compressed original containing both BID and
ASK ticks and a compressed S1 candle file. No seconds with no ticks are generated.
Tick count measures observations, not market trading volume. Integer source
prices are converted using the documented instrument scale, without rounding to
fewer digits. Larger intervals can be aggregated from observed lower intervals;
weekly and monthly boundaries must use the existing calendar aggregation rules.

`progress.sqlite3` records hashes and exact counts. `cursors.json` checkpoints
the next unprocessed hour; interrupted hours are retried. `status.json` reports
progress, and `coverage-plan.json` records actual source bounds and total planned
requests. Re-running skips verified files. An exclusive lock prevents two workers
from writing the same directory. After a crash, check its PID before removing a
stale worker.lock. Create a STOP file to pause between requests.

The default limits are a 4-second request pause, a 20 GiB archive budget and a
20 GiB free-disk reserve. The worker pauses at these limits. It stops on HTTP
401, 403 or 429 without circumventing provider restrictions. A missing hour is
recorded separately from a network error, and a failed hour never advances its
cursor. Full tick history is a substantial download; these limits are not a claim
that all years fit in the available local space.

## Website and cloud status

These downloads are private local artifacts, outside the GitHub Pages tree. They
are **not automatically uploaded or available in the website's source selector**.
The current shared cloud catalog contains H1/D1 history; its current monthly
packager and browser reader do not accept the new hourly BID/ASK S1 format.
The existing daily H1/D1 update remains separate and has source-publication delays.

Before offering S1 replay online, add a bounded S1 range reader and storage that
can hold the archive, preserve account access controls and test second-level
execution/replay. Do not stuff decades of tick data into the existing free
database or add a one-second selector backed by hourly candles. No paid storage
or service has been purchased by this change, and no source permission flags or
account policies have been changed.

References: [tick/S1 format and scale of downloads](https://www.dukascopy-node.app/downloading-tick-data),
[instrument metadata](https://github.com/Leo4815162342/dukascopy-node/blob/master/src/utils/instrument-meta-data/generated/instrument-meta-data.json),
[Dukascopy history interface](https://www.dukascopy.com/swiss/docs/interfaces/IHistory.htm).
