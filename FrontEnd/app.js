const API = "http://localhost:8000/api";
const token = localStorage.getItem('token');
if (!token) window.location.href = 'index.html';

const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
let map = null, markersLayer = null, userProfile = null;

// ─── TOAST ───
function toast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `toast ${type} show`;
  setTimeout(() => t.className = 'toast', 3000);
}

// ─── NAV ───
function switchSection(name) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-section="${name}"]`)?.classList.add('active');
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.getElementById(name + 'Section').classList.add('active');
  document.getElementById('topTitle').textContent = {
    my: 'My Skills', browse: 'Browse Skills', matches: 'Matches', nearby: 'Nearby Map', video: 'Video Call', trust: 'Trust Score', profile: 'Profile'
  }[name] || '';
  if (name === 'browse') loadAllSkills();
  if (name === 'matches') loadMatches();
  if (name === 'nearby') { loadNearby(); initMap(); }
  if (name === 'trust') loadTrustScore();
  if (name === 'profile') loadProfileForm();
  if (name === 'video') loadCallHistory();
  // close mobile sidebar
  document.querySelector('.sidebar')?.classList.remove('open');
}

function logout() { localStorage.removeItem('token'); window.location.href = 'index.html'; }
function toggleSidebar() { document.querySelector('.sidebar').classList.toggle('open'); }
function initials(n) { return n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2) : '?'; }
function timeAgo(d) { const x = Math.floor((Date.now() - new Date(d)) / 86400000); return x === 0 ? 'Today' : x === 1 ? 'Yesterday' : x + 'd ago'; }

// ─── SKILL CARD HTML ───
function skillCardHTML(skill, showDelete = false) {
  const user = skill.userId;
  const name = user?.name || 'Unknown';
  const email = user?.email || '';
  return `<div class="skill-card">
    <div class="skill-header">
      <div class="skill-user"><div class="avatar-xs">${initials(name)}</div>${name}${user?.location ? ' · ' + user.location : ''}</div>
      ${showDelete ? `<button class="btn btn-danger" onclick="deleteSkill('${skill._id}')">Delete</button>` : ''}
    </div>
    <div class="skill-exchange">
      <span class="pill pill-offer">${skill.skillOffered}</span>
      <span class="pill-arrow">⇄</span>
      <span class="pill pill-want">${skill.skillWanted}</span>
    </div>
    ${skill.description ? `<p class="skill-desc">${skill.description}</p>` : ''}
    <div class="skill-footer">
      <span class="level-badge">${skill.level}</span>
      <span class="skill-date">${timeAgo(skill.createdAt)}</span>
    </div>
    ${!showDelete && email ? `<a href="mailto:${email}?subject=SkillSwap: Interested in learning ${skill.skillOffered}" class="contact-link">📧 Contact ${name.split(' ')[0]}</a>` : ''}
    ${!showDelete && skill.userId?._id ? `<div class="video-call-link" onclick="startVideoCall('${skill.userId._id}')">📞 Video Call ${name.split(' ')[0]}</div>` : ''}
  </div>`;
}

// ─── PROFILE ───
async function loadProfile() {
  try {
    const res = await fetch(`${API}/user/profile`, { headers: authHeaders });
    const data = await res.json();
    if (!res.ok) return;
    userProfile = data;
    document.getElementById('profileName').textContent = data.name;
    document.getElementById('profileEmail').textContent = data.email;
    document.getElementById('profileAvatar').textContent = initials(data.name);
    document.getElementById('navUserName').textContent = data.name;
    document.getElementById('navUserEmail').textContent = data.email;
    document.getElementById('navAvatar').textContent = initials(data.name);
  } catch {}
}

// ─── MY SKILLS ───
async function loadMySkills() {
  try {
    const res = await fetch(`${API}/skills/my`, { headers: authHeaders });
    const data = await res.json();
    const list = document.getElementById('mySkillsList');
    if (!res.ok) throw new Error(data.message);
    if (data.length === 0) {
      list.innerHTML = `<div class="empty"><div class="empty-icon">🎯</div><h3>No skills yet</h3><p>Add your first skill above to get started.</p></div>`;
      return;
    }
    if (!userProfile) await loadProfile();
    const enriched = data.map(s => ({ ...s, userId: userProfile }));
    list.innerHTML = enriched.map(s => skillCardHTML(s, true)).join('');
  } catch (err) { toast(err.message, 'error'); }
}

async function loadAllSkills() {
  try {
    const res = await fetch(`${API}/skills/all`);
    const data = await res.json();
    const list = document.getElementById('allSkillsList');
    if (!res.ok) throw new Error(data.message);
    if (data.length === 0) { list.innerHTML = `<div class="empty"><div class="empty-icon">🌱</div><h3>No skills posted yet</h3><p>Be the first to add a skill!</p></div>`; return; }
    list.innerHTML = data.map(s => skillCardHTML(s)).join('');
  } catch (err) { toast(err.message, 'error'); }
}

async function loadMatches() {
  try {
    const res = await fetch(`${API}/skills/matches`, { headers: authHeaders });
    const data = await res.json();
    const list = document.getElementById('matchesList');
    if (!res.ok) throw new Error(data.message);
    const matches = data.matches || [];
    if (matches.length === 0) { list.innerHTML = `<div class="empty"><div class="empty-icon">🔍</div><h3>No matches yet</h3><p>Add more skills — matches are based on mutual skill exchange.</p></div>`; return; }
    list.innerHTML = matches.map(s => `<div class="skill-card match-card">
      <div class="skill-header"><div class="skill-user"><div class="avatar-xs">${initials(s.userId?.name)}</div>${s.userId?.name || 'Unknown'}${s.userId?.location ? ' · ' + s.userId.location : ''}</div></div>
      <div class="skill-exchange"><span class="pill pill-offer">${s.skillOffered}</span><span class="pill-arrow">⇄</span><span class="pill pill-want">${s.skillWanted}</span></div>
      ${s.description ? `<p class="skill-desc">${s.description}</p>` : ''}
      <div class="skill-footer"><span class="level-badge">${s.level}</span><span class="skill-date">${timeAgo(s.createdAt)}</span></div>
      ${s.userId?.email ? `<a href="mailto:${s.userId.email}?subject=SkillSwap Match: Let's exchange ${s.skillOffered} ⇄ ${s.skillWanted}" class="contact-link">📧 Contact ${(s.userId.name||'').split(' ')[0]}</a>` : ''}
      ${s.userId?._id ? `<div class="video-call-link" onclick="startVideoCall('${s.userId._id}')">📞 Video Call ${(s.userId.name||'').split(' ')[0]}</div>` : ''}
    </div>`).join('');
  } catch (err) { toast(err.message, 'error'); }
}

async function addSkill() {
  const skillOffered = document.getElementById('skillOffered').value.trim();
  const skillWanted = document.getElementById('skillWanted').value.trim();
  const level = document.getElementById('skillLevel').value;
  const description = document.getElementById('skillDesc').value.trim();
  if (!skillOffered || !skillWanted) return toast("Please fill in both skill fields", 'error');
  try {
    const res = await fetch(`${API}/skills/add`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ skillOffered, skillWanted, level, description }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast("Skill added!");
    document.getElementById('skillOffered').value = '';
    document.getElementById('skillWanted').value = '';
    document.getElementById('skillDesc').value = '';
    loadMySkills();
  } catch (err) { toast(err.message, 'error'); }
}

async function deleteSkill(id) {
  if (!confirm("Delete this skill?")) return;
  try {
    const res = await fetch(`${API}/skills/${id}`, { method: 'DELETE', headers: authHeaders });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast("Skill deleted"); loadMySkills();
  } catch (err) { toast(err.message, 'error'); }
}

// ─── MAP (Leaflet + OpenStreetMap) ───
function initMap() {
  if (map) return;
  const el = document.getElementById('mapElement');
  if (!el) return;
  map = L.map('mapElement').setView([20.5937, 78.9629], 5); // default: India center
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors', maxZoom: 18
  }).addTo(map);
  markersLayer = L.layerGroup().addTo(map);
  setTimeout(() => map.invalidateSize(), 300);
}

function createIcon(color, label) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background:${color};width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#0a0a0f;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.4);">${label}</div>`,
    iconSize: [32, 32], iconAnchor: [16, 16]
  });
}

