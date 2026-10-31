// import {useCallback,useEffect,useMemo,useState} from 'react';
// import {MapPinned,Radio,RefreshCw,Search,ShieldCheck,AlertTriangle,Layers,Navigation,Database} from 'lucide-react';
// import DisasterMap from './components/DisasterMap';
// import IncidentDetail from './components/IncidentDetail';
// import Analytics from './components/Analytics';
// import {demoIncidents} from './data/demoIncidents';
// import {filterIncidents,hasValidCoords} from './lib/gis';
// import {getIncidents,geocodePlace} from './lib/api';
// import './styles.css';

// // In team integration: pass auth token from Member 1's auth context via <App token={accessToken}/>.
// export default function App({token}){
//  const useApi=import.meta.env.VITE_USE_API==='true';
//  const [items,setItems]=useState(useApi?[]:demoIncidents);
//  const [loadState,setLoadState]=useState(useApi?'loading':'ready');
//  const [error,setError]=useState('');
//  const [stateFilter, setStateFilter] = useState("all");
//  const [refresh,setRefresh]=useState(0);
//  const [selectedId,setSelectedId]=useState('INC-001');
//  const [focusCounter,setFocusCounter]=useState(0);
//  const [status,setStatus]=useState('all');
//  const [type,setType]=useState('all');
//  const [search,setSearch]=useState('');
//  const [minConfidence,setMinConfidence]=useState(0);
//  const [locationQuery,setLocationQuery]=useState('');
//  const [locationMessage,setLocationMessage]=useState('');
//  const [place,setPlace]=useState(null);
//  const [isGeocoding,setIsGeocoding]=useState(false);
//  useEffect(()=>{if(!useApi)return;const controller=new AbortController();let active=true;
//   async function load(){setLoadState('loading');setError('');try{const data=await getIncidents(token,controller.signal);if(active){setItems(data);setLoadState('ready');}}catch(e){if(active&&e.name!=='AbortError'){setError(e.message);setLoadState('error');}}}
//   load();const timer=setInterval(load,30000);return()=>{active=false;controller.abort();clearInterval(timer)};
//  },[useApi,token,refresh]);
//  const visible=useMemo(()=>filterIncidents(items,{status,type,state: stateFilter,search,minConfidence:minConfidence/100}),[items,status,type,stateFilter,search,minConfidence]);
//  const selected=visible.find(x=>x.id===selectedId)||null;
//  const unlocated=visible.filter(x=>!hasValidCoords(x));
//  const select=useCallback(id=>{setSelectedId(id);setFocusCounter(x=>x+1);},[]);
//  async function locationSearch(e){e.preventDefault();setLocationMessage('');if(!locationQuery.trim())return;
//   if(!useApi){setLocationMessage('Place lookup requires VITE_USE_API=true and Member 3’s POST /api/geocode. Use map markers in Demo Mode.');return;}
//   setIsGeocoding(true);try{const result=await geocodePlace(locationQuery.trim(),token);setPlace(result);setLocationMessage(`Located: ${result.display_name||locationQuery}. This is a geocoded place, not a verified incident.`);}catch(e){setLocationMessage(e.message);}finally{setIsGeocoding(false)}
//  }
//  // A searched place is listed separately; it is never mixed into incident markers.
//  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-icon"><Radio size={23}/></div><div><b>GRAVITON</b><small>Disaster Intelligence</small></div></div><div className="nav-title">OPERATIONS</div><div className="nav active"><MapPinned size={18}/> GIS command map</div><div className="nav"><Layers size={18}/> Incident evidence</div><div className="sidebar-bottom"><ShieldCheck size={17}/> Citizen-to-officer verification<p>Hackathon prototype · 2026</p></div></aside><div className="main"><header className="topbar"><div><div className="eyebrow">GEOSPATIAL OPERATIONS / PUNJAB</div><h1>Disaster Intelligence Dashboard</h1><p>See incident locations, status, duplicates, and evidence.</p></div><div className="header-actions"><span className="mode-tag"><span className="pulse"/>{useApi?'LIVE API':'SYNTHETIC DEMO'}</span><button className="refresh" onClick={()=>useApi?setRefresh(x=>x+1):setItems([...demoIncidents])} title="Refresh incidents"><RefreshCw size={17}/></button></div></header>
//  {loadState==='error'&&<div className="error-banner"><AlertTriangle size={18}/>API unavailable: {error}. No synthetic fallback is shown in Live API mode.</div>}
//  <div className="workspace"><section className="primary-column"><div className="filters"><div className="input-search"><Search size={16}/><input aria-label="Search incidents" placeholder="Search incidents or report ID" value={search} onChange={e=>setSearch(e.target.value)}/></div><select aria-label="Verification status" value={status} onChange={e=>setStatus(e.target.value)}><option value="all">All statuses</option><option value="verified">Verified</option><option value="pending">Pending</option><option value="rejected">Rejected</option></select><select aria-label="Disaster type" value={type} onChange={e=>setType(e.target.value)}><option value="all">All disasters</option><option value="flood">Flood</option><option value="waterlogging">Waterlogging</option><option value="storm">Storm</option><option value="rain">Rain</option><option value="landslide">Landslide</option></select><label className="confidence-label">Min AI confidence: <b>{minConfidence}%</b><input type="range" value={minConfidence} min="0" max="100" step="10" onChange={e=>setMinConfidence(Number(e.target.value))}/></label></div>
//  <div className="map-section"><div className="section-header"><div><h2>Incident map</h2><span>{visible.filter(hasValidCoords).length} located · {unlocated.length} not mapped</span></div><span className="map-badge"><Navigation size={14}/> Punjab, India</span></div><DisasterMap items={visible} selectedId={selected?.id} onSelect={select} focusCounter={focusCounter}/>{loadState==='loading'&&<div className="loading-label">Updating incidents…</div>}{place&&<div className="place-note">Geocoding result: {place.display_name||locationQuery} ({place.latitude}, {place.longitude}). Not an incident.</div>}</div>
//  <form className="geocode-search" onSubmit={locationSearch}><Search size={17}/><input placeholder="Lookup a location (backend required)" aria-label="Location lookup" value={locationQuery} onChange={e=>setLocationQuery(e.target.value)}/><button disabled={isGeocoding} type="submit">{isGeocoding?'Searching…':'Find place'}</button></form>{locationMessage&&<p className="helper-message">{locationMessage}</p>}
//  <Analytics items={visible}/></section><aside className="detail-column"><section className="panel"><div className="section-header"><div><h2>Incident feed</h2><span>{visible.length} incidents · {items.length} total</span></div><Database size={17}/></div><div className="incident-list">{visible.map(i=><button type="button" key={i.id} className={`incident-row ${selected?.id===i.id?'selected':''}`} onClick={()=>select(i.id)}><span className={`incident-indicator ${i.verification_status}`}/><span className="incident-copy"><b>{i.title}</b><small>{i.id} · {i.disaster_type} · {i.report_count||0} reports{!hasValidCoords(i)?' · NO LOCATION':''}</small></span><span className={`status-pill ${i.verification_status}`}>{i.verification_status}</span></button>)}{visible.length===0&&<div className="empty-list">No incidents match your filters.</div>}</div></section><section className="panel detail-panel"><div className="section-header"><h2>Evidence inspector</h2><ShieldCheck size={18}/></div><IncidentDetail item={selected}/></section></aside></div><footer>This is a synthetic-data prototype unless Live API mode is enabled. AI scores and approximate locations are not official verification.</footer></div></div>;
// }

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  MapPinned,
  Radio,
  RefreshCw,
  Search,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Navigation,
  Database
} from 'lucide-react';

