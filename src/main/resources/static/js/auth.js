const statusEl = document.getElementById('authStatus');
const baseInput = document.getElementById('baseUrl');

document.addEventListener('DOMContentLoaded', () => {
  const savedBase = localStorage.getItem('baseUrl') || 'http://localhost:8082';
  baseInput.value = savedBase;
  document.getElementById('username').focus();
});

function setStatus(msg, ok = false) {
  statusEl.textContent = msg;
  statusEl.style.color = ok ? '#2ad1ff' : '#f87171';
}

function guardarBaseUrl() {
  localStorage.setItem('baseUrl', baseInput.value.trim());
}

async function login() {
  guardarBaseUrl();
  const base = baseInput.value.trim();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) return setStatus('Usuario y contraseña requeridos');

  try {
    const res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) return setStatus(`Login falló: ${res.status}`);
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('username', username);
    localStorage.setItem('baseUrl', base);
    setStatus('Login ok, redirigiendo...', true);
    setTimeout(() => (window.location = 'app.html'), 300);
  } catch (e) {
    setStatus(`Error de red: ${e.message}`);
  }
}

async function register() {
  guardarBaseUrl();
  const base = baseInput.value.trim();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const email = prompt('Email del empleado:', `${username || 'empleado'}@logitrack.com`) || '';
  const nombres = prompt('Nombres:', 'Empleado') || 'Empleado';
  const apellidos = prompt('Apellidos:', 'LogiTrack') || 'LogiTrack';

  if (!username || !password) return setStatus('Usuario y contraseña requeridos');

  try {
    const res = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email, nombres, apellidos })
    });
    if (!res.ok) return setStatus(`Registro falló: ${res.status} (revisa si falta algún campo)`);
    setStatus('Empleado creado, ahora haz login.', true);
  } catch (e) {
    setStatus(`Error de red: ${e.message}`);
  }
}
