# Backtesting reference inspection — 6 November 2026

Inspected the signed-in Goat Funded simulator: session grid/list, searchable pair picker, date fields, session settings (info/time/costs), analytics, shortcut help, order ticket, and position table.

Created separate simulated inspection sessions. A delayed browser response caused two test sessions with the same name; the original Untitled session was not traded in. In test session 99433, Alt+O opened the order panel while the embedded chart remained at Almost ready. Submitting a simulated market order returned Chart price not ready yet — wait for the chart to load. No fill occurred. Chart drawing interactions and successful reference fills could therefore not be verified. Do not claim full parity.

Applied the confirmed presentation: Poppins, grouped balance tiles, pill controls, floating replay, compact toolbar, blue Stats treatment, yellow active position tabs, larger order fields and grouped risk controls. Extra research commands are accessible in Research & chart tools; review queue follows the positions table. Dashboard filters now use one disclosure. The existing date-only picker with optional UTC times, actual prices, future-candle protection, accounting, storage and drawing implementation remain in place.

Validation: 250 existing automated tests passed. Isolated local account with actual archived EURUSD prices completed market entry, next-bar fill, next-open exit, position metrics and automatic trade review. The QA account never writes to the owner's database.
