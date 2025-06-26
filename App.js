import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

function useAuth() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const email = localStorage.getItem('email');
    const subscriptionType = localStorage.getItem('subscriptionType');
    return { token, email, subscriptionType };
  });

  function login(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('email', data.email);
    localStorage.setItem('subscriptionType', data.subscriptionType);
    setUser(data);
  }

  function logout() {
    localStorage.clear();
    setUser(null);
  }

  return { user, login, logout };
}

function PrivateRoute({ user, children }) {
  return user ? children : <Navigate to="/login" />;
}

function Register({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, { email, password });
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  }

  return (
    <div>
      <h2>Register</h2>
      {error && <p style={{color:'red'}}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} /><br/>
        <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} /><br/>
        <button type="submit">Register</button>
      </form>
      <p>Have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
      onLogin(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  }

  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{color:'red'}}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} /><br/>
        <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} /><br/>
        <button type="submit">Login</button>
      </form>
      <p>No account? <Link to="/register">Register</Link></p>
    </div>
  );
}

function Dashboard({ user, logout }) {
  const [income, setIncome] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [taxData, setTaxData] = useState(null);
  const [message, setMessage] = useState('');

  async function fetchProfile() {
    try {
      const res = await axios.get(`${API_BASE}/tax/profile`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setIncome(res.data.income);
      setDeductions(res.data.deductions);
      setTaxData(res.data);
    } catch {
      setMessage('Failed to load tax profile.');
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/tax/profile`,
        { income: Number(income), deductions: Number(deductions) },
        { headers: { Authorization: `Bearer ${user.token}` } });
      setTaxData(res.data);
      setMessage('Tax calculated successfully.');
    } catch {
      setMessage('Failed to calculate tax.');
    }
  }

  return (
    <div>
      <h2>Welcome, {user.email} ({user.subscriptionType} user)</h2>
      <button onClick={logout}>Logout</button>
      <hr />
      <form onSubmit={handleSubmit}>
        <label>Income:</label><br />
        <input type="number" value={income} onChange={e => setIncome(e.target.value)} /><br />
        <label>Deductions:</label><br />
        <input type="number" value={deductions} onChange={e => setDeductions(e.target.value)} /><br />
        <button type="submit">Calculate Tax</button>
      </form>
      {taxData && (
        <div>
          <h3>Tax Summary:</h3>
          <p>Income: ${taxData.income}</p>
          <p>Deductions: ${taxData.deductions}</p>
          <p><strong>Tax Calculated: ${taxData.taxCalculated.toFixed(2)}</strong></p>
        </div>
      )}
      {message && <p>{message}</p>}
    </div>
  );
}

export default function App() {
  const { user, login, logout } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PrivateRoute user={user}><Dashboard user={user} logout={logout} /></PrivateRoute>} />
        <Route path="/login" element={<Login onLogin={login} />} />
        <Route path="/register" element={<Register onLogin={login} />} />
      </Routes>
    </BrowserRouter>
  );
}
