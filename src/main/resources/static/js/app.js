let token, baseUrl;
const outputs = {
  bodegas: document.getElementById('outBodegas'),
  productos: document.getElementById('outProductos'),
  mov: document.getElementById('outMov'),
  audit: document.getElementById('outAudit')
};

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

document.addEventListener('DOMContentLoaded', () => {
  token = localStorage.getItem('token');
  baseUrl = localStorage.getItem('baseUrl') || 'http://localhost:8080';
  if (!token) return (window.location = 'login.html');

  document.getElementById('baseUrl').value = baseUrl;
  document.getElementById('tokenStatus').textContent =
    `Sesión: ${localStorage.getItem('username') || 'usuario'}`;
  document.getElementById('userLabel').textContent = localStorage.getItem('username') || '-';

  filtrarBodegas();
});

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
  const query = (d || h) ? `?desde=${d || ''}&hasta=${h || ''}` : '';
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