import DisasterMap from './components/DisasterMap';
import IncidentDetail from './components/IncidentDetail';
import Analytics from './components/Analytics';

import { demoIncidents } from './data/demoIncidents';
import { filterIncidents, hasValidCoords } from './lib/gis';
import { getIncidents, geocodePlace } from './lib/api';

import './styles.css';

// In team integration: pass auth token from Member 1's auth context via <App token={accessToken}/>.
export default function App({ token }) {

  const useApi = import.meta.env.VITE_USE_API === 'true';

  const [items, setItems] = useState(useApi ? [] : demoIncidents);
  const [loadState, setLoadState] = useState(useApi ? 'loading' : 'ready');
  const [error, setError] = useState('');

  const [stateFilter, setStateFilter] = useState('all');

  const [refresh, setRefresh] = useState(0);
  const [selectedId, setSelectedId] = useState('INC-001');
  const [focusCounter, setFocusCounter] = useState(0);

  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [search, setSearch] = useState('');
  const [minConfidence, setMinConfidence] = useState(0);

  const [locationQuery, setLocationQuery] = useState('');
  const [locationMessage, setLocationMessage] = useState('');
  const [place, setPlace] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Load incidents from API
  useEffect(() => {
    if (!useApi) return;

    const controller = new AbortController();
    let active = true;

    async function load() {
      setLoadState('loading');
      setError('');

      try {
        const data = await getIncidents(token, controller.signal);

        if (active) {
          setItems(data);
          setLoadState('ready');
        }
      } catch (e) {
        if (active && e.name !== 'AbortError') {
          setError(e.message);
          setLoadState('error');
        }
      }
    }

    load();

    const timer = setInterval(load, 30000);

    return () => {
      active = false;
      controller.abort();
      clearInterval(timer);
    };

  }, [useApi, token, refresh]);

  // Apply all incident filters
  const visible = useMemo(
    () =>
      filterIncidents(items, {
        status,
        type,
        state: stateFilter,
        search,
        minConfidence: minConfidence / 100
      }),
    [items, status, type, stateFilter, search, minConfidence]
  );

  const selected = visible.find(x => x.id === selectedId) || null;

  const unlocated = visible.filter(x => !hasValidCoords(x));

  const select = useCallback(id => {
    setSelectedId(id);
    setFocusCounter(x => x + 1);
  }, []);

  // Location search
  async function locationSearch(e) {
    e.preventDefault();
    setLocationMessage('');

    if (!locationQuery.trim()) return;

    if (!useApi) {
      setLocationMessage(
        'Place lookup requires VITE_USE_API=true and Member 3’s POST /api/geocode. Use map markers in Demo Mode.'
      );
      return;
    }

    setIsGeocoding(true);

    try {
      const result = await geocodePlace(locationQuery.trim(), token);

      setPlace(result);

      setLocationMessage(
        `Located: ${result.display_name || locationQuery}. This is a geocoded place, not a verified incident.`
      );

    } catch (e) {
      setLocationMessage(e.message);

    } finally {
      setIsGeocoding(false);
    }
  }

  // Dashboard UI
  return (
    <div className="app-shell">

      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">
            <Radio size={23} />
          </div>

          <div>
            <b>GRAVITON</b>
            <small>Disaster Intelligence</small>
          </div>
        </div>

        <div className="nav-title">OPERATIONS</div>

        <div className="nav active">
          <MapPinned size={18} />
          GIS command map
        </div>

        <div className="nav">
          <Layers size={18} />
          Incident evidence
        </div>

        <div className="sidebar-bottom">
          <ShieldCheck size={17} />
          Citizen-to-officer verification
          <p>Hackathon prototype · 2026</p>
        </div>

      </aside>

      <div className="main">

        <header className="topbar">

          <div>
            <div className="eyebrow">
              GEOSPATIAL OPERATIONS / PUNJAB
            </div>

            <h1>Disaster Intelligence Dashboard</h1>

            <p>
              See incident locations, status, duplicates, and evidence.
            </p>
          </div>

          <div className="header-actions">

            <span className="mode-tag">
              <span className="pulse" />
              {useApi ? 'LIVE API' : 'SYNTHETIC DEMO'}
            </span>

            <button
              className="refresh"
              onClick={() =>
                useApi
                  ? setRefresh(x => x + 1)
                  : setItems([...demoIncidents])
              }
              title="Refresh incidents"
            >
              <RefreshCw size={17} />
            </button>

          </div>

        </header>

        {loadState === 'error' && (
          <div className="error-banner">
            <AlertTriangle size={18} />
            API unavailable: {error}. No synthetic fallback is shown in Live API mode.
          </div>
        )}

        <div className="workspace">

          <section className="primary-column">

            {/* FILTER SECTION */}
            <div className="filters">

              {/* Search */}
              <div className="input-search">
                <Search size={16} />

                <input
                  aria-label="Search incidents"
                  placeholder="Search incidents or report ID"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Verification Status Filter */}
              <select
                aria-label="Verification status"
                value={status}
                onChange={e => setStatus(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Disaster Type Filter */}
              <select
                aria-label="Disaster type"
                value={type}
                onChange={e => setType(e.target.value)}
              >
                <option value="all">All disasters</option>
                <option value="flood">Flood</option>
                <option value="waterlogging">Waterlogging</option>
                <option value="storm">Storm</option>
                <option value="rain">Rain</option>
                <option value="landslide">Landslide</option>
              </select>

              {/* NEW: State Filter */}
              <select
                aria-label="Filter by state"
                value={stateFilter}
                onChange={e => setStateFilter(e.target.value)}
              >
                <option value="all">All India</option>
                <option value="Punjab">Punjab</option>
                <option value="Haryana">Haryana</option>
                <option value="Himachal Pradesh">Himachal Pradesh</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="West Bengal">West Bengal</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Assam">Assam</option>
                <option value="Rajasthan">Rajasthan</option>
                <option value="Bihar">Bihar</option>
                <option value="Telangana">Telangana</option>
                <option value="Jammu and Kashmir">Jammu and Kashmir</option>
              </select>

              {/* AI Confidence Filter */}
              <label className="confidence-label">

                Min AI confidence: <b>{minConfidence}%</b>

                <input
                  type="range"
                  value={minConfidence}
                  min="0"
                  max="100"
                  step="10"
                  onChange={e =>
                    setMinConfidence(Number(e.target.value))
                  }
                />

              </label>

            </div>

            {/* MAP SECTION */}
            <div className="map-section">

              <div className="section-header">

                <div>
                  <h2>Incident map</h2>

                  <span>
                    {visible.filter(hasValidCoords).length} located · {unlocated.length} not mapped
                  </span>
                </div>

                <span className="map-badge">
                  <Navigation size={14} />
                  Punjab, India
                </span>

              </div>

              <DisasterMap
                items={visible}
                selectedId={selected?.id}
                onSelect={select}
                focusCounter={focusCounter}
              />

              {loadState === 'loading' && (
                <div className="loading-label">
                  Updating incidents…
                </div>
              )}

              {place && (
                <div className="place-note">
                  Geocoding result: {place.display_name || locationQuery} ({place.latitude}, {place.longitude}). Not an incident.
                </div>
              )}

            </div>

            {/* LOCATION SEARCH */}
            <form
              className="geocode-search"
              onSubmit={locationSearch}
            >
              <Search size={17} />

              <input
                placeholder="Lookup a location (backend required)"
                aria-label="Location lookup"
                value={locationQuery}
                onChange={e => setLocationQuery(e.target.value)}
              />

              <button disabled={isGeocoding} type="submit">
                {isGeocoding ? 'Searching…' : 'Find place'}
              </button>

            </form>

            {locationMessage && (
              <p className="helper-message">
                {locationMessage}
              </p>
            )}

            <Analytics items={visible} />

          </section>

          {/* INCIDENT FEED AND EVIDENCE */}
          <aside className="detail-column">

            <section className="panel">

              <div className="section-header">

                <div>
                  <h2>Incident feed</h2>
                  <span>
                    {visible.length} incidents · {items.length} total
                  </span>
                </div>

                <Database size={17} />

              </div>

              <div className="incident-list">

                {visible.map(i => (
                  <button
                    type="button"
                    key={i.id}
                    className={`incident-row ${
                      selected?.id === i.id ? 'selected' : ''
                    }`}
                    onClick={() => select(i.id)}
                  >

                    <span
                      className={`incident-indicator ${i.verification_status}`}
                    />

                    <span className="incident-copy">

                      <b>{i.title}</b>

                      <small>
                        {i.id} · {i.disaster_type} · {i.report_count || 0} reports
                        {!hasValidCoords(i) ? ' · NO LOCATION' : ''}
                      </small>

                    </span>

                    <span
                      className={`status-pill ${i.verification_status}`}
                    >
                      {i.verification_status}
                    </span>

                  </button>
                ))}

                {visible.length === 0 && (
                  <div className="empty-list">
                    No incidents match your filters.
                  </div>
                )}

              </div>

            </section>

            <section className="panel detail-panel">

              <div className="section-header">
                <h2>Evidence inspector</h2>
                <ShieldCheck size={18} />
              </div>

              <IncidentDetail item={selected} />

            </section>

          </aside>

        </div>

        <footer>
          This is a synthetic-data prototype unless Live API mode is enabled. AI scores and approximate locations are not official verification.
        </footer>

      </div>

    </div>
  );
}
