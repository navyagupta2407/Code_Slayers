# GRAVITON 2026 — Member 4 GIS dashboard

**Standalone runnable GIS frontend** for Member 4 (map, filters, evidence counts, charts, geocoding client and QA). All bundled incidents are **synthetic**, not real alerts. This is not a complete 4-person end-to-end product: Member 1 owns shared authentication/navigation; Member 2 AI grouping; Member 3 backend and authorization.

## 0. What you need

- Laptop, internet for package install and live map tiles, **Node.js 20.19+ or 22.12+** (Node 22 LTS is a practical choice), Git, VS Code, Chrome/Edge.
- No API key is needed for demo mode. No Python/Supabase/Azure is needed for *your standalone frontend*.
- VS Code: open the `graviton-gis` folder through **File > Open Folder**. **Terminal > New Terminal** opens the integrated terminal (shortcut Ctrl+`).
- Optional: install VS Code extensions ESLint and Prettier through Extensions icon on left bar.
- Terminal location must be the folder containing `package.json` (`pwd` macOS/Linux; `cd` Windows).

## 1. Run in demo mode — do this FIRST (minutes 0–20)

1. Download/extract the archive; rename folder if you wish.
2. Open terminal in the project directory.
3. Run `node -v` and `npm -v`; if missing, install Node.js LTS from https://nodejs.org and reopen terminal.
4. Run `npm install` (uses your laptop's internet to download packages).
5. Copy `.env.example` to `.env` (VS Code Explorer > right click `.env.example` > Copy > Paste > rename `.env`; or `cp .env.example .env` in macOS/Linux / `copy .env.example .env` in Windows cmd).
6. Confirm `.env` says `VITE_USE_API=false`.
7. Run `npm run dev` and open the local link Vite prints (usually http://localhost:5173) in browser.
8. See six synthetic incidents: five located markers, one unlocated report. Map tile background needs the internet. Do not use actual citizen photos in synthetic demo without consent.
9. To stop server: press `Ctrl+C` in the terminal.

**Windows PowerShell notes:** `Copy-Item .env.example .env`; `Get-Location` for current folder. On Windows, use regular slash `/` in source imports, even if File Explorer displays backslashes.

## 2. Chronological feature walkthrough (minutes 20–120)

1. `src/data/demoIncidents.js`: six fake incident objects, each representing **one canonical incident**, with `report_count` and individual supporting reports.
2. `src/lib/gis.js`: validation, filtering, summary logic. Run `npm test`.
3. `src/components/DisasterMap.jsx`: Leaflet map, circles keyed by incident ID, colors by **verification status**. Click a marker: popup; click popup action: select evidence.
4. `src/App.jsx`: top-row search field matches incident title/ID/description; `All statuses` dropdown changes verification filter; `All disasters` changes type; confidence slider filters threshold; incident feed on right focuses map on selection.
5. `src/components/IncidentDetail.jsx`: shows linked media metadata and `duplicate_report_count`. **Never count duplicate evidence as additional incidents**.
6. `src/components/Analytics.jsx`: summary counters and incident-type bar chart, based on the current filtered dataset.
7. `src/styles.css`: desktop layout, color palette, responsiveness. `@media` rules at end control mobile behavior.
8. `src/lib/api.js`: two API request functions you will switch on after Member 3 finishes their backend.

## 3. Where files live / responsibility

```text
graviton-gis/
├── .env.example                # settings template (copy to .env)
├── .gitignore                  # ignores node_modules/
dist/
.env
.env.*
!.env.example
.DS_Store
coverage/
├── index.html                  # HTML entry point
├── package.json                # packages and npm commands
├── vite.config.js              # Vite + React + Vitest config
├── README.md                   # this guide
├── tests/
│   └── gis.test.js             # data / filter unit tests
└── src/
    ├── main.jsx               # React starts here; Leaflet CSS
    ├── App.jsx                # overall GIS dashboard
    ├── styles.css             # styling and mobile responsive rules
    ├── components/
    │   ├── DisasterMap.jsx    # React Leaflet interactive map
    │   ├── IncidentDetail.jsx # evidence inspector
    │   └── Analytics.jsx      # counts and Recharts bar graph
    ├── lib/
    │   ├── api.js              # FastAPI fetch + geocoding POST
    │   └── gis.js              # GIS data functions
    └── data/
        └── demoIncidents.js    # synthetic data for isolated work
```

## 4. Buttons / controls: exactly where to find them

- **Header > top right > refresh icon:** resets demo data or fetches API again in live mode.
- **Main content > Search incidents:** case-insensitive search for incident ID / title / description.
- **Main content > All statuses:** choose verified/pending/rejected.
- **Main content > All disasters:** choose flood/storm/etc.
- **Main content > Min AI confidence:** move slider from 0 to 100; values are presentation scores and do *not* prove a report is true.
- **Map > +/- on left:** zoom; mouse wheel zooms; click a colored circle for popup; click **View evidence →** to select its inspector.
- **Map > bottom left:** marker color legend (green verified, yellow pending, red rejected). Note colors mean *review state*, not severity.
- **Under map > Lookup a location + Find place:** active only once backend geocoding endpoint exists. Typing does not trigger live autocomplete (deliberate API rate-limit consideration). Place search output is not an incident marker.
- **Right sidebar > Incident feed:** click an incident row to focus map; item with unknown coords is intentionally not mapped.
- **Right sidebar > Evidence inspector:** shows details for selected item.
- **Lower main column > summary cards and bar graph:** analytics update with filters.

## 5. Integrate with team repo (hours 2–5)

**Member 1 decides the integration path and code conventions.** The downloaded project is a *standalone reference*, not something to overwrite the team's main React application with.

1. Agree on React version (this starter targets React 19 and React Leaflet 5).
2. Ask Member 1 for the GitHub repository URL and your repo permissions; open terminal: `git clone <TEAM_REPO_URL>`; `cd <TEAM_REPO_FOLDER>`; `git checkout -b feature/gis-dashboard`.
3. Ask Member 1 to install missing dependencies: `npm install leaflet react-leaflet recharts lucide-react`, and import `leaflet/dist/leaflet.css` once.
4. Copy these folders/files into the existing team project's `src/`, **adapting paths**: `src/components/{DisasterMap,Analytics,IncidentDetail}.jsx`, `src/lib/{api,gis}.js`, `src/data/demoIncidents.js`. Reuse the code in `src/App.jsx` but **rename and extract** it to `src/pages/GISDashboard.jsx` and import the team layout/header instead of replacing the main App.
5. Ask Member 1 to add a *protected route* for `/dashboard/map`. Member 1 should pass a short-lived auth access token from the auth context into `<GISDashboard token={token}/>`.
6. Copy/map relevant style declarations into team CSS only after checking for classname collisions. Namespacing `.gis-` prefix is recommended if team already uses the same CSS class names.
7. Commit from your feature branch: `git add .`; `git commit -m "feat: gis incident dashboard"`; `git push -u origin feature/gis-dashboard`. Open GitHub > Pull requests > New pull request > base `main`, compare `feature/gis-dashboard` > Create pull request, ask Member 1 to review and merge.

**Never commit `.env`, service-role keys or private credentials.** Frontend environment variables starting `VITE_` are bundled into the browser and therefore **not secret**.

## 6. Backend contract: give this to Member 3 (hours 5–8)

Must be implemented and protected **on FastAPI**, not merely hidden in the browser.

`GET /api/incidents` -> JSON **array** (or `{ "incidents": [...] }`) of canonical incidents. Each object:

```json
{
  "id": "INC-001",
  "title": "Flood report",
  "description": "Citizen-submitted evidence, awaiting independent review",
  "latitude": 30.9009,
  "longitude": 75.8573,
  "disaster_type": "flood",
  "verification_status": "pending",
  "ai_confidence": 0.86,
  "location_confidence": 0.72,
  "location_source": "citizen_gps",
  "severity": "high",
  "report_count": 3,
  "duplicate_report_count": 2,
  "created_at": "2026-10-31T06:30:00Z",
  "reports": [
    {"id":"REP-101","label":"Submitted photograph","similarity":"primary"},
    {"id":"REP-102","label":"Similar scene","similarity":"visually similar"},
    {"id":"REP-103","label":"Same event observation","similarity":"same incident"}
  ]
}
```

`POST /api/geocode` with JSON `{ "query": "Kharar, Punjab, India" }` -> `{ "latitude": 30.746, "longitude": 76.65, "display_name": "..." }` (values here are illustrative). Member 3 must configure an approved provider, rate-limit, cache results, validate input, and handle upstream errors. See policies below. A typed address is *not* independently verified photo geolocation.

**Validation rules:** coords are decimal numeric or null; latitude -90..90 and longitude -180..180; status enum pending/verified/rejected; AI confidence floats 0..1; counts integers >= 0; `duplicate_report_count <= report_count - 1` where report_count > 0; UTC ISO timestamps; use unique incident IDs; `reports` may be empty but the detail view will explain. Backend authorization decides who may access personal media/precise coordinates. Public/citizen view may require obscuring sensitive locations.

**Recommended production split:** `GET /api/incidents` returns lean summary objects; `GET /api/incidents/{id}` returns media evidence on selection. The starter accepts embedded reports for speed and does **not** yet fetch a separate detail endpoint.

## 7. Switch to real API (hours 8–11)

1. Ask Member 3 for a running backend at `http://localhost:8000` and to enable CORS origin `http://localhost:5173` (and production frontend origin). Never use a wildcard origin with credentialed requests.
2. Ensure the backend implements `GET /api/incidents` with the agreed data contract, supports auth tokens in the `Authorization: Bearer ...` header, and has appropriate role checks.
3. In `.env` set `VITE_USE_API=true` and `VITE_API_URL=http://localhost:8000`.
4. **Stop and restart** `npm run dev` after changing `.env`.
5. The standalone `src/main.jsx` mounts `<App/>` without token and therefore **will receive 401** from a secured API. For real authenticated integration, Member 1 must mount `<GISDashboard token={accessToken}/>` using the team's real auth context. **Do not bypass server auth to make the demo work.**
6. Use browser devtools: F12 > **Network** > filter `Fetch/XHR` > inspect `/api/incidents` request, status and JSON. Check **Console** for exceptions.
7. Only after confirmed API integration test **Find place**, which depends on `POST /api/geocode` and requires a correctly configured geocoding provider.
8. Live mode polls every 30 seconds and has manual refresh; API failures show an error banner, not hidden fake fallback.

## 8. QA and test (hours 11–16)

Run:

```bash
npm test
npm run build
npm run preview
```

`npm test` validates filters, coordinates, counts, unknown-confidence formatting. `npm run build` creates `dist/` static assets; `npm run preview` hosts that build (usually port 4173). For true end-to-end tests, use browser interactions manually or add Playwright to the team's main test suite. Verify:

- 6 synthetic incidents, 5 mapped, 1 missing coordinate.
- Status filter -> two verified records.
- Disaster filter flood -> two records.
- Selecting a row moves focus to that marker.
- A single canonical incident can show five evidence reports and four duplicates; does not create five markers.
- API 401/403 shows an error and never exposes private data.
- Responsive DevTools: F12 > Toggle device toolbar (Ctrl+Shift+M); choose phone width.
- Geocoding failure shows understandable message; no continuous autocomplete.
- Tile copyright attribution stays visible.
- Do not present synthetic incident data as real emergency information.

## 9. Presentation practice (hours 16–20)

1. Announce **Synthetic Demo Mode**.
2. Show all six incidents, then verified-only.
3. Select Ludhiana synthetic flood: **five reports, one canonical incident**.
4. Demonstrate evidence inspector and location source/confidence.
5. Show bar chart and explain incidents versus submissions.
6. Explain that **AI confidence is not official verification**, and estimated locations remain uncertain.
7. Switch to team's integrated live mode *only if API and auth are working*.

## 10. Final contingency plan (hours 20–24)

- If backend is down: set `VITE_USE_API=false`, restart, visibly use **synthetic demo mode**.
- If map tiles fail due to poor connectivity: show pre-captured screenshots of your app; **this ZIP does not include offline OSM tiles**. Public OSM tiles cannot be bulk downloaded for offline use.
- If geocoding is down: search is noncritical; use sample incident coordinates. Do not present guessed positions as verified.
- Freeze code, run build/tests, leave the deployed/preview URL open before judging.

## 11. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `npm is not recognized` | Node not installed/PATH old | Install Node LTS; reopen VS Code terminal |
| `npm install` hangs | No internet, proxy, registry issue | Check connectivity; try `npm config get registry`; avoid random registry scripts |
| White page | JS import error | F12 > Console; ensure `npm install` completed |
| Empty grey map | Map container height/CSS or tile network | Import Leaflet CSS (`main.jsx`); check `.leaflet-map` height; Network tab for tile requests |
| 401/403 in live mode | Token missing/invalid, backend RBAC | Ask Member 1 for token context and Member 3 to check claims/role; do not disable RBAC |
| CORS error | Backend origin settings | Member 3 adds exact frontend origin |
| Location search disabled | Demo mode, no backend | It requires live `POST /api/geocode` |
| Blank bar chart | No incidents after filters | Set filters to All; check API fields |
| Port 5173 already used | Another Vite server open | Use Vite's displayed link or stop prior server |
| React mismatch | Team uses React 18 | Decide versions with Member 1; do not blindly force React Leaflet 5 |
| `git push` denied | No repo permissions | Ask team leader to grant collaborator access |

## 12. Map/geocoding provider obligations

- [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/): visible attribution, use required HTTPS template, no bulk tile scraping/prefetching, respect HTTP caching, valid browser Referer; best-effort service, not guaranteed.
- [Nominatim public usage policy](https://operations.osmfoundation.org/policies/nominatim/): maximum one request per second for the entire app, proper identifying User-Agent/Referer, cache results, no client-side autocomplete, avoid bulk geocoding. Member 3 must **deliberately choose** whether its public service fits this limited demo and implement compliant request throttling/caching or choose a different geocoding provider.
- This map is a hackathon prototype, not a source of real emergency instructions.

## 13. What this starter DOES and DOES NOT include

**Included:** frontend UI and responsive CSS, map markers/popup/focus, status/type/text/confidence filters, five located synthetic city examples + one unknown location, grouped evidence inspector, analytics, optional backend fetch, optional backend geocoder client, unit tests.

**Not included:** real AI/ML, upload processing, backend FastAPI or Supabase, authentication provider, role access checking, image verification, official IMD/NDMA connection, official disaster alerts, cluster algorithm, real streaming. Those belong to other teammates or later phases. The `report_count` is grouped evidence from Member 2/3 and the circles are **one per canonical incident**, not a geographic clustering engine.
