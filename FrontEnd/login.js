const API = "/api";

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
    
    if (!res.ok) {
      if (res.status === 403 && data.banned) {
        showBanWarning(data.timeRemaining);
        return;
      }
      throw new Error(data.message || "Login failed");
    }

    localStorage.setItem('token', data.token);
    showAlert("Welcome back! Redirecting…", "success");
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);

  } catch (err) {
    showAlert(err.message);
  } finally {
    setLoading(btn, false);
  }
}

function showBanWarning(hours) {
  let overlay = document.getElementById('banWarningOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'banWarningOverlay';
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:10000; display:flex; justify-content:center; align-items:center; backdrop-filter:blur(10px);';
    overlay.innerHTML = `
      <div style="background:#2a0a10; border:2px solid #ff4b4b; border-radius:16px; padding:40px; max-width:500px; text-align:center; box-shadow:0 10px 40px rgba(255,75,75,0.3);">
        <div style="font-size:48px; margin-bottom:16px;">⚠️</div>
        <h2 style="color:#ff4b4b; font-size:24px; font-weight:800; margin-bottom:12px; text-transform:uppercase;">Account Banned</h2>
        <p style="color:#ffb3b3; font-size:16px; margin-bottom:24px; line-height:1.5;">
          For severe safety policy violations, your account has been temporarily banned.
        </p>
        <div style="font-family:monospace; font-size:24px; color:#ff4b4b; font-weight:700;">Time remaining: <span id="banWarningHours">${hours}</span> hours</div>
        <button onclick="document.getElementById('banWarningOverlay').style.display='none'" style="margin-top:24px; background:#ff4b4b; color:#fff; border:none; padding:10px 24px; border-radius:8px; font-weight:bold; cursor:pointer;">Close</button>
      </div>
    `;
    document.body.appendChild(overlay);
  } else {
    document.getElementById('banWarningHours').textContent = hours;
    overlay.style.display = 'flex';
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
