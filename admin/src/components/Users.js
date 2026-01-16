import React, { useEffect, useState } from "react";
import { fetchUsers } from "../api/users";

// Hjälpfunktioner för statistik
function getUserStats(users) {
  const total = users.length;
  const active7d = total; // Placeholder, kan justeras
  const avgRides = 0; // Placeholder, kan justeras
  const openTickets = 0; // Placeholder, kan justeras
  return { total, active7d, avgRides, openTickets };
}

function UsersWidgets({ stats }) {
  return (
    <div className="widgets-grid">
      <div className="card widget-card">
        <div className="stat-label">Total users</div>
        <div className="stat-value">{stats.total}</div>
      </div>
      <div className="card widget-card">
        <div className="stat-label">Active (7d)</div>
        <div className="stat-value">{stats.active7d}</div>
      </div>
      <div className="card widget-card">
        <div className="stat-label">Avg rides/user</div>
        <div className="stat-value">{stats.avgRides}</div>
      </div>
      <div className="card widget-card">
        <div className="stat-label">Open tickets</div>
        <div className="stat-value">{stats.openTickets}</div>
      </div>
    </div>
  );
}

function UsersTable({ users, query, sortKey, sortDir, setQuery, setSortKey, setSortDir }) {
  const filteredUsers = users
    .filter((u) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || String(u.id).includes(q);
    })
    .sort((a, b) => {
      const A = (a[sortKey] ?? '').toString().toLowerCase();
      const B = (b[sortKey] ?? '').toString().toLowerCase();
      if (A < B) return sortDir === 'asc' ? -1 : 1;
      if (A > B) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  return (
    <div className="card">
      <div className="stations-toolbar">
        <input
          type="search"
          className="stations-search"
          placeholder="Search by name or email"
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
          <option value="email:asc">Email ↑</option>
          <option value="email:desc">Email ↓</option>
        </select>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Balance</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length === 0 ? (
            <tr key="no-users">
              <td colSpan={4}>No users found</td>
            </tr>
          ) : (
            filteredUsers.map((u, i) => (
              <tr key={u.id ?? `user-row-${i}`}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{typeof u.balance === 'number' ? u.balance.toFixed(2) + ' kr' : '-'}</td>
                <td>{u.hashed_password ? 'Active' : 'Invited'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  useEffect(() => {
    let mounted = true;
    const MIN_LOAD_TIME = 600;
    const startTime = Date.now();
    fetchUsers()
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setUsers(data);
          setErrorMsg(null);
        } else {
          setUsers([]);
          setErrorMsg("No users from API (showing empty list).");
          console.warn("fetchUsers returned empty array or non-array result");
        }
      })
      .catch((err) => {
        if (mounted) {
          setUsers([]); 
          setErrorMsg(err?.message || "Error fetching users");
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
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const stats = getUserStats(users);
  if (loading) {
    return (
      <div className="loader-container">
        <div className="spinner"></div>
        <p className="loader-text">Loading users...</p>
      </div>
    );
  }
  return (
    <div className="page-container">
      <h1 className="page-title">Users</h1>
      {errorMsg && (
        <div style={{ background: "#fff3cd", padding: 10, marginBottom: 12, borderRadius: 4 }}>
          {errorMsg}
        </div>
      )}
      {/* ----- TOP WIDGETS ----- */}
      <UsersWidgets stats={stats} />
      {/* ----- MAIN GRID ----- */}
      <div style={{ width: '100%' }}>
        <div className="section-title">All users</div>
        <UsersTable
          users={users}
          query={query}
          sortKey={sortKey}
          sortDir={sortDir}
          setQuery={setQuery}
          setSortKey={setSortKey}
          setSortDir={setSortDir}
        />
      </div>
    </div>
  );
}
