
DisasterLens AI
GRAVITON 2026 --- Member 4: GIS Dashboard
An India-wide disaster incident GIS dashboard built with React, Vite,
Leaflet, and React Leaflet. This module provides an interactive map,
incident filters, state boundaries, marker clustering, a heatmap
overlay, incident details, and geographic/analytics views.

Demo-data notice: The bundled incidents are synthetic
demonstration records. They are not official disaster alerts, verified
emergency reports, or live government data. Do not use this dashboard
to make emergency decisions.

1. Project status and scope
Current frontend capabilities
India-wide interactive Leaflet map.
Incident markers with verification-status colors.
Marker clustering when multiple incidents are close together.
India state and Union Territory boundaries loaded from GeoJSON.
State selection and map zoom/focus for the selected state.
Incident search and filters.
Minimum AI-confidence filter.
Heatmap overlay that can be switched on and off.
Incident counters for visible, located, and unlocated records.
Incident selection, map focus, popup, and evidence inspector.
Geographic coverage and analytics components.
Demo data for running the frontend without waiting for the backend.
Current demo dataset
The current bundled demo snapshot contains:

Metric Current snapshot

Total incidents 17
Incidents with valid coordinates 16
Incidents without coordinates 1

These numbers describe the current demo file. They will change if
records are added, removed, or edited.

Work that belongs to other team members
This repository folder is the Member 4 GIS frontend module. It is not,
by itself, the complete end-to-end disaster platform.

Member 1: shared application integration, authentication,
navigation, and protected routes.
Member 2: AI/ML processing, evidence similarity, duplicate
detection, and incident grouping.
Member 3: FastAPI backend, database, storage, authentication
verification, authorization, and report APIs.
Member 4: GIS dashboard, map visualization, state boundaries,
geographic coverage, frontend filters, and GIS-related frontend QA.
Backend-dependent features should be treated as pending until Member 3's
APIs are running and the frontend is connected to the team's
authenticated application.

2. Requirements
Install the following before running the project:

Node.js 20.19+ or 22.12+. Node.js 22 LTS is a practical choice.
npm, which is installed with Node.js.
Git.
Visual Studio Code or another code editor.
Chrome, Edge, or another modern browser.
Internet access for package installation and online map tiles.
Check the installed versions in a terminal:

node -v
npm -v
git --version
Open the graviton-gis folder in VS Code:

Open VS Code.
Select File → Open Folder.
Select the folder containing this project's package.json.
Select Terminal → New Terminal.
Confirm that the terminal is in the project root.
The terminal must be in the directory that contains package.json.

3. Install and run the frontend
Step 1 --- Install dependencies
Run this from the project root:

npm install
Wait for installation to finish.

Step 2 --- Create the environment file
The project includes .env.example. Create a local .env file from it.

Windows PowerShell:

Copy-Item .env.example .env
Windows Command Prompt:

copy .env.example .env
macOS/Linux:

cp .env.example .env
For standalone demo mode, check that .env contains:

VITE_USE_API=false
If the example file contains other required frontend settings, preserve
them.

Step 3 --- Start the development server
npm run dev
Vite prints a local URL in the terminal. Open the exact URL it prints.
It is commonly:

http://localhost:5173
If that port is already being used, Vite may choose another port. Use
the URL shown in your terminal rather than assuming the port.

Step 4 --- Stop the server
Click the terminal running Vite and press:

Ctrl + C
Windows PowerShell notes
Use Copy-Item to copy files.
Use Get-Location to check the current directory.
Use Get-ChildItem to list files.
Source-code import paths should use forward slashes, for example
../lib/gis.js.
4. Dashboard features and how to use them
4.1 Incident filters
Use the filter panel above the map:

Search incidents: search by incident ID, title, or other fields
supported by the current filter implementation.
Verification status: show all statuses or select a status such
as verified, pending, or rejected.
Disaster type: filter by the available disaster categories in
the data.
State / UT: select a state or Union Territory to filter the
displayed incidents and focus the map on that state.
Minimum AI confidence: adjust the slider to set the minimum
confidence threshold.
Reset filters: restore the default filter values.
AI confidence is a model score. It is not proof that a report is true or
officially verified.

4.2 Summary counters
The dashboard displays counts for:

