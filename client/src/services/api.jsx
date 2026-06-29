import { createContext, useContext, useState, useEffect } from 'react';

export async function apiFetch(endpoint, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const resp = await fetch(
    `${import.meta.env.VITE_API_URL || 'http://localhost:5005'}${endpoint}`,
    {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    }
  );

  const text = await resp.text();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(text);
  }

  if (!resp.ok) {
    throw new Error(data.error || 'Request failed');
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
  const res = await apiFetch('/auth/login', {
    method: 'POST',
    body: { username, password },
  });

  console.log("LOGIN RESPONSE:", res);

  localStorage.setItem('token', res.token);
  localStorage.setItem('user', JSON.stringify({
    id: res.doctorId,
    name: res.name
  }));

  setUser({ id: res.doctorId, name: res.name });
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