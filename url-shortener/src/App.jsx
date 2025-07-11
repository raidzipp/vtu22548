import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useParams, Link } from 'react-router-dom';
import './styles.css';

export default function App() {
  const [urls, setUrls] = useState(() => {
    const saved = localStorage.getItem('urls');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('urls', JSON.stringify(urls));
  }, [urls]);

  const shortenUrl = (original, validity = 30, customCode) => {
    const code = customCode || Math.random().toString(36).slice(2, 8);
    const expiry = new Date(Date.now() + validity * 60000);

    const newUrl = {
      id: Date.now(),
      original,
      short: `${window.location.origin}/#/${code}`,
      code,
      expiry,
      clicks: 0,
      history: [],
    };

    setUrls(prev => [...prev, newUrl]);
    return newUrl;
  };

  const handleRedirect = (code) => {
    const all = JSON.parse(localStorage.getItem('urls') || '[]');
    const url = all.find(u => u.code === code);
    if (!url) return null;

    // update stats
    url.clicks += 1;
    url.history.push({ time: new Date(), referrer: document.referrer });
    localStorage.setItem('urls', JSON.stringify(all));

    return url.original;
  };

  return (
    <Router>
      <div className="wrapper">
        <header>
          <h1>🔗 QuickLink</h1>
          <nav>
            <Link to="/" className="nav-btn">Shorten</Link>
            <Link to="/stats" className="nav-btn">📊 Stats</Link>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<ShortenerPage shortenUrl={shortenUrl} />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/:code" element={<RedirectPage handleRedirect={handleRedirect} />} />
        </Routes>
      </div>
    </Router>
  );
}

function ShortenerPage({ shortenUrl }) {
  const [url, setUrl] = useState('');
  const [validity, setValidity] = useState(30);
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    try {
      new URL(url);
      setError('');
      const res = shortenUrl(url, validity, code);
      setResult(res);
    } catch {
      setError('❌ Invalid URL');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.short);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="card">
      <h2>🔨 Create Short URL</h2>
      <form onSubmit={handleSubmit}>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Enter a long URL..." />
        <div className="row">
          <input type="number" min="1" value={validity} onChange={e => setValidity(e.target.value)} placeholder="Validity (min)" />
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="Custom code (optional)" />
        </div>
        <button type="submit">Generate Link 🚀</button>
        {error && <p className="error">{error}</p>}
      </form>
      {result && (
        <div className="result">
          <p>✅ Short URL:</p>
          <a href={result.short} target="_blank" rel="noreferrer">{result.short}</a>
          <button className="copy-btn" onClick={handleCopy}>{copied ? "✅ Copied!" : "📋 Copy"}</button>
          <small>Expires: {result.expiry.toLocaleString()}</small>
        </div>
      )}
    </div>
  );
}

function StatsPage() {
  const [urls, setUrls] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('urls');
    if (stored) setUrls(JSON.parse(stored));
  }, []);

  return (
    <div className="card">
      <h2>📊 URL Statistics</h2>
      {urls.length === 0 ? <p>No URLs yet.</p> : (
        <table>
          <thead>
            <tr><th>Short</th><th>Original</th><th>Clicks</th><th>Expiry</th></tr>
          </thead>
          <tbody>
            {urls.map(u => (
              <tr key={u.id}>
                <td><a href={u.short} target="_blank" rel="noreferrer">{u.short}</a></td>
                <td>{u.original}</td>
                <td>{u.clicks}</td>
                <td>{new Date(u.expiry).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function RedirectPage({ handleRedirect }) {
  const { code } = useParams();
  const target = handleRedirect(code);
  if (target) {
    window.location.href = target;
    return <div className="redirecting">Redirecting to destination... 🔁</div>;
  }
  return <Navigate to="/" />;
}
