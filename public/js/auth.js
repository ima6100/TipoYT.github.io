// ============ АВТОРИЗАЦИЯ ============
const API_BASE = window.location.origin;
const STORAGE_KEY = 'tipweyt_user';

function saveUser(user) { localStorage.setItem(STORAGE_KEY, JSON.stringify(user)); }
function getSavedUser() { const data = localStorage.getItem(STORAGE_KEY); return data ? JSON.parse(data) : null; }
function clearUser() { localStorage.removeItem(STORAGE_KEY); }
function getCurrentUser() { return getSavedUser(); }
function isLoggedIn() { return !!getSavedUser(); }

function updateSavedUser(updates) {
  const user = getSavedUser();
  if (user) { Object.assign(user, updates); saveUser(user); }
}

// Обновить шапку
function updateHeader() {
  const userMenu = document.getElementById('userMenu');
  if (!userMenu) return;
  const user = getSavedUser();
  if (user) {
    const avatarLetter = user.username.charAt(0).toUpperCase();
    const avatarColor = getAvatarColor(user.username);
    userMenu.innerHTML = `
      <div class="user-menu-dropdown">
        <button class="user-menu-btn" onclick="toggleDropdown()">
          <span class="user-avatar-small" style="background:${avatarColor}">${avatarLetter}</span>
          <span class="user-name">${user.username}</span>
          <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M7 10l5 5 5-5z"/></svg>
        </button>
        <div class="dropdown-content" id="dropdownContent" style="display:none">
          <a href="/channel/settings.html" class="dropdown-item">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            ${user.hasChannel ? 'Настройки канала' : 'Создать канал'}
          </a>
          <button class="dropdown-item" onclick="logoutUser()">
            <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
            Выйти
          </button>
        </div>
      </div>`;
  } else {
    userMenu.innerHTML = `<a href="/auth/login.html" class="btn-login">Войти</a>`;
  }
}

function getAvatarColor(username) {
  const colors = ['#ff4d4d', '#3ea6ff', '#4CAF50', '#ff9800', '#9c27b0', '#00bcd4', '#e91e63', '#ff5722'];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function toggleDropdown() {
  const dd = document.getElementById('dropdownContent');
  if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-menu-dropdown')) {
    const dd = document.getElementById('dropdownContent');
    if (dd) dd.style.display = 'none';
  }
});

function logoutUser() { clearUser(); window.location.href = '/'; }

// Вход
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('authBtn');
    const btnText = document.getElementById('authBtnText');
    const spinner = document.getElementById('authSpinner');
    const errorEl = document.getElementById('authError');
    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'flex';
    errorEl.style.display = 'none';
    try {
      const resp = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: document.getElementById('loginInput').value, password: document.getElementById('passwordInput').value })
      });
      const data = await resp.json();
      if (data.success) { saveUser(data.user); window.location.href = '/'; }
      else { errorEl.textContent = data.error || 'Ошибка'; errorEl.style.display = 'block'; }
    } catch (err) { errorEl.textContent = 'Ошибка соединения'; errorEl.style.display = 'block'; }
    btn.disabled = false;
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
  });
}

// Регистрация
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('authBtn');
    const btnText = document.getElementById('authBtnText');
    const spinner = document.getElementById('authSpinner');
    const errorEl = document.getElementById('authError');
    const password = document.getElementById('passwordInput').value;
    const confirm = document.getElementById('passwordConfirmInput').value;
    if (password !== confirm) { errorEl.textContent = 'Пароли не совпадают'; errorEl.style.display = 'block'; return; }
    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'flex';
    errorEl.style.display = 'none';
    try {
      const resp = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: document.getElementById('usernameInput').value, email: document.getElementById('emailInput').value, password })
      });
      const data = await resp.json();
      if (data.success) { saveUser(data.user); window.location.href = '/'; }
      else { errorEl.textContent = data.error || 'Ошибка'; errorEl.style.display = 'block'; }
    } catch (err) { errorEl.textContent = 'Ошибка соединения'; errorEl.style.display = 'block'; }
    btn.disabled = false;
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
  });
}

document.addEventListener('DOMContentLoaded', updateHeader);