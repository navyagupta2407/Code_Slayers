# DisasterLens AI 🌍

**Crowdsourced Extreme Weather Verification & GIS De-Duplicator**

DisasterLens AI empowers citizens to report disasters, provides an authoritative verification workflow for emergency responders, and leverages AI and GIS capabilities to detect duplicates, calculate incident credibility, and visualize verified disaster intelligence across India.

---

## 🚀 Key Features

1. **Citizen Reporting Workflow (`/report`)**
   - Disaster categorization (Flood, Heavy Rainfall, Cyclone, Earthquake, Landslide, Heatwave, Other).
   - One-click device GPS auto-detection.
   - Interactive Leaflet mini-map coordinate picker.
   - Multi-file photo and video evidence upload (persisted to Supabase Storage).

2. **GIS Intelligence Map (`/map`)**
   - Real-time interactive map with severity color-coded markers.
   - Dynamic popups with deep links to incident details.
   - Live category, severity, and verification status filters.

3. **AI Verification & GIS De-Duplication (`/verify`)**
   - Automated Haversine spatiotemporal proximity analysis (<25 km & 48 hrs).
   - Text token-overlap similarity scoring (Jaccard index).
   - Multi-factor AI confidence score (0–100%) to assist human verifiers.
   - One-click approve or reject decisions with field notes.

4. **Community Reports Directory (`/reports`)**
   - Live search across titles, descriptions, and locations.
   - Multi-criteria filtering and pagination.

5. **Administrator Control Center (`/admin`)**
   - Real-time platform KPI metrics.
   - Database, Auth, and Storage operational health monitor.
   - Evaluator persona switcher (Citizen, Verifier, Admin) for live demonstrations.
   - Complete report management table with deletion controls.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, React Router 7, Leaflet, React-Leaflet, Lucide React, react-hot-toast.
- **Backend & Database**: Supabase (PostgreSQL, GoTrue Auth, Storage, Row Level Security).
- **Design System**: Earthy, warm, minimalist environmental intelligence palette.

---

## 📦 Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/yash-29-08/Code_Slayers.git
cd Code_Slayers
```

### 2. Configure Database & Storage
Open your Supabase project dashboard, navigate to **SQL Editor**, paste the contents of `supabase_schema.sql`, and run it.

### 3. Run the Frontend
```bash
cd frontend
npm install
npm run dev
```

Build for production:
```bash
npm run build
```
