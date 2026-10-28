# Restored backtesting layout

The entry page now loads `backtesting-goat.css` instead of `backtesting-pro.css`.
It restores the project's earlier charcoal surfaces, gold controls, rounded
session cards, compact replay sidebar and floating playback. Light mode keeps
the same layout with warm neutral surfaces. Other pages keep their shared theme.

The sessions page shows Backtesting, My sessions, Strategies, Challenges and My
stats above its existing search, sorting and instrument filters. The research
promotion banner and overview tiles have been removed from this view. Research
briefs remain available on each session card and within replay.

Playback starts over the chart. Sync, timestep and Pause on exit are grouped
under Replay options. The dropdown closes on Escape or outside pointer input.
Docking remains optional. Go to stays in the main chart toolbar. The simulation
engine, stored sessions, trades, annotations, account synchronization, analytics,
challenge rules and all recently added replay functions remain unchanged.

This restores the earlier project design requested by the user. It does not
claim a pixel-perfect copy of Goat Funded Trader's authenticated workspace.

Validation: 154 Node tests; browser checks of dark and light appearance, session
cards, replay step, order ticket, replay options and docking, plus a 390px phone
viewport with no horizontal page overflow and usable session-creation dialog.
