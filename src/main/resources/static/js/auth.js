const statusEl = document.getElementById('authStatus');
const baseInput = document.getElementById('baseUrl');
const registerModal = document.getElementById('registerModal');
const registerForm = document.getElementById('registerForm');
const registerStatusEl = document.getElementById('registerStatus');
const registerSubmitBtn = registerForm?.querySelector('button[type="submit"]');
const registerRoleSelect = document.getElementById('regRol');
const roleNote = document.getElementById('roleNote');
const loginRoleEl = document.getElementById('loginRole');

document.addEventListener('DOMContentLoaded', () => {
  const origin = window.location.origin;
  const savedBase = localStorage.getItem('baseUrl');
  if (savedBase) {
    baseInput.value = savedBase;
  } else if (origin && origin !== 'null') {
    baseInput.value = origin;
    localStorage.setItem('baseUrl', origin);
  } else {
    baseInput.value = defaultBaseUrl();
  }
  document.getElementById('username').focus();
  applyLoginRoleHint();
});

function defaultBaseUrl() {
  const origin = window.location.origin;
  if (origin && origin !== 'null') return origin;
  return 'http://localhost:8080';
}

function applyLoginRoleHint() {
  if (!loginRoleEl) return;
  const params = new URLSearchParams(window.location.search);
  const role = params.get('role');
  if (role === 'ADMIN') {
    loginRoleEl.textContent = 'Modo: Administrador';
  } else if (role === 'EMPLEADO') {
    loginRoleEl.textContent = 'Modo: Empleado';
  } else {
    loginRoleEl.textContent = 'Modo: Acceso general';
  }
}

function setStatus(msg, ok = false) {
  statusEl.textContent = msg;
  statusEl.style.color = ok ? '#2ad1ff' : '#f87171';
}

function setRegisterStatus(msg, ok = false) {
  if (!registerStatusEl) return;
  registerStatusEl.textContent = msg;
  registerStatusEl.style.color = ok ? '#2ad1ff' : '#f87171';
}

function parseJwt(raw) {
  try {
    const payload = raw.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

function updateRoleControl() {
  if (!registerRoleSelect || !roleNote) return;
  const token = localStorage.getItem('token');
  const roles = Array.isArray(parseJwt(token)?.roles) ? parseJwt(token).roles : [];
  const isAdmin = roles.includes('ADMIN');
  if (isAdmin) {
    registerRoleSelect.disabled = false;
    roleNote.textContent = '';
  } else {
    registerRoleSelect.value = 'EMPLEADO';
    registerRoleSelect.disabled = true;
    roleNote.textContent = 'Solo un administrador puede asignar rol.';
  }
}

async function readError(res) {
  const text = await res.text();
  if (!text) return `HTTP ${res.status}`;
  try {
    const data = JSON.parse(text);
    if (typeof data === 'string') return data;
    if (data.error) return data.error;
    if (typeof data === 'object') {
      return Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(', ');
    }
  } catch (e) {
    return text;
  }
  return text;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function guardarBaseUrl() {
  const clean = baseInput.value.trim().replace(/\/+$/, '');
  baseInput.value = clean;
  localStorage.setItem('baseUrl', clean);
}

function openRegisterModal() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  document.getElementById('regUsername').value = username;
  document.getElementById('regPassword').value = password;
  setRegisterStatus('');
  updateRoleControl();
  registerModal.classList.add('open');
  registerModal.setAttribute('aria-hidden', 'false');
  document.getElementById('regNombre').focus();
}

function closeRegisterModal() {
  registerModal.classList.remove('open');
  registerModal.setAttribute('aria-hidden', 'true');
  setRegisterStatus('');
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && registerModal.classList.contains('open')) {
    closeRegisterModal();
  }
});

async function login() {
  guardarBaseUrl();
  const base = baseInput.value.trim();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) return setStatus('Usuario y contraseña requeridos');

  try {
    const res = await fetchWithTimeout(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) return setStatus(`Login falló: ${await readError(res)}`);
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', username);
    localStorage.setItem('baseUrl', base);
    setStatus('Login ok, redirigiendo...', true);
    setTimeout(() => (window.location = 'app.html'), 300);
  } catch (e) {
    const msg = e.name === 'AbortError'
      ? 'Sin respuesta del servidor. Revisa el Base URL.'
      : `Error de red: ${e.message}`;
    setStatus(msg);
  }
}

async function submitRegister(event) {
  event.preventDefault();
  guardarBaseUrl();
  const base = baseInput.value.trim();
  const nombre = document.getElementById('regNombre').value.trim();
  const apellido = document.getElementById('regApellido').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;
  const rol = document.getElementById('regRol').value;

  if (!nombre || !apellido || !email || !username || !password) {
    return setRegisterStatus('Todos los campos son obligatorios');
  }

  try {
    if (registerSubmitBtn) registerSubmitBtn.disabled = true;
    setRegisterStatus('Creando usuario...', true);
    const res = await fetchWithTimeout(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, apellido, username, email, password, rol })
    });
    if (!res.ok) return setRegisterStatus(`Registro falló: ${await readError(res)}`);
    closeRegisterModal();
    setStatus('Usuario creado, ahora haz login.', true);
    registerForm.reset();
  } catch (e) {
    const msg = e.name === 'AbortError'
      ? 'Sin respuesta del servidor. Revisa el Base URL.'
      : `Error de red: ${e.message}`;
    setRegisterStatus(msg);
  } finally {
    if (registerSubmitBtn) registerSubmitBtn.disabled = false;
  }
}
