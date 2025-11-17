const API_URL = "http://127.0.0.1:8000"; 

// --- Auth ---
export async function login(email, password) {
  const formData = new FormData();
  formData.append("username", email);
  formData.append("password", password);

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Invalid credentials");
  return await res.json();
}

export async function signup(name, email, password) {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("email", email);
  formData.append("password", password);

  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Signup failed");
  return await res.json();
}

// --- Verification ---
export async function verifyDocument(token, file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user_email", "user@demo.com"); 

  const res = await fetch(`${API_URL}/compliance/verify_identity`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Verification failed: ${txt}`);
  }
  return await res.json();
}

// --- Compliance & Admin ---
export async function getLogs() {
  const res = await fetch(`${API_URL}/compliance/logs`);
  if (!res.ok) throw new Error("Failed to fetch logs");
  return await res.json();
}

export async function getAlerts() {
  const res = await fetch(`${API_URL}/compliance/alerts`);
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return await res.json();
}

// --- NEW: Dismiss Alert ---
export async function dismissAlert(alertId) {
  const res = await fetch(`${API_URL}/compliance/alerts/dismiss/${alertId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to dismiss alert");
  return await res.json();
}

export async function getUserDocs(token) {
  const res = await fetch(`${API_URL}/docs/my-docs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch documents");
  return await res.json();
}

export async function addLog(payload) {
  const res = await fetch(`${API_URL}/compliance/logs/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return await res.json();
}