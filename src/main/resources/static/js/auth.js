const statusEl = document.getElementById('authStatus');
const baseInput = document.getElementById('baseUrl');
const registerModal = document.getElementById('registerModal');
const registerForm = document.getElementById('registerForm');
const registerStatusEl = document.getElementById('registerStatus');
const registerSubmitBtn = registerForm?.querySelector('button[type="submit"]');

document.addEventListener('DOMContentLoaded', () => {
  const savedBase = localStorage.getItem('baseUrl') || 'http://localhost:8080';
  baseInput.value = savedBase;
  document.getElementById('username').focus();
});

function setStatus(msg, ok = false) {
  statusEl.textContent = msg;
  statusEl.style.color = ok ? '#2ad1ff' : '#f87171';
}

function setRegisterStatus(msg, ok = false) {
  if (!registerStatusEl) return;
  registerStatusEl.textContent = msg;
  registerStatusEl.style.color = ok ? '#2ad1ff' : '#f87171';
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
  localStorage.setItem('baseUrl', baseInput.value.trim());
}

function openRegisterModal() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  document.getElementById('regUsername').value = username;
  document.getElementById('regPassword').value = password;
  setRegisterStatus('');
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