Visible incidents after applying the current filters.
Located incidents with usable latitude and longitude.
Unlocated incidents that cannot be placed on the map.
An incident without valid coordinates should remain visible in the
incident list when it matches the filters, but it must not be assigned a
guessed map location.

4.3 India disaster map
The map uses Leaflet and an OpenStreetMap tile layer unless a different
tile URL is configured.

Map controls:

Use + and − to zoom.
Use the mouse wheel or trackpad to zoom.
Drag the map to pan.
Select an incident marker to open its popup and select the incident.
Use the popup action to open or select the incident details, where
available.
Select a state through the state filter or state boundary
interaction to focus the map on that state.
The map starts with an India-wide view. Selecting an individual incident
can focus the map on that incident.

4.4 Marker colors
The incident markers use verification status:

Status Marker color

Verified Green
Pending Amber / orange
Rejected Red

These colors indicate review status, not disaster severity.

4.5 Marker clustering
When several incident markers are close together at the current zoom
level, the map groups them into a cluster.

A cluster displays the number of markers represented by that
cluster.
Select a cluster to zoom toward its markers.
Zoom in to see individual incident markers.
Clustering is a map-display feature. It is not the same as AI-based
duplicate detection or incident grouping.
4.6 Heatmap
Use Show Heatmap to enable the heatmap overlay. Use Hide Heatmap
to turn it off.

The heatmap visualizes the geographic concentration of the currently
supplied located incidents. If the demo dataset contains more incidents
in one area, that area will appear more concentrated. The heatmap does
not mean that every part of India has the same number of incidents, and
it should not be interpreted as an official risk forecast.

4.7 State and Union Territory boundaries
The state boundary layer is loaded from:

src/geojson/india-states.geojson
The GeoJSON contains the boundary features used by the map. The
component reads state names from supported feature properties such as
shapeName, ST_NM, or NAME_1.

State boundaries provide geographic context and selection. They do not
independently verify an incident's location.

4.8 Incident reports and evidence inspector
Select an incident from the incident list or map to inspect its details.

Depending on the fields available in the selected record, the inspector
can show:

Incident ID and title.
State and disaster type.
Verification status.
AI confidence and location confidence.
Location source.
Number of reports and duplicate reports.
Supporting report or evidence metadata.
A group of supporting reports can refer to one canonical incident. Do
not count each duplicate submission as a separate disaster incident.

4.9 Geographic coverage and analytics
The project includes geographic coverage and analytics components. Their
displayed results depend on the records passed to them and the current
filter state.

Always distinguish between:

Incidents: canonical incident records.
Reports/submissions: individual reports associated with an
incident.
Duplicate evidence: repeated or similar submissions that should
not automatically increase the canonical incident count.
5. Project structure
The main project structure is:

graviton-gis/
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── vite.config.js
├── tests/
│   └── gis.test.js
└── src/
    ├── App.jsx
    ├── App.backup.jsx
    ├── main.jsx
    ├── styles.css
    ├── components/
    │   ├── Analytics.jsx
    │   ├── DisasterMap.jsx
    │   ├── GeographicCoverage.jsx
    │   ├── HeatmapLayer.jsx
    │   ├── IncidentDetail.jsx
    │   └── StateBoundaries.jsx
    ├── data/
    │   └── demoIncidents.js
    ├── geojson/
    │   └── india-states.geojson
    └── lib/
        ├── api.js
        └── gis.js
Some files may be added or renamed as the team integrates the GIS
module. The Explorer in VS Code and the actual project files are the
source of truth for the current structure.

Important files
File Responsibility

src/App.jsx Main dashboard, filter state, and
component composition

src/main.jsx React entry point and application
mounting

src/styles.css Dashboard layout, map sizing,
styling, and responsive rules

src/components/DisasterMap.jsx Leaflet map, tile layer, incident
markers, clustering, and map
interactions

src/components/StateBoundaries.jsx Loads and displays state/UT GeoJSON
boundaries

src/components/HeatmapLayer.jsx Heatmap overlay

src/components/IncidentDetail.jsx Selected incident and evidence
details

src/components/Analytics.jsx Incident summary and chart
visualizations

src/components/GeographicCoverage.jsx Geographic coverage
visualization/component

src/data/demoIncidents.js Synthetic incident records for
standalone demo mode

src/geojson/india-states.geojson State and Union Territory boundary
data

src/lib/gis.js Coordinate validation, filtering,
and GIS helper functions

