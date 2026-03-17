let token, baseUrl;
const outputs = {
  bodegas: document.getElementById('outBodegas'),
  productos: document.getElementById('outProductos'),
  mov: document.getElementById('outMov'),
  audit: document.getElementById('outAudit')
};
const userStatusEl = document.getElementById('userStatus');

function parseJwt(raw) {
  try {
    const payload = raw.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

function applyRoleVisibility(roles) {
  const auditTab = document.querySelector('[data-tab="auditoria"]');
  const auditSection = document.getElementById('auditoria');
  const usersTab = document.querySelector('[data-tab="usuarios"]');
  const usersSection = document.getElementById('usuarios');
  const isAdmin = roles.includes('ADMIN');
  if (!isAdmin) {
    auditTab.style.display = 'none';
    auditSection.classList.remove('active');
    if (usersTab) usersTab.style.display = 'none';
    if (usersSection) usersSection.classList.remove('active');
    if (document.querySelector('.nav-item.active')?.dataset?.tab === 'auditoria') {
      switchTab('bodegas');
    }
  }
}

function formatValue(value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'number') return value.toString();
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === 'object') return JSON.stringify(value, null, 0);
  return String(value);
}

function renderTable(data) {
  const template = document.getElementById('tableTemplate');
  const node = template.content.cloneNode(true);
  const table = node.querySelector('table');
  const thead = node.querySelector('thead');
  const tbody = node.querySelector('tbody');

  if (!Array.isArray(data)) {
    const row = document.createElement('tr');
    const keyCell = document.createElement('td');
    const valCell = document.createElement('td');
    keyCell.textContent = 'Error';
    valCell.textContent = 'No se recibieron datos en formato de lista.';
    row.appendChild(keyCell);
    row.appendChild(valCell);
    tbody.appendChild(row);
    return node;
  }

  if (data.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 100;
    cell.textContent = 'No hay registros para mostrar.';
    cell.className = 'empty';
    row.appendChild(cell);
    tbody.appendChild(row);
    return node;
  }

  const first = data[0];
  const columns = Object.keys(first);
  const headRow = document.createElement('tr');
  columns.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  data.forEach(item => {
    const row = document.createElement('tr');
    columns.forEach(col => {
      const td = document.createElement('td');
      td.textContent = formatValue(item[col]);
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });

  return node;
}

function render(el, data) {
  el.textContent = '';
  if (Array.isArray(data)) {
    el.appendChild(renderTable(data));
  } else if (data && typeof data === 'object') {
    if (data.error) {
      const error = document.createElement('div');
      error.className = 'error';
      error.textContent = data.error;
      el.appendChild(error);
      return;
    }
    const pre = document.createElement('pre');
    pre.textContent = JSON.stringify(data, null, 2);
    el.appendChild(pre);
  } else {
    const pre = document.createElement('pre');
    pre.textContent = String(data);
    el.appendChild(pre);
  }
}

function setUserStatus(msg, ok = false) {
  if (!userStatusEl) return;
  userStatusEl.textContent = msg;
  userStatusEl.style.color = ok ? '#2ad1ff' : '#f87171';
}

document.addEventListener('DOMContentLoaded', () => {
  token = localStorage.getItem('token');
  const origin = window.location.origin;
  baseUrl = (origin && origin !== 'null') ? origin : (localStorage.getItem('baseUrl') || defaultBaseUrl());
  if (origin && origin !== 'null') {
    localStorage.setItem('baseUrl', origin);
  }
  if (!token) return (window.location = 'login.html');

  const payload = parseJwt(token);
  const roles = Array.isArray(payload?.roles) ? payload.roles : [];

  document.getElementById('baseUrl').value = baseUrl;
  document.getElementById('tokenStatus').textContent =
    `Sesión: ${localStorage.getItem('username') || 'usuario'}`;
  document.getElementById('userLabel').textContent =
    `${localStorage.getItem('username') || '-'}${roles.length ? ' (' + roles.join(', ') + ')' : ''}`;
  applyRoleVisibility(roles);

  filtrarBodegas();
});

function defaultBaseUrl() {
  const origin = window.location.origin;
  if (origin && origin !== 'null') return origin;
  return 'http://localhost:8087';
}

function guardarBaseUrl() {
  baseUrl = document.getElementById('baseUrl').value.trim();
  localStorage.setItem('baseUrl', baseUrl);
}

function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === tab));
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

function limpiarUsuarioForm() {
  const ids = ['userNombre', 'userApellido', 'userEmail', 'userUsername', 'userPassword'];
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const rol = document.getElementById('userRol');
  if (rol) rol.value = 'EMPLEADO';
  setUserStatus('');
}

async function crearUsuario() {
  const nombre = document.getElementById('userNombre')?.value.trim();
  const apellido = document.getElementById('userApellido')?.value.trim();
  const email = document.getElementById('userEmail')?.value.trim();
  const username = document.getElementById('userUsername')?.value.trim();
  const password = document.getElementById('userPassword')?.value;
  const rol = document.getElementById('userRol')?.value || 'EMPLEADO';

  if (!nombre || !apellido || !email || !username || !password) {
    return setUserStatus('Todos los campos son obligatorios');
  }

  try {
    setUserStatus('Creando usuario...', true);
    await fetchJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nombre, apellido, email, username, password, rol })
    });
    setUserStatus('Usuario creado correctamente.', true);
    limpiarUsuarioForm();
  } catch (e) {
    setUserStatus(`Registro falló: ${e.message}`);
  }
}

async function filtrarBodegas() {
  try {
    const data = await fetchJson('/bodegas');
    render(outputs.bodegas, data);
  } catch (e) {
    render(outputs.bodegas, { error: e.message });
  }
}

async function filtrarProductos() {
  try {
    const data = await fetchJson('/productos');
    render(outputs.productos, data);
  } catch (e) {
    render(outputs.productos, { error: e.message });
  }
}

async function filtrarStockBajo() {
  try {
    const data = await fetchJson('/productos/stock-bajo');
    render(outputs.productos, data);
  } catch (e) {
    render(outputs.productos, { error: e.message });
  }
}

async function filtrarMovimientos() {
  const d = document.getElementById('movDesde').value;
  const h = document.getElementById('movHasta').value;
  const params = new URLSearchParams();
  if (d) params.append('desde', new Date(`${d}T00:00:00Z`).toISOString());
  if (h) params.append('hasta', new Date(`${h}T23:59:59Z`).toISOString());
  const query = params.toString() ? `?${params.toString()}` : '';
  try {
    const data = await fetchJson(`/movimientos${query}`);
    render(outputs.mov, data);
  } catch (e) {
    render(outputs.mov, { error: e.message });
  }
}

async function filtrarAuditoria() {
  const u = document.getElementById('audUser').value;
  const a = document.getElementById('audAccion').value;
  const params = new URLSearchParams();
  if (u) params.append('usuarioId', u);
  if (a) params.append('accion', a);
  try {
    const data = await fetchJson(`/auditorias${params.toString() ? '?' + params.toString() : ''}`);
    render(outputs.audit, data);
  } catch (e) {
    render(outputs.audit, { error: e.message });
  }
}
