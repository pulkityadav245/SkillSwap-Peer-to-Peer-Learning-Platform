const API = "http://localhost:8000/api";

function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
  document.getElementById(tab === 'login' ? 'tabLogin' : 'tabRegister').classList.add('active');
  document.getElementById(tab === 'login' ? 'loginSection' : 'registerSection').classList.add('active');
  hideAlert();
}

function showAlert(msg, type = 'error') {
  const box = document.getElementById('alertBox');
  box.textContent = msg;
  box.className = `alert ${type}`;
}

function hideAlert() {
  document.getElementById('alertBox').className = 'alert hidden';
}

function setLoading(btn, loading) {
  if (loading) { btn.classList.add('loading'); btn.disabled = true; }
  else { btn.classList.remove('loading'); btn.disabled = false; }
}

async function handleLogin() {
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn      = document.getElementById('loginBtn');

  if (!email || !password) return showAlert("Please fill in all fields");

  setLoading(btn, true);

  try {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");

    localStorage.setItem('token', data.token);
    showAlert("Welcome back! Redirecting…", "success");
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);

  } catch (err) {
    showAlert(err.message);
  } finally {
    setLoading(btn, false);
  }
}

async function handleRegister() {
  const name     = document.getElementById('regName').value.trim();
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const btn      = document.getElementById('regBtn');

  if (!name || !email || !password) return showAlert("Please fill in all fields");
  if (password.length < 6) return showAlert("Password must be at least 6 characters");

  setLoading(btn, true);

  try {
    const res  = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");

    showAlert("Account created! Signing you in…", "success");
    setTimeout(() => switchTab('login'), 1200);

  } catch (err) {
    showAlert(err.message);
  } finally {
    setLoading(btn, false);
  }
}

// Redirect if already authenticated
if (localStorage.getItem('token')) {
  window.location.href = 'dashboard.html';
}

// Enter key submit
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const loginActive = document.getElementById('loginSection').classList.contains('active');
    if (loginActive) handleLogin(); else handleRegister();
  }
});