async function setLocation() {
  const location = document.getElementById('locationInput').value.trim();
  const status = document.getElementById('locationStatus');
  if (!location) return toast("Enter a location first", 'error');
  status.textContent = "📍 Geocoding...";
  try {
    const res = await fetch(`${API}/geo/location`, { method: 'PUT', headers: authHeaders, body: JSON.stringify({ location }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    status.innerHTML = `<span style="color:var(--accent)">✓ ${data.resolvedAs}</span>`;
    toast("Location updated!");
    await loadProfile(); // refresh coordinates for map
    loadNearby();
  } catch (err) { status.textContent = ''; toast(err.message, 'error'); }
}

async function loadNearby() {
  const r = document.getElementById('radiusInput')?.value || 50;
  const list = document.getElementById('nearbyList');
  list.innerHTML = '<div class="loading-text">Finding nearby skills…</div>';
  try {
    const res = await fetch(`${API}/geo/nearby-skills?radius=${r}`, { headers: authHeaders });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    // Update map
    if (map && markersLayer) {
      markersLayer.clearLayers();
      // User marker
      if (userProfile?.coordinates?.lat) {
        const myMarker = L.marker([userProfile.coordinates.lat, userProfile.coordinates.lng], { icon: createIcon('#63d297', '📍') })
          .bindPopup(`<b>You</b><br>${userProfile.location || ''}`);
        markersLayer.addLayer(myMarker);
        map.setView([userProfile.coordinates.lat, userProfile.coordinates.lng], 10);
        // Radius circle
        L.circle([userProfile.coordinates.lat, userProfile.coordinates.lng], {
          radius: r * 1000, color: '#63d297', fillColor: '#63d297', fillOpacity: 0.06, weight: 1
        }).addTo(markersLayer);
      }
      // Skill markers
      data.skills?.forEach(s => {
        if (s.user?.coordinates?.lat) {
          const m = L.marker([s.user.coordinates.lat, s.user.coordinates.lng], { icon: createIcon('#5b9cf5', initials(s.user.name)) })
            .bindPopup(`<div style="font-family:Inter,sans-serif;min-width:160px;">
              <b>${s.user.name}</b><br>
              <span style="color:#63d297">Offers:</span> ${s.skillOffered}<br>
              <span style="color:#f0b542">Wants:</span> ${s.skillWanted}<br>
              <small>${s.distanceKm} km away · Trust: ${s.user.trustScore}</small>
            </div>`);
          markersLayer.addLayer(m);
        }
      });
    }

    if (!data.skills || data.skills.length === 0) {
      list.innerHTML = `<div class="empty"><div class="empty-icon">📍</div><h3>No nearby skills</h3><p>Try increasing the radius or ask others to set their location.</p></div>`;
      return;
    }
    list.innerHTML = data.skills.map(s => `<div class="skill-card">
      <div class="skill-header">
        <div class="skill-user"><div class="avatar-xs">${initials(s.user.name)}</div>${s.user.name} · <span class="skill-dist">${s.distanceKm} km</span></div>
        <span class="trust-label">Trust ${s.user.trustScore}</span>
      </div>
      <div class="skill-exchange"><span class="pill pill-offer">${s.skillOffered}</span><span class="pill-arrow">⇄</span><span class="pill pill-want">${s.skillWanted}</span></div>
      ${s.description ? `<p class="skill-desc">${s.description}</p>` : ''}
      <div class="skill-footer"><span class="level-badge">${s.level}</span><span class="skill-date">${timeAgo(s.createdAt)}</span></div>
      ${s.user.email ? `<a href="mailto:${s.user.email}?subject=SkillSwap: Interested in ${s.skillOffered} (${s.distanceKm}km away)" class="contact-link">📧 Contact ${s.user.name.split(' ')[0]}</a>` : ''}
      ${s.user._id ? `<div class="video-call-link" onclick="startVideoCall('${s.user._id}')">📞 Video Call ${s.user.name.split(' ')[0]}</div>` : ''}
    </div>`).join('');
  } catch (err) { list.innerHTML = `<div class="empty"><p>${err.message}</p></div>`; }
}

// ─── TRUST SCORE ───
function trustColor(s) { return s >= 70 ? 'var(--accent)' : s >= 40 ? 'var(--amber)' : 'var(--danger)'; }

async function loadTrustScore() {
  const card = document.getElementById('trustScoreCard');
  try {
    const res = await fetch(`${API}/trust/my-score`, { headers: authHeaders });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    const bd = data.breakdown;
    const stars = '⭐'.repeat(Math.round(data.averageRating)) || '—';
    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:24px;margin-bottom:20px;flex-wrap:wrap;">
        <div><div class="trust-big" style="color:${trustColor(data.trustScore)}">${data.trustScore}</div><div style="font-size:12px;color:var(--text-dim);margin-top:4px;">Trust Score / 100</div></div>
        <div style="flex:1;min-width:200px;">
          <div class="trust-bar-bg"><div class="trust-bar-fill" style="width:${data.trustScore}%;background:${trustColor(data.trustScore)};"></div></div>
          <div style="font-size:13px;color:var(--text-dim);">Rating: ${data.averageRating > 0 ? data.averageRating + ' ' + stars : 'No ratings'} · ${data.totalRatings} review${data.totalRatings !== 1 ? 's' : ''}</div>
          ${data.isFlagged ? `<div class="flag-banner">⚠ Flagged: ${data.flagReason}</div>` : ''}
        </div>
      </div>
      <div style="border-top:1px solid var(--border);padding-top:16px;">
        <div style="font-size:13px;font-weight:700;margin-bottom:12px;">Score Breakdown</div>
        <div class="score-grid">
          ${[['Ratings',bd.ratingScore,40],['Experience',bd.experienceScore,20],['Account Age',bd.ageScore,20],['Activity',bd.activityScore,20]].map(([l,v,m])=>`
          <div class="score-item"><div class="score-item-label">${l}</div><div class="score-item-val">${v}<span class="score-item-max">/${m}</span></div></div>`).join('')}
        </div>
      </div>
      ${data.recentRatings?.length > 0 ? `<div style="border-top:1px solid var(--border);padding-top:16px;margin-top:16px;">
        <div style="font-size:13px;font-weight:700;margin-bottom:10px;">Recent Reviews</div>
        ${data.recentRatings.map(r=>`<div style="padding:10px 0;border-bottom:1px solid var(--border);font-size:13px;">
          <span style="font-weight:600;">${r.fromUser?.name||'User'}</span> — ${'⭐'.repeat(r.score)} ${r.review?`<br><span style="color:var(--text-dim)">${r.review}</span>`:''}</div>`).join('')}
      </div>` : ''}`;
  } catch (err) { card.innerHTML = `<p style="color:var(--danger)">${err.message}</p>`; }
}

async function submitRating() {
  const toUserId = document.getElementById('rateUserId').value.trim();
  const score = parseInt(document.getElementById('rateScore').value);
  const review = document.getElementById('rateReview').value.trim();
  if (!toUserId) return toast("Paste a user ID", 'error');
  try {
    const res = await fetch(`${API}/trust/rate`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ toUserId, score, review }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast("Rating submitted!"); document.getElementById('rateUserId').value = ''; document.getElementById('rateReview').value = '';
    loadTrustScore();
  } catch (err) { toast(err.message, 'error'); }
}

// ─── PROFILE EDIT ───
async function loadProfileForm() {
  if (!userProfile) await loadProfile();
  if (userProfile) {
    document.getElementById('editName').value = userProfile.name || '';
    document.getElementById('editBio').value = userProfile.bio || '';
    document.getElementById('editLocation').value = userProfile.location || '';
  }
}

async function updateProfile() {
  const name = document.getElementById('editName').value.trim();
  const bio = document.getElementById('editBio').value.trim();
  const location = document.getElementById('editLocation').value.trim();
  try {
    const res = await fetch(`${API}/user/profile`, { method: 'PUT', headers: authHeaders, body: JSON.stringify({ name, bio, location }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast("Profile updated!"); await loadProfile();
  } catch (err) { toast(err.message, 'error'); }
}

// ─── VIDEO CALL (Jitsi Meet + Socket.IO) ───
let activeVideoCall = false;
let currentCallId = null;
let callTimerInterval = null;
let callStartTime = null;
let incomingCallData = null;

// Socket.IO connection
const socket = io('http://localhost:8000');

function initSocket() {
  if (!userProfile) return;

  socket.emit('register', userProfile._id);

  socket.on('incoming-call', (data) => {
    console.log('Incoming call:', data);
    incomingCallData = data;
    showIncomingCallPopup(data);
  });

  socket.on('call-response', (data) => {
    if (data.action === 'accepted') {
      toast(`${data.receiver.name} accepted your call!`);
    } else if (data.action === 'declined') {
      toast(`${data.receiver.name} declined your call`, 'error');
      endVideoCall(true); // silent end, don't hit API again
    }
  });

  socket.on('call-ended', (data) => {
    if (activeVideoCall && currentCallId === data.callId) {
      toast("The other person ended the call");
      endVideoCall(true);
    }
  });
}

function showIncomingCallPopup(data) {
  const overlay = document.getElementById('incomingCallOverlay');
  document.getElementById('incomingCallerName').textContent = data.caller.name;
  document.getElementById('incomingCallerAvatar').textContent = initials(data.caller.name);
  overlay.style.display = 'flex';

  // Auto-dismiss after 30s
  if (window._incomingCallTimeout) clearTimeout(window._incomingCallTimeout);
  window._incomingCallTimeout = setTimeout(() => {
    if (overlay.style.display === 'flex') {
      hideIncomingCallPopup();
      toast("Missed call from " + data.caller.name, 'error');
    }
  }, 30000);
}

function hideIncomingCallPopup() {
  document.getElementById('incomingCallOverlay').style.display = 'none';
  if (window._incomingCallTimeout) clearTimeout(window._incomingCallTimeout);
  incomingCallData = null;
}

async function acceptIncomingCall() {
  if (!incomingCallData) return;
  const data = incomingCallData;
  hideIncomingCallPopup();

  try {
    const res = await fetch(`${API}/video/respond`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ callId: data.callId, action: 'accepted' })
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message);

    // Start the call
    currentCallId = data.callId;
    switchSection('video');
    document.getElementById('videoCallIdle').style.display = 'none';
    document.getElementById('videoCallActive').style.display = 'block';
    document.getElementById('videoCallPartner').textContent = data.caller.name;

    const displayName = encodeURIComponent(userProfile?.name || 'User');
    const jitsiUrl = `https://${data.jitsiDomain}/${data.roomName}#userInfo.displayName="${displayName}"&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.prejoinPageEnabled=false&interfaceConfig.SHOW_JITSI_WATERMARK=false`;
    document.getElementById('jitsiFrame').src = jitsiUrl;
    activeVideoCall = true;
    startCallTimer();
    toast(`Video call with ${data.caller.name} started!`);
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function declineIncomingCall() {
  if (!incomingCallData) return;
  const data = incomingCallData;
  hideIncomingCallPopup();

  try {
    await fetch(`${API}/video/respond`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ callId: data.callId, action: 'declined' })
    });
    toast("Call declined");
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function startVideoCall(targetUserId) {
  if (!targetUserId) return toast("No user ID provided", 'error');
  try {
    toast("Calling…");
    const res = await fetch(`${API}/video/create-room`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ targetUserId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    currentCallId = data.callId;

    // Switch to video section
    switchSection('video');

    // Show active call UI
    document.getElementById('videoCallIdle').style.display = 'none';
    document.getElementById('videoCallActive').style.display = 'block';
    document.getElementById('videoCallPartner').textContent = data.targetUser.name;

    // Build Jitsi URL with config
    const displayName = encodeURIComponent(data.currentUser.name);
    const jitsiUrl = `https://${data.jitsiDomain}/${data.roomName}#userInfo.displayName="${displayName}"&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.prejoinPageEnabled=false&interfaceConfig.SHOW_JITSI_WATERMARK=false`;

    document.getElementById('jitsiFrame').src = jitsiUrl;
    activeVideoCall = true;
    startCallTimer();
    toast(`Calling ${data.targetUser.name}…`);
  } catch (err) {
    toast(err.message, 'error');
  }
}

async function endVideoCall(silent = false) {
  // Notify server
  if (!silent && currentCallId) {
    try {
      await fetch(`${API}/video/end`, {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ callId: currentCallId })
      });
    } catch {}
  }

  document.getElementById('jitsiFrame').src = '';
  document.getElementById('videoCallIdle').style.display = 'block';
  document.getElementById('videoCallActive').style.display = 'none';
  document.getElementById('videoCallPartner').textContent = '—';
  activeVideoCall = false;
  currentCallId = null;
  stopCallTimer();
  if (!silent) toast("Video call ended");
  loadCallHistory(); // Refresh history
}

function startQuickCall() {
  const userId = document.getElementById('quickCallUserId').value.trim();
  if (!userId) return toast("Please paste a user ID", 'error');
  startVideoCall(userId);
}

// ─── CALL TIMER ───
function startCallTimer() {
  callStartTime = Date.now();
  const timerEl = document.getElementById('callTimer');
  if (callTimerInterval) clearInterval(callTimerInterval);
  callTimerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
    const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    timerEl.textContent = `${mins}:${secs}`;
  }, 1000);
}

function stopCallTimer() {
  if (callTimerInterval) {
    clearInterval(callTimerInterval);
    callTimerInterval = null;
  }
  const timerEl = document.getElementById('callTimer');
  if (timerEl) timerEl.textContent = '00:00';
  callStartTime = null;
}

// ─── CALL HISTORY ───
function formatDuration(secs) {
  if (!secs || secs === 0) return '';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatCallTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);

  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (diffDays === 0) return `Today ${timeStr}`;
  if (diffDays === 1) return `Yesterday ${timeStr}`;
  if (diffDays < 7) return `${diffDays}d ago ${timeStr}`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + timeStr;
}

