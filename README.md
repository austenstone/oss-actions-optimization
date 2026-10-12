# OSS Actions optimization

A live report on using AI agents to find and fix wasted GitHub Actions minutes in popular open source repos.

**View it:** https://austenstone.github.io/oss-actions-optimization/

Each finding has the repo and workflow, the problem, the fix, a measured number from public run history, and an estimated weekly saving. PR states (open, merged, closed) load live from the GitHub API when the page opens.

## How the work gets done

Agents use the public [actions-optimization skill](https://github.com/austenstone/.copilot/tree/main/plugins/actions/skills/actions-optimization) on each repo:

1. **Find:** shortlist busy public repos and their heaviest workflows.
2. **Measure:** pull runs, jobs and step timing from the public Actions API.
3. **Fix:** write the smallest diff that removes the strongest finding.
4. **Ship:** validate on a fork where possible, then open a short upstream PR.

## Update the report

All content lives in [`data.json`](data.json). Add or edit an entry in `findings`:

```json
{
  "repo": "owner/name",
  "workflow": ".github/workflows/ci.yml",
  "status": "pr",
  "pr": 123,
  "title": "Short change title",
  "pattern": "No-op matrix shards",
  "problem": "What wastes minutes, in one or two sentences.",
  "fix": "What the change does.",
  "measured": "Window and numbers from public run data.",
  "estimatedMinPerWeek": 1000
}
```

`status` is one of `pr`, `blocked`, `held` or `scanning`. Bump `updated`, then push to `main`. GitHub Pages deploys from the root of `main`.

Preview locally:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Data rules

- Public data only. Every number comes from the public GitHub Actions API.
- Measured and estimated numbers are always labeled separately.
- Savings are in runner minutes, not dollars. Public repos run free on standard GitHub-hosted runners.