src/lib/api.js Frontend API request helpers

tests/gis.test.js GIS utility and filtering tests

.env.example Example frontend environment
configuration

.gitignore Files and folders that Git should
ignore
Do not edit the generated dist/ directory directly. It is recreated by
the production build.

6. GIS data and coordinate rules
An incident that can be placed on the map needs valid numeric
coordinates.

Latitude must be between -90 and 90.
Longitude must be between -180 and 180.
Missing coordinates should be represented as null or another value
explicitly handled by the application.
Do not replace missing coordinates with a city center or random
coordinates and present them as verified.
Keep the incident ID stable and unique.
Keep verification status separate from AI confidence and location
confidence.
Example incident record
The following is an illustrative data shape. It is not a real incident:

{
  "id": "INC-001",
  "title": "Synthetic flood demonstration",
  "description": "Synthetic record for frontend testing",
  "latitude": 30.9009,
  "longitude": 75.8573,
  "state": "Punjab",
  "disaster_type": "flood",
  "verification_status": "verified",
  "ai_confidence": 0.94,
  "location_confidence": 0.91,
  "location_source": "citizen_gps",
  "severity": "high",
  "report_count": 5,
  "duplicate_report_count": 4,
  "created_at": "2026-10-31T06:30:00Z",
  "reports": [
    {
      "id": "REP-101",
      "label": "Synthetic evidence A",
      "similarity": "primary"
    },
    {
      "id": "REP-102",
      "label": "Synthetic evidence B",
      "similarity": "visually similar"
    }
  ]
}
Validation expectations
latitude and longitude: numeric and within valid geographic
ranges, or null when unavailable.
verification_status: use the agreed values, such as pending,
verified, and rejected.
ai_confidence: numeric score between 0 and 1 if the
application expects a normalized score.
location_confidence: numeric score between 0 and 1 if
supplied.
report_count: non-negative integer.
duplicate_report_count: non-negative integer and no greater than
the number of reports that can be duplicates.
created_at: use a consistent ISO 8601 timestamp format.
id: unique canonical incident identifier.
reports: array of supporting report metadata; it may be empty.
The frontend should handle missing or invalid optional values safely.
Backend validation and authorization must also be enforced on the
server.

7. Backend integration contract for Member 3
The standalone frontend can run using synthetic demo data. Connecting it
to the real application requires Member 3's backend and Member 1's
authentication integration.

The following is the proposed frontend/backend contract. Confirm the
final paths and response format with Member 3 before enabling live mode.

7.1 Fetch incidents
GET /api/incidents
The endpoint should return either:

[
  {
    "id": "INC-001",
    "title": "Synthetic flood demonstration",
    "latitude": 30.9009,
    "longitude": 75.8573,
    "state": "Punjab",
    "disaster_type": "flood",
    "verification_status": "pending",
    "ai_confidence": 0.86,
    "location_confidence": 0.72,
    "location_source": "citizen_gps",
    "report_count": 3,
    "duplicate_report_count": 2,
    "created_at": "2026-10-31T06:30:00Z",
    "reports": []
  }
]
or an agreed wrapper such as:

{
  "incidents": []
}
The frontend API helper must match the actual response format
implemented by Member 3.

7.2 Geocode a place
Proposed request:

POST /api/geocode
Content-Type: application/json
Request body:

{
  "query": "Kharar, Punjab, India"
}
Illustrative response:

{
  "latitude": 30.746,
  "longitude": 76.65,
  "display_name": "Kharar, Punjab, India"
}
These coordinates are examples only.

Member 3 must choose and configure the geocoding provider, validate
input, apply rate limits, cache results, and handle provider errors. A
typed place name is not independent verification of a photograph's
capture location.

7.3 Authentication and authorization
For live integration:

Send the access token using the agreed authentication mechanism,
commonly Authorization: Bearer <token>.
Member 1 should provide the authenticated user's token through the
team's auth context.
Member 3 must verify tokens and enforce role-based access on the
backend.
The backend must decide which users can access private reports,
personal media, and precise coordinates.
Do not bypass authentication or authorization to make the frontend
appear to work.
Do not expose service-role keys or private credentials in frontend
code.
7.4 Enable live API mode
Only do this after Member 3 confirms that the backend is running and the
API contract is ready.

Example .env configuration:

VITE_USE_API=true
VITE_API_URL=http://localhost:8000
Then:

