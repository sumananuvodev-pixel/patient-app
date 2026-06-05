import { createContext, useContext, useState, useEffect } from 'react';

export async function apiFetch(endpoint, { method = 'GET', body, ...opts } = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    // Attach doctor ID for backend calls when JWT is not used
    ...(() => {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const user = JSON.parse(stored);
          if (user && user.id) {
            return { 'x-doctor-id': user.id };
          }
        }
      } catch (_) {}
      return {};
    })(),
  };
  const cfg = { method, headers, ...opts };
  if (body) cfg.body = JSON.stringify(body);
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5005';
  const url = apiBase ? `${apiBase}${endpoint}` : `/api${endpoint}`;
  const resp = await fetch(url, cfg);
  const data = await resp.json();
  if (!resp.ok) {
    const err = new Error(data.error || resp.statusText);
    err.response = resp;
    err.data = data;
    throw err;
  }
  return data;
}

// ---------- Auth Context ----------
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // No JWTs are used in this simplified setup. We simply persist the logged‑in user
  // (if any) in localStorage as a JSON string.
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (_) {
        // Corrupted entry – clear it.
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (username, password) => {
    const { doctorId, name } = await apiFetch('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    const loggedUser = { id: doctorId, name };
    localStorage.setItem('user', JSON.stringify(loggedUser));
    setUser(loggedUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);