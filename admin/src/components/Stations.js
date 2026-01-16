import React, { useEffect, useState } from "react";
import "../styles/dashboard.css";
import "../styles/page.css";
import "../styles/widgets.css";
import "../styles/tables.css";
import "../styles/stations.css";
import { fetchStations } from "../api/stations";

// Hjälpfunktioner för statistik
function getStats(stations) {
  const total = stations.length;
  const active = stations.filter((s) => (s.capacity || 0) > 0).length;
  const totalDocks = stations.reduce((acc, s) => acc + (s.capacity || 0), 0);
  const alerts = stations.filter((s) => (s.capacity || 0) < 5).length;
  const avgCapacity = total > 0 ? Math.round(totalDocks / total) : 0;
  return { total, active, totalDocks, alerts, avgCapacity };
}

function StationsWidgets({ stats }) {
  return (
    <div className="widgets-grid">
      <div className="card widget-card">
        <div className="stat-label">Total stations</div>
        <div className="stat-value">{stats.total}</div>
      </div>
      <div className="card widget-card">
        <div className="stat-label">Active</div>
        <div className="stat-value">{stats.active}</div>
      </div>
      <div className="card widget-card">
        <div className="stat-label">Available docks</div>
        <div className="stat-value">{stats.totalDocks}</div>
      </div>
      <div className="card widget-card">
        <div className="stat-label">Alerts</div>
        <div className="stat-value">{stats.alerts}</div>
      </div>
    </div>
  );
}

function StationsTable({ stations, query, sortKey, sortDir, setQuery, setSortKey, setSortDir }) {
  // Filter och sortering
  const filteredStations = stations
    .filter((s) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        (s.name || "").toLowerCase().includes(q) ||
        String(s.id).includes(q)
      );
    })
    .sort((a, b) => {
      if (sortKey === "capacity") {
        const A = Number(a.capacity) || 0;
        const B = Number(b.capacity) || 0;
        return sortDir === "asc" ? A - B : B - A;
      } else {
        const A = (a[sortKey] ?? "").toString().toLowerCase();
        const B = (b[sortKey] ?? "").toString().toLowerCase();
        if (A < B) return sortDir === "asc" ? -1 : 1;
        if (A > B) return sortDir === "asc" ? 1 : -1;
        return 0;
      }
    });
  return (
    <div className="card">
      <div className="stations-toolbar">
        <input
          type="search"
          className="stations-search"
          placeholder="Search by station name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="stations-sort"
          value={sortKey + ":" + sortDir}
          onChange={e => {
            const [key, dir] = e.target.value.split(":");
            setSortKey(key);
            setSortDir(dir);
          }}
        >
          <option value="name:asc">Name ↑</option>
          <option value="name:desc">Name ↓</option>
          <option value="capacity:asc">Capacity ↑</option>
          <option value="capacity:desc">Capacity ↓</option>
        </select>
      </div>
      <table className="table stations-table">
        <thead>
          <tr>
            <th>Name</th>
            <th style={{ width: 120 }}>Capacity</th>
            <th>Coordinates</th>
          </tr>
        </thead>
        <tbody>
          {filteredStations.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ textAlign: "center", padding: 20 }}>
                No stations found
              </td>
            </tr>
          ) : (
            filteredStations.map((st) => (
              <tr key={st.id}>
                <td style={{ fontWeight: 600 }}>{st.name}</td>
                <td>{st.capacity ?? 0}</td>
                <td style={{ fontSize: 13, color: "#6b7280" }}>
                  {st.lat != null && st.lon != null ? `${st.lat}, ${st.lon}` : "—"}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function StationsStatsSidebar({ stats }) {
  return (
    <aside>
      <div className="section stats-widget">
        <div className="section-title">Statistik</div>
        <ul className="stats-list">
          <li><span className="stats-label">Totalt antal stationer:</span> <span className="stats-value">{stats.total}</span></li>
          <li><span className="stats-label">Medelkapacitet:</span> <span className="stats-value">{stats.avgCapacity}</span></li>
          <li><span className="stats-label">Stationer med lediga platser:</span> <span className="stats-value">{stats.active}</span></li>
          <li><span className="stats-label">Stationer med låg kapacitet (&lt;5):</span> <span className="stats-value">{stats.alerts}</span></li>
        </ul>
      </div>
    </aside>
  );
}

export default function StationsPage() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  useEffect(() => {
    let mounted = true;
    const MIN_LOAD_TIME = 600;
    const startTime = Date.now();
    fetchStations()
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) {
          setStations(data);
          setErrorMsg(null);
        } else {
          setStations([]);
          setErrorMsg("No stations from API (empty list).");
        }
      })
      .catch((err) => {
        if (mounted) {
          setStations([]);
          setErrorMsg(err?.message || "Error fetching stations");
        }
      })
      .finally(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_LOAD_TIME - elapsed);
        setTimeout(() => mounted && setLoading(false), remaining);
      });
    return () => {
      mounted = false;
    };
  }, []);
  // SEARCH & SORT STATE
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  // Stats
  const stats = getStats(stations);
  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p className="loader-text">Loading stations...</p>
      </div>
    );
  }
  return (
    <div className="page-container">
      <h1 className="page-title">Stations</h1>
      {errorMsg && (
        <div style={{ background: "#fff3cd", padding: 10, marginBottom: 12, borderRadius: 4 }}>
          {errorMsg}
        </div>
      )}
      {/* ----- TOP WIDGETS ----- */}
      <StationsWidgets stats={stats} />
      {/* ----- MAIN GRID ----- */}
      <div className="section-grid">
        {/* LEFT SIDE */}
        <div>
          <div className="section-title">All stations</div>
          <StationsTable
            stations={stations}
            query={query}
            sortKey={sortKey}
            sortDir={sortDir}
            setQuery={setQuery}
            setSortKey={setSortKey}
            setSortDir={setSortDir}
          />
        </div>
        {/* RIGHT SIDEBAR */}
        <StationsStatsSidebar stats={stats} />
      </div>
    </div>
  );
}
