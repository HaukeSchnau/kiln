# Kiln web UI v0: brief

Kiln is Hauke's CI/CD system (Effect TypeScript, Nix, his fleet of srv-1, srv-2 and m1). The design exploration lives in `~/Code/CI-CD-Lab/doc/` (published at https://files.schnau.dev/html/ci-cd-lab/). Hauke chose the prototype in `~/Code/CI-CD-Lab/doc/kiln-ui/`: the "Workbench" (direction A in `doc/ui-dirs/a/`) with the "Console" overview brought in from direction B (`doc/ui-dirs/b/`). He also wants B's rollout page "as the page behind every rollout". Read `doc/ui-dirs/BRIEF.md` for what he values and the AI tells he hates. Read the prototype's code and look at its screenshots (`doc/kiln-ui/shot-*.png`) before you write anything.

Your job: build the real UI v0 in `~/Code/kiln/packages/ui/` as React 19 + Vite 8 + TypeScript, on real data from the controller, keeping the prototype's look (dark theme, fonts, density, glaze colors by content hash, graph view, hairlines and no cards).

## Ownership

- You own `~/Code/kiln/packages/ui/` only. Don't edit other packages. The rest of the repo is being written at the same time by another agent (the controller in `packages/kiln`).
- `packages/api` (`@kiln/api`) is the contract: `src/Domain.ts` (Schemas) and `src/UiRpc.ts` (`UiRpcs`, an Effect RPC group). Treat it as read-only. If something in it blocks you, write down what you need in `packages/ui/NOTES.md` and work around it in the UI.
- The repo uses jj, but don't commit. Your final message hands over the files.

## Transport

- The controller serves the built UI (`packages/ui/dist`) and the RPC group over a WebSocket at `/rpc` on the same origin, using `RpcServer.layerProtocolWebsocket({ path: "/rpc" })` with `RpcSerialization.layerJson`.
- Use `effect@4.0.0` and `@effect/atom-react@4.0.0` (AtomRpc) or a plain RPC client. Check exact APIs in `~/context/effect-ts-effect` (checked out at tag effect@4.0.0), not from memory.
- `changes` is a stream of updates the UI applies to what it loaded. `logs` streams history and then live lines.
- Write a mock server, `packages/ui/mock/server.ts`, run with Bun. It implements `UiRpcs` with deterministic fake data that looks like Hauke's real projects (studienbuch, t3code, portfolio, hopwatch, igs, merkbeet, anna-fotoalbum, ralfs-audio-finder). Include a running run with live logs and changes, a failed run with failing tests and an excerpt, reused steps, a deploy in progress, and two hosts (srv-1, srv-2). Use the same server layers as above. The Vite dev server proxies `/rpc` to it.

## Pages

1. **Overview (home).** It answers in two seconds what is red, what is running, and what is deploying where. Use the Console overview from the prototype, so the navigator stays hidden here. Show projects with main status, a sparkline of recent runs, and deployments per host; then active runs and recent runs.
2. **Run page** (`#/run/<id>`). Header: project, run number, commit or PR title, jj change id when present, event, status, duration. The step graph comes from needs, after and exits (required edges marked), and every node is colored by its key's glaze. Failure comes first: if a step failed, it is selected and its error excerpt and failing tests show without a click. The inspector for the selected step has these tabs:
   - logs: live follow, filter by level and stream, search
   - trace: a waterfall from `trace`, the step's span highlighted
   - metrics: `stepMetrics` while running, `stepStats` for history
   - tests: failing first, flaky marked, history from `testHistory`
   - value or error
   
   Selecting a step drives every tab. Show reused steps as reused, with a link to the run they came from. Siblings (other runs of the same change or PR) appear as a compact list.
3. **Rollout page** (`#/run/<id>/rollout`). It is linked from any run whose action step deploys, and from deployments on the overview. Bring in B's rollout page: per host the previous, deploying and live revision, with time and health, plus the deploy step's log and trace lines. Real data is only what `Domain.Deployment` and the steps give you. Don't invent bake metrics we don't have; leave the space out rather than faking it.
4. **Project page** (`#/project/<name>`): runs list with filters (branch or PR, status), step duration history.
5. **Command palette** on Cmd-K / Ctrl-K. It goes to a project or run, triggers a run of a project's default branch, and cancels or reruns the current run.
6. **Phone (390 px wide).** The overview, a run's failure and the palette must work.

## Quality bar

Hauke judged earlier UIs "sloppy", "card heavy", full of "AI tells", with "too much going on". He wants a professional tool for experts: dense but calm, the important bits at a glance, aligned columns, tabular numerals, colour only for status and identity, terse sentence-case labels, no em dashes in copy, no emoji, no gradients or glows, no pills for everything. Take screenshots with agent-browser (own session: `export AGENT_BROWSER_SESSION=kiln-ui-v0`; `agent-browser skills get core` first) at 1512×945 and 390×844. Review them critically, at least three rounds. Save the final screenshots as `packages/ui/shot-overview.png`, `shot-run.png`, `shot-rollout.png` and `shot-phone.png`.

## Technical

- Package `@kiln/ui` in the pnpm workspace (`packages/*` is already included). Run `pnpm install` from `~/Code/kiln`. Use exact versions: react 19.3.0, react-dom 19.3.0, vite 8.3.2, @vitejs/plugin-react 6.1.1, typescript 7.0.2 (root), effect 4.0.0.
- `pnpm --filter @kiln/ui build` must produce `dist/` with relative asset paths. `tsc -p packages/ui` must pass with the root `tsconfig.base.json` settings. Add `"lib": ["ES2024", "DOM", "DOM.Iterable"]` and `"jsx": "react-jsx"` in your own tsconfig.
- Serve for testing on 127.0.0.1 only (ports 8790 to 8799 are yours). Stop servers when you're done. `pkill -f` kills its own shell; use `pgrep -f '[v]ite'` and kill pids.
- Keep the code idiomatic and typed, with no `any` and no one-line casting wrappers. Comment only what the code can't say.

## Deliverable

Your final message lists the files, gives at most eight sentences of design rationale, says what you're unsure about and what you needed from the API, and gives the screenshot paths.
