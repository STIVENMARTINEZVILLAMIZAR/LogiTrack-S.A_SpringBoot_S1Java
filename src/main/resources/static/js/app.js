let token, baseUrl;
const outputs = {
  bodegas: document.getElementById('outBodegas'),
  productos: document.getElementById('outProductos'),
  mov: document.getElementById('outMov'),
  audit: document.getElementById('outAudit')
};

document.addEventListener('DOMContentLoaded', () => {
  token = localStorage.getItem('token');
  baseUrl = localStorage.getItem('baseUrl') || 'http://localhost:8082';
  if (!token) return (window.location = 'login.html');

  document.getElementById('baseUrl').value = baseUrl;
  document.getElementById('tokenStatus').textContent =
    `Sesión: ${localStorage.getItem('username') || 'usuario'}`;
});

function guardarBaseUrl() {
  baseUrl = document.getElementById('baseUrl').value.trim();
  localStorage.setItem('baseUrl', baseUrl);
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(tab).classList.add('active');
}

function logout() {
  localStorage.removeItem('token');
  window.location = 'login.html';
}

async function fetchJson(path, options = {}) {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  if (res.status === 401 || res.status === 403) return logout();
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function render(el, data) {
  el.textContent = '';
  el.textContent = JSON.stringify(data, null, 2);
}

/* Bodegas */
async function filtrarBodegas() {
  try {
    const data = await fetchJson('/bodegas');
    render(outputs.bodegas, data);
  } catch (e) { render(outputs.bodegas, { error: e.message }); }
}

/* Productos */
async function filtrarProductos() {
  try {
    const data = await fetchJson('/productos');
    render(outputs.productos, data);
  } catch (e) { render(outputs.productos, { error: e.message }); }
}

/* Movimientos */
async function filtrarMovimientos() {
  const d = document.getElementById('movDesde').value;
  const h = document.getElementById('movHasta').value;
  const query = (d || h) ? `?desde=${d || ''}&hasta=${h || ''}` : '';
  try {
    const data = await fetchJson(`/movimientos${query}`);
    render(outputs.mov, data);
  } catch (e) { render(outputs.mov, { error: e.message }); }
}

/* Auditoría */
async function filtrarAuditoria() {
  const u = document.getElementById('audUser').value;
  const a = document.getElementById('audAccion').value;
  const params = new URLSearchParams();
  if (u) params.append('usuarioId', u);
  if (a) params.append('accion', a);
  try {
    const data = await fetchJson(`/auditorias${params.toString() ? '?' + params.toString() : ''}`);
    render(outputs.audit, data);
  } catch (e) { render(outputs.audit, { error: e.message }); }
}
