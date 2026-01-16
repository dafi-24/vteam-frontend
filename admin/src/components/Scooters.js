import React, { useEffect, useState } from "react";
import "../styles/dashboard.css";
import "../styles/page.css";
import "../styles/widgets.css";
import "../styles/tables.css";
import { fetchScooters } from "../api/scooters";
import "../styles/price-control.css";
import { getPrice, updatePrice } from "../api/price";


function getStatusString(s) {
  if (s.rented) return "Rented";
  if (s.available) return "Available";
  return "Unavailable";
}

function ScootersWidgets({ scooters, avgBattery }) {
  return (
    <div className="widgets-grid">
      <div className="card widget-card">
        <div className="stat-label">Total scooters</div>
        <div className="stat-value">{scooters.length}</div>
      </div>
      <div className="card widget-card">
        <div className="stat-label">Average battery</div>
        <div className="stat-value">{avgBattery}%</div>
      </div>
      <div className="card widget-card">
        <div className="stat-label">Active rides</div>
        <div className="stat-value">{scooters.filter((s) => s.rented).length}</div>
      </div>
      <div className="card widget-card">
        <div className="stat-label">Inactive scooters</div>
        <div className="stat-value">{scooters.filter((s) => !s.rented && !s.available).length}</div>
      </div>
    </div>
  );
}

function ScootersTable({ sortedScooters, sortBy, sortDir, setSortBy, setSortDir }) {
  return (
    <div className="card">
      <div className="stations-toolbar">
        <div></div>
        <select
          id="sortScooters"
          className="stations-sort"
          value={sortBy + ":" + sortDir}
          onChange={e => {
            const [key, dir] = e.target.value.split(":");
            setSortBy(key);
            setSortDir(dir);
          }}
        >
          <option value="id:asc">ID ↑</option>
          <option value="id:desc">ID ↓</option>
          <option value="battery:asc">Battery ↑</option>
          <option value="battery:desc">Battery ↓</option>
          <option value="status:asc">Status ↑</option>
          <option value="status:desc">Status ↓</option>
        </select>
      </div>
      <table className="table stations-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Battery</th>
            <th>Status</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {sortedScooters.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.battery}%</td>
              <td>{getStatusString(s)}</td>
              <td>{s.lat != null && s.lon != null ? `${s.lat}, ${s.lon}` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PriceSidebar({ price, editPrice, setEditPrice, inputPrice, setInputPrice, savingPrice, handleSavePrice, priceError }) {
  return (
    <aside>
      <div className="section">
        <div className="section-title">Ändra pris på resa</div>
        <div className="price-control-container">
          <div className="price-control-label">Pris per minut (kr):</div>
          <div className="price-control-value-row">
            <span className="price-control-value">{price.toFixed(2)}</span>
            {!editPrice && (
              <button className="price-control-btn" onClick={() => setEditPrice(true)}>Ändra</button>
            )}
          </div>
          {editPrice && (
            <div className="price-control-edit-row">
              <input
                className="price-control-input"
                type="number"
                min="0"
                step="0.01"
                value={inputPrice}
                onChange={e => setInputPrice(e.target.value)}
              />
              <button className="price-control-btn" onClick={handleSavePrice} disabled={savingPrice}>Spara</button>
              <button className="price-control-btn" onClick={() => { setEditPrice(false); setInputPrice(price); }}>Avbryt</button>
            </div>
          )}
          {priceError && <div className="price-control-error">{priceError}</div>}
        </div>
      </div>
    </aside>
  );
}

export default function ScootersPage() {
  const [scooters, setScooters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  useEffect(() => {
    let mounted = true;
    const MIN_LOAD_TIME = 600;
    const startTime = Date.now();
    fetchScooters()
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setScooters(data);
        } else {
          setScooters([]);
          setErrorMsg("Using empty scooter list (no scooters from API).");
          console.warn("fetchScooters returned empty array or non-array result");
        }
      })
      .catch((err) => {
        if (mounted) {
          setScooters([]);
          setErrorMsg(err?.message || "Error fetching scooters");
        }
      })
      .finally(() => {
        if (!mounted) return;
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_LOAD_TIME - elapsed);
        setTimeout(() => {
          if (mounted) setLoading(false);
        }, remaining);
      });
    return () => {
      mounted = false;
    };
  }, []);
  const avgBattery =
    scooters.length > 0
      ? Math.round(
          scooters.reduce((acc, s) => acc + (s.battery || 0), 0) / scooters.length
        )
      : 0;
  const [price, setPrice] = useState(0);
  const [editPrice, setEditPrice] = useState(false);
  const [inputPrice, setInputPrice] = useState(0);
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceError, setPriceError] = useState("");
  useEffect(() => {
    getPrice().then(p => {
      setPrice(p.perMinute);
      setInputPrice(p.perMinute);
    }).catch(() => setPrice(0.25));
  }, []);
  async function handleSavePrice() {
    setSavingPrice(true);
    setPriceError("");
    try {
      await updatePrice({ price: Number(inputPrice) });
      setPrice(Number(inputPrice));
      setEditPrice(false);
    } catch (e) {
      setPriceError("Kunde inte spara priset");
    }
    setSavingPrice(false);
  }
  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p className="loader-text">Loading scooters...</p>
      </div>
    );
  }
  const sortedScooters = [...scooters].sort((a, b) => {
    let valA, valB;
    if (sortBy === "id") {
      valA = a.id;
      valB = b.id;
    } else if (sortBy === "battery") {
      valA = a.battery || 0;
      valB = b.battery || 0;
    } else if (sortBy === "status") {
      valA = getStatusString(a);
      valB = getStatusString(b);
    } else {
      valA = a[sortBy];
      valB = b[sortBy];
    }
    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });
  return (
    <div className="page-container">
      <h1 className="page-title">Scooters</h1>
      {errorMsg && (
        <div
          style={{
            background: "#fff3cd",
            padding: 10,
            marginBottom: 12,
            borderRadius: 4,
          }}
        >
          {errorMsg}
        </div>
      )}
      <ScootersWidgets scooters={scooters} avgBattery={avgBattery} />
      <div className="section-grid">
        <div>
          <div className="section-title">All scooters</div>
          <ScootersTable
            sortedScooters={sortedScooters}
            sortBy={sortBy}
            sortDir={sortDir}
            setSortBy={setSortBy}
            setSortDir={setSortDir}
          />
        </div>
        <PriceSidebar
          price={price}
          editPrice={editPrice}
          setEditPrice={setEditPrice}
          inputPrice={inputPrice}
          setInputPrice={setInputPrice}
          savingPrice={savingPrice}
          handleSavePrice={handleSavePrice}
          priceError={priceError}
        />
      </div>
    </div>
  );
}
