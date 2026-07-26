## 2026-07-22T05:43:20Z

You are an Explorer agent assigned to run empirical analysis on the ReactTicketing codebase using fallow tools.
Your working directory is /Users/davidcutura/Projects/ReactTicketing/.agents/explorer_fallow.

Task:

1. Run `fallow audit --format json --quiet` across the repository at /Users/davidcutura/Projects/ReactTicketing.
2. Run `fallow health --format json --quiet`, `fallow health --hotspots --targets`, `fallow health --ownership`, `fallow health --coverage-gaps`.
3. Run `fallow dead-code --format json --quiet` and `fallow dupes --format json --quiet`.
4. Run `fallow list --entry-points --format json --quiet` and `fallow list --boundaries --format json --quiet`.
5. Run `fallow flags` and `fallow security` if applicable.
6. Summarize all fallow output and findings cleanly in `/Users/davidcutura/Projects/ReactTicketing/.agents/explorer_fallow/analysis.md`.
7. Deliver a handoff report at `/Users/davidcutura/Projects/ReactTicketing/.agents/explorer_fallow/handoff.md` and send a message back to the orchestrator.

Make sure to log all tool commands and raw/parsed output summaries.
