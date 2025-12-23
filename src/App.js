import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [googleMapsEstimate, setGoogleMapsEstimate] = useState('');
  const [evEstimate, setEvEstimate] = useState('');
  const [legs, setLegs] = useState([{ id: 1, name: 'Leg 1', dataPoints: [] }]);
  const [currentLegIndex, setCurrentLegIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const googleMapsRef = useRef(null);
  const evEstimateRef = useRef(null);

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('evRangeData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setLegs(parsed.legs || [{ id: 1, name: 'Leg 1', dataPoints: [] }]);
      setCurrentLegIndex(parsed.currentLegIndex || 0);
    }
  }, []);

  // Save data to localStorage whenever legs changes
  useEffect(() => {
    localStorage.setItem('evRangeData', JSON.stringify({ legs, currentLegIndex }));
  }, [legs, currentLegIndex]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!googleMapsEstimate || !evEstimate) {
      alert('Please enter both values');
      return;
    }

    const googleValue = parseFloat(googleMapsEstimate);
    const evValue = parseFloat(evEstimate);

    if (isNaN(googleValue) || isNaN(evValue)) {
      alert('Please enter valid numbers');
      return;
    }

    // Create new data point
    const newDataPoint = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      googleMapsEstimate: googleValue,
      evEstimate: evValue,
      difference: evValue - googleValue
    };

    // Add to current leg
    setLegs(prev => {
      const updated = [...prev];
      updated[currentLegIndex].dataPoints.push(newDataPoint);
      return updated;
    });

    // Clear inputs
    setGoogleMapsEstimate('');
    setEvEstimate('');

    // Focus first input
    googleMapsRef.current?.focus();
  };

  const handleNumberInput = (value, setter) => {
    // Allow only numbers and decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setter(value);
    }
  };

  const handleStartNewLeg = () => {
    const newLeg = {
      id: Date.now(),
      name: `Leg ${legs.length + 1}`,
      dataPoints: []
    };
    setLegs(prev => [...prev, newLeg]);
    setCurrentLegIndex(legs.length);
    setMenuOpen(false);
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setLegs([{ id: Date.now(), name: 'Leg 1', dataPoints: [] }]);
      setCurrentLegIndex(0);
      localStorage.removeItem('evRangeData');
      setMenuOpen(false);
    }
  };

  const handleExportData = () => {
    // Create CSV with legs as columns
    let csv = 'Data Point';
    
    // Add leg headers
    legs.forEach(leg => {
      csv += `,"${leg.name} - Maps (mi)","${leg.name} - EV (mi)","${leg.name} - Diff (mi)","${leg.name} - Timestamp"`;
    });
    csv += '\n';
    
    // Find max number of data points in any leg
    const maxPoints = Math.max(...legs.map(leg => leg.dataPoints.length));
    
    // Add rows
    for (let i = 0; i < maxPoints; i++) {
      csv += (i + 1);
      legs.forEach(leg => {
        if (i < leg.dataPoints.length) {
          const point = leg.dataPoints[i];
          csv += `,${point.googleMapsEstimate},${point.evEstimate},${point.difference.toFixed(2)},"${new Date(point.timestamp).toLocaleString()}"`;
        } else {
          csv += ',,,';
        }
      });
      csv += '\n';
    }
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ev-range-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    setMenuOpen(false);
  };

  const currentLeg = legs[currentLegIndex];
  const totalDataPoints = legs.reduce((sum, leg) => sum + leg.dataPoints.length, 0);

  return (
    <div className="App">
      <button className="hamburger-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div className={`side-menu ${menuOpen ? 'open' : ''}`}>
        <button className="close-menu" onClick={() => setMenuOpen(false)}>×</button>
        <h2>Menu</h2>
        <button className="menu-item" onClick={handleStartNewLeg}>🚗 Start New Leg</button>
        <button className="menu-item" onClick={handleExportData}>📥 Export Data</button>
        <button className="menu-item danger" onClick={handleClearData}>🗑️ Clear All Data</button>
        <div className="menu-info">
          <p>Total Legs: {legs.length}</p>
          <p>Total Data Points: {totalDataPoints}</p>
        </div>
      </div>

      {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)}></div>}

      <header className="App-header">
        <h1>EV Range Tracker</h1>
        <p className="current-leg">Current: {currentLeg.name}</p>
      </header>
      
      <main className="App-main">
        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-group">
            <label htmlFor="googleMaps">Google Maps Distance (miles)</label>
            <input
              id="googleMaps"
              ref={googleMapsRef}
              type="number"
              inputMode="decimal"
              placeholder="e.g., 80"
              value={googleMapsEstimate}
              onChange={(e) => handleNumberInput(e.target.value, setGoogleMapsEstimate)}
              className="range-input"
              autoFocus
            />
          </div>

          <div className="input-group">
            <label htmlFor="evEstimate">EV Range Estimate (miles)</label>
            <input
              id="evEstimate"
              ref={evEstimateRef}
              type="number"
              inputMode="decimal"
              placeholder="e.g., 160"
              value={evEstimate}
              onChange={(e) => handleNumberInput(e.target.value, setEvEstimate)}
              className="range-input"
            />
          </div>

          <button type="submit" className="submit-button">
            Save Data
          </button>
        </form>

        <div className="data-summary">
          <h2>{currentLeg.name} - {currentLeg.dataPoints.length} Data Points</h2>
          {currentLeg.dataPoints.length > 0 && (
            <div className="recent-entries">
              <h3>All Entries</h3>
              {[...currentLeg.dataPoints].reverse().map(point => (
                <div key={point.id} className="data-point">
                  <div className="data-row">
                    <span>Maps: {point.googleMapsEstimate} mi</span>
                    <span>EV: {point.evEstimate} mi</span>
                    <span>Diff: {point.difference.toFixed(2)} mi</span>
                  </div>
                  <div className="timestamp">
                    {new Date(point.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