async function loadCallHistory() {
  const list = document.getElementById('callHistoryList');
  if (!list) return;

  try {
    const res = await fetch(`${API}/video/history`, { headers: authHeaders });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);

    const calls = data.calls || [];
    if (calls.length === 0) {
      list.innerHTML = `<div class="empty"><div class="empty-icon">📞</div><h3>No calls yet</h3><p>Start a video call from any skill card to see your history here.</p></div>`;
      return;
    }

    const myId = userProfile?._id;

    list.innerHTML = calls.map(c => {
      const isOutgoing = c.caller?._id === myId;
      const otherUser = isOutgoing ? c.receiver : c.caller;
      const otherName = otherUser?.name || 'Unknown';
      const direction = isOutgoing ? '↗ Outgoing' : '↙ Incoming';
      const dirClass = isOutgoing ? 'outgoing' : 'incoming';
      const statusIcon = {
        accepted: '✅', declined: '❌', missed: '⚠️', ended: '✅', ringing: '📞'
      }[c.status] || '';

      return `<div class="call-history-item">
        <div class="call-history-avatar ${dirClass}">${initials(otherName)}</div>
        <div class="call-history-details">
          <div class="call-history-name">${otherName} <span class="call-direction">${direction}</span></div>
          <div class="call-history-meta">
            <span class="call-status-badge ${c.status}">${statusIcon} ${c.status}</span>
            ${c.duration > 0 ? `<span class="call-history-duration">⏱ ${formatDuration(c.duration)}</span>` : ''}
          </div>
        </div>
        <div class="call-history-time">${formatCallTime(c.createdAt)}</div>
        <div class="call-history-actions">
          <button class="call-history-btn" onclick="startVideoCall('${otherUser?._id}')">📞 Call</button>
        </div>
      </div>`;
    }).join('');
  } catch (err) {
    list.innerHTML = `<div class="empty"><p style="color:var(--danger);">${err.message}</p></div>`;
  }
}

// ─── INIT ───
(async () => {
  await loadProfile();
  loadMySkills();
  initSocket();
  loadCallHistory();
})();