Save .env.
Stop the Vite development server with Ctrl + C.
Restart it:
npm run dev
Open the URL printed by Vite.
Open browser developer tools with F12.
Select Network → Fetch/XHR.
Inspect the incident API request, response status, and JSON.
The standalone src/main.jsx may mount the demo app without the team's
authenticated token. A secured API can therefore return 401 or 403
until Member 1 integrates the GIS dashboard with the real auth context.
Do not disable backend security to hide this.

8. Testing and production build
Run these commands from the project root.

Run tests
npm test
The project includes GIS tests in tests/gis.test.js. Check the actual
test output; do not assume tests passed merely because the command
started.

Build for production
npm run build
Vite writes the production build to:

dist/
A message about a large JavaScript chunk is a bundle-size warning, not
necessarily a build failure. The important result is whether Vite
reports that the build completed successfully.

Preview the production build
npm run preview
Open the exact local URL printed by Vite. If the default preview port is
occupied, Vite may select another port.

Manual GIS QA checklist
Dashboard loads without a blank page.
Browser console has no application-breaking errors.
All expected demo incidents appear in the incident list.
Located incidents appear on the map.
Unlocated incidents are not assigned fabricated coordinates.
Search filters the incident list.
Verification-status filter works.
Disaster-type filter works.
State/UT selection filters and focuses the map as implemented.
Minimum AI-confidence filter works.
Reset filters restores the default state.
Selecting an incident focuses the map on that incident.
Marker popups show the correct incident details.
Marker clusters expand/zoom as expected.
Heatmap can be shown and hidden.
State boundaries render and can be inspected.
Counters update when filters change.
Evidence inspector displays the selected incident.
npm test completes successfully.
npm run build completes successfully.
npm run preview serves the production build.
The current demo snapshot has 17 total records, 16 located records, and
1 unlocated record. If the dataset changes, update the expected counts
in this checklist.

9. Map tile and geocoding provider policies
OpenStreetMap tiles
The default map uses OpenStreetMap tiles unless VITE_TILE_URL or
another project configuration supplies a different tile provider.

When using the public OpenStreetMap tile service:

Keep visible attribution.
Use the required HTTPS tile URL.
Respect caching and usage requirements.
Do not bulk-download, scrape, or prefetch tiles.
Do not assume the public tile service provides an availability
guarantee.
Read the official policy before deployment:

https://operations.osmfoundation.org/policies/tiles/
For a production deployment with significant usage, choose a tile
provider suitable for the expected traffic.

Nominatim geocoding
If the backend uses the public Nominatim service:

Follow its usage policy.
Apply request throttling and caching.
Do not implement unrestricted client-side autocomplete.
Identify the application appropriately.
Do not use the public service for bulk geocoding.
Official policy:

https://operations.osmfoundation.org/policies/nominatim/
Member 3 should decide whether the public service is appropriate for the
project or whether another provider is needed.

10. Team integration
The GIS folder is a standalone frontend module/reference. Do not
overwrite the team's main React application with this folder.

Coordinate the integration with Member 1.

Suggested integration sequence
Confirm the team's React version and routing conventions.

Confirm which dependencies are already installed.

Add the GIS dependencies that are missing from the team application.

Import Leaflet CSS once in the appropriate application entry point:

import "leaflet/dist/leaflet.css";
Copy or adapt the GIS components and helper files into the team's
existing src/ directory.

Adapt relative imports to the team's folder structure.

Integrate the GIS screen as a page/component rather than replacing
the team's root App.jsx.

Add a protected route through Member 1's routing and authentication
system.

Pass the authenticated access token through the agreed auth context
or component interface.

Connect the frontend to Member 3's confirmed API contract.

Check CSS class names for collisions with the main application.

Run the team's tests and production build.

Open a pull request and request review from the responsible
teammate.

Git workflow
Use the branch assigned by the team. Do not create a second branch if
your work is already being reviewed from an existing branch.

Typical commands for an existing feature branch:

git status
git add .
git commit -m "Update GIS dashboard"
git push origin <your-branch-name>
Replace <your-branch-name> with the actual branch name. Review
git status before committing.

Never commit .env, private credentials, service-role keys, or
generated dependency folders.

