import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const API_BASE = 'http://localhost:5173';

const commanderCredentials = [
  {
    firstName: 'Rafael',
    password: 'Password',
    home_unit_name: '101st Phantom Battalion',
  },
  {
    firstName: 'Amira',
    password: 'Password',
    home_unit_name: '103rd Obsidian Ghosts',
  },
  {
    firstName: 'Victor',
    password: 'Password',
    home_unit_name: '102nd Dusk Raiders',
  },
  {
    firstName: 'Natalia',
    password: 'Password',
    home_unit_name: '203rd Celestial Watch',
  },
  {
    firstName: 'Tariq',
    password: 'Password',
    home_unit_name: '201st Chrono Lancers',
  },
  {
    firstName: 'Mei',
    password: 'Password',
    home_unit_name: '202nd Riftwalkers',
  },
  {
    firstName: 'Griffin',
    password: 'Password',
    home_unit_name: '301st Spectral Blades',
  },
  {
    firstName: 'Zach',
    password: 'Password',
    home_unit_name: '302nd Abyss Stalkers',
  },
];

function BN_Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [form, setForm] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    id_mos: '',
    id_deployments: '',
  });  
  const [commander, setCommander] = useState(null);
  const [unitId, setUnitId] = useState(null);
  const [soldiers, setSoldiers] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [mosList, setMosList] = useState([]);
  const [deploymentList, setDeploymentList] = useState([]);
  const LIMIT = 10;

  const handleLogin = async () => {
    const match = commanderCredentials.find(
      (c) =>
        c.firstName.toLowerCase() === form.username.toLowerCase() &&
        c.password === form.password
    );

    if (!match) {
      alert('Invalid credentials.');
      return;
    }

    try {
      const unitsRes = await fetch(`${API_BASE}/units`);
      const units = await unitsRes.json();
      const matchedUnit = units.find(u => u.name === match.home_unit_name);

      if (!matchedUnit) {
        alert('Unit not found.');
        return;
      }

      setCommander(match);
      setUnitId(matchedUnit.id);
      setIsLoggedIn(true);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const fetchSoldiers = async () => {
    if (!unitId) return;

    try {
      setIsLoading(true);

      let query = `?limit=${LIMIT}&offset=${offset}&unit_id=${unitId}`;

      if (filterCategory && filterValue) {
        const fieldMap = {
          'first name': 'first_name',
          'deployments': 'id_deployments',
          'mos': 'id_mos',
        };

        const field = fieldMap[filterCategory];
        if (field) {
          query += `&${field}=${encodeURIComponent(filterValue)}`;
        }
      }

      const res = await fetch(`${API_BASE}/soldiers${query}`);
      const data = await res.json();
      setSoldiers(data);
    } catch (err) {
      console.error('Failed to fetch soldiers:', err);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [mosRes, deploymentRes] = await Promise.all([
          fetch(`${API_BASE}/mos`),
          fetch(`${API_BASE}/deployments`)
        ]);
        const mosData = await mosRes.json();
        const deploymentData = await deploymentRes.json();
  
        setMosList(mosData);
        setDeploymentList(deploymentData);
      } catch (err) {
        console.error('Failed to fetch MOS or deployments:', err);
      }
    };
  
    fetchOptions();
  }, []);
  
  useEffect(() => {
    if (isLoggedIn && unitId) {
      fetchSoldiers();
    }
  }, [offset, filterCategory, filterValue, isLoggedIn, unitId]);

  const handleFilterCategoryChange = (category) => {
    setFilterCategory(category);
    setFilterValue('');
    setOffset(0);
  };

  if (!isLoggedIn) {
    return (
      <div>
        <h2>BN Commander Login</h2>
        <input
          type="text"
          placeholder="First Name"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button onClick={handleLogin}>Login</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Welcome, Commander {commander.firstName}</h2>
      <h3>Your Battalion: {commander.home_unit_name}</h3>
  
      {/* Add Soldier Section */}
      <div className="filter-section">
        <h3>Add New Soldier</h3>
        <input
          type="text"
          placeholder="First Name"
          value={form.first_name || ''}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
        />
        <input
          type="text"
          placeholder="Last Name"
          value={form.last_name || ''}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
        />
        <select
  value={form.id_mos || ''}
  onChange={(e) => setForm({ ...form, id_mos: e.target.value })}
>
  <option value="">Select MOS</option>
  {mosList.map((mos) => (
    <option key={mos.id} value={mos.id}>{mos.name}</option>
  ))}
</select>

<select
  value={form.id_deployments || ''}
  onChange={(e) => setForm({ ...form, id_deployments: e.target.value })}
>
  <option value="">Select Deployment (optional)</option>
  {deploymentList.map((dep) => (
    <option key={dep.id} value={dep.id}>{dep.name}</option>
  ))}
</select>

        <button onClick={async () => {
          try {
            const res = await fetch('http://localhost:5173/api/soldiers', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                first_name: form.first_name,
                last_name: form.last_name,
                id_mos: parseInt(form.id_mos),
                id_deployments: form.id_deployments ? parseInt(form.id_deployments) : null,
                unit_id: unitId,
              }),
            });
  
            if (!res.ok) {
              const error = await res.json();
              alert(`Error: ${error.error}`);
              return;
            }
  
            alert('Soldier added successfully!');
            setForm({ ...form, first_name: '', last_name: '', id_mos: '', id_deployments: '' });
            fetchSoldiers();
          } catch (err) {
            console.error('Failed to add soldier:', err);
            alert('Something went wrong');
          }
        }}>
          Add Soldier
        </button>
      </div>
  
      {/* Filter Section */}
      <div className="filter-section">
        <h3>Filter by:</h3>
        <select
          className="filter-dropdown"
          value={filterCategory}
          onChange={(e) => handleFilterCategoryChange(e.target.value)}
        >
          <option value="">Select a filter</option>
          <option value="first name">First Name</option>
          <option value="deployments">Deployment</option>
          <option value="mos">MOS</option>
        </select>
      </div>
  
      {filterCategory && (
        <div className="filter-input-group">
          <input
            type="text"
            placeholder={`Enter ${filterCategory} to filter`}
            value={filterValue}
            onChange={(e) => {
              setFilterValue(e.target.value);
              setOffset(0);
            }}
          />
          <button onClick={() => { setFilterCategory(''); setFilterValue(''); }}>
            Clear Filter
          </button>
        </div>
      )}
  
      {/* Soldier Table */}
      <div className="results-container">
        {isLoading ? (
          <p>Loading soldiers...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>MOS</th>
                <th>Deployment</th>
              </tr>
            </thead>
            <tbody>
              {soldiers.map((s, i) => (
                <tr key={i}>
                  <td>{s.first_name}</td>
                  <td>{s.last_name}</td>
                  <td>{s.mos_name || 'N/A'}</td>
                  <td>{s.deployment_name || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="pagination">
          <button
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(offset - LIMIT, 0))}
          >
            Previous
          </button>
          <span>Showing {offset + 1} – {offset + soldiers.length}</span>
          <button
            disabled={soldiers.length < LIMIT}
            onClick={() => setOffset(offset + LIMIT)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );  
}

export default BN_Dashboard;