11. Security and data-handling notes
Never commit .env.
Never put service-role keys, database passwords, or private API
secrets in frontend source code.
Variables beginning with VITE_ are exposed to the browser bundle.
They are not secret.
Validate uploaded files and API input on the backend.
Enforce authentication and role-based authorization on the backend.
Do not expose private media or precise personal locations to
unauthorized users.
Do not describe synthetic records as real citizen reports.
Do not describe AI confidence as official verification.
Do not guess missing coordinates.
Keep map attribution visible.
Follow the usage policy of the selected map tile and geocoding
provider.
12. Troubleshooting
Problem Possible cause What to check

npm is not recognized Node.js is missing or Install Node.js LTS and reopen the
PATH has not refreshed terminal

npm install fails Network, registry, or Check internet access and run
dependency issue npm -v

Browser shows a blank JavaScript Open F12 → Console and inspect the
page import/runtime error first error

Map is blank or grey Leaflet CSS, map Check Leaflet CSS import, map
height, or tile request container height, and Network
issue requests

Map tiles do not load Internet or tile Check connectivity and provider
provider issue policy

State boundaries do not GeoJSON path, JSON, or Check
appear property-name issue src/geojson/india-states.geojson
and the browser console

Selecting a state does State selection or map Check the selected-state prop and
not focus the map controller is not map effects
receiving the selected
state

Heatmap is not visible Heatmap toggle, layer Check HeatmapLayer.jsx and valid
data, or coordinates incident coordinates
issue

No markers appear Filters removed all Reset filters and inspect the
records or coordinates incident data
are invalid

A cluster does not Marker clustering Check DisasterMap.jsx and cluster
expand configuration or map settings
zoom issue

401 response Missing or invalid Ask Member 1 to check auth
access token integration

403 response User role is not Ask Member 3 to check backend
authorized authorization

CORS error Frontend origin is not Ask Member 3 to configure the exact
allowed by the backend frontend origin

Location search is Backend geocoding Confirm the API contract and .env
unavailable endpoint is not ready settings
or live mode is off

Port 5173 is already Another Vite server is Use the URL Vite prints or stop the
in use running other server

Build reports a large A bundled JavaScript Consider code splitting; confirm
chunk warning chunk is larger than whether the build itself succeeded
Vite's warning
threshold

Git push is rejected Remote branch has new Run git status, fetch, and
commits or permission coordinate with the branch owner
issue before integrating
13. Demo and presentation walkthrough
Use this sequence when presenting the GIS frontend:

Clearly announce Synthetic Demo Mode.
Start with the India-wide map.
Explain the incident counters: total, located, and unlocated.
Demonstrate the search field and verification-status filter.
Demonstrate the disaster-type and state/UT filters.
Select a state and show its boundary/focused map view.
Turn the heatmap on and off. Explain that it represents the
distribution of the supplied demo coordinates.
Zoom into a marker cluster and show the individual markers.
Select an incident and open its popup.
Show the evidence inspector and explain the difference between
canonical incidents and supporting reports.
Show geographic coverage and analytics.
Explain that AI confidence is not official verification.
Explain that records without coordinates are not placed at invented
locations.
Demonstrate live backend mode only if the API, authentication, and
authorization integration have been tested successfully.
14. What this module includes and does not include
Included in the GIS frontend
React/Vite dashboard.
Leaflet interactive map.
Incident markers and status legend.
Marker clustering.
India state/UT GeoJSON boundaries.
State selection and map focus.
Heatmap overlay.
Incident search and filters.
Located/unlocated incident counters.
Incident selection and evidence inspector.
Geographic coverage and analytics components.
Synthetic demo incident data.
GIS helper functions and tests.
Frontend API helper module for planned backend integration.
Not provided by this standalone frontend
Unless separately implemented and integrated by the responsible team
members, this folder does not itself provide:

Production FastAPI backend.
Production Supabase/database setup.
Authentication provider or token verification.
Backend role-based access control.
Secure media storage.
Real-time official IMD/NDMA alerts.
A production AI/ML inference service.
Independent verification of citizen-submitted media.
Official confirmation of incident locations.
A guaranteed live data feed.
Offline OpenStreetMap tiles.
Emergency response or dispatch functionality.
These capabilities must be supplied by the relevant backend, AI/ML, and
integration modules.

Final note
This project is a hackathon GIS prototype. Keep demo data clearly
labeled, preserve map attribution, validate all real data through the
backend, and never present an unverified report or model score as an
official disaster alert.

