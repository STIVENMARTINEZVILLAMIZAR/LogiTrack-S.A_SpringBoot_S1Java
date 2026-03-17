const state = {
  token: null,
  baseUrl: null,
  roles: [],
  isAdmin: false,
  bodegaEditId: null,
  productoEditId: null,
  usuarioEditId: null,
  bodegas: [],
  productos: [],
  usuarios: []
};

const outputs = {
  bodegas: document.getElementById('outBodegas'),
  productos: document.getElementById('outProductos'),
  mov: document.getElementById('outMov'),
  audit: document.getElementById('outAudit'),
  usuarios: document.getElementById('outUsuarios')
};

const dashboardEls = {
  bodegas: document.getElementById('statBodegas'),
  productos: document.getElementById('statProductos'),
  stockBajo: document.getElementById('statStockBajo'),
  movimientos: document.getElementById('statMovimientos'),
  resumen: document.getElementById('stockResumen'),
  recientes: document.getElementById('movRecientes')
};

const statusEls = {
  bodega: document.getElementById('bodegaStatus'),
  producto: document.getElementById('productoStatus'),
  usuario: document.getElementById('userStatus')
};

document.addEventListener('DOMContentLoaded', () => {
  state.token = localStorage.getItem('token');
  if (!state.token) return (window.location = 'login.html');

  const origin = window.location.origin;
  const savedBase = localStorage.getItem('baseUrl');
  if (savedBase) {
    state.baseUrl = sanitizeBaseUrl(savedBase);
  } else if (origin && origin !== 'null') {
    state.baseUrl = sanitizeBaseUrl(origin);
    localStorage.setItem('baseUrl', state.baseUrl);
  } else {
    state.baseUrl = sanitizeBaseUrl(defaultBaseUrl());
  }

  const payload = parseJwt(state.token);
  state.roles = Array.isArray(payload?.roles) ? payload.roles : [];
  state.isAdmin = state.roles.includes('ADMIN');

  const baseInput = document.getElementById('baseUrl');
  if (baseInput) baseInput.value = state.baseUrl;

  const username = localStorage.getItem('username') || '-';
  document.getElementById('tokenStatus').textContent = `Sesión: ${username}`;
  document.getElementById('userLabel').textContent = `${username}${state.roles.length ? ' (' + state.roles.join(', ') + ')' : ''}`;

  applyRoleVisibility();
  loadDashboard();
});

function defaultBaseUrl() {
  const origin = window.location.origin;
  if (origin && origin !== 'null') return origin;
  return 'http://localhost:8080';
}

function sanitizeBaseUrl(url) {
  if (!url) return '';
  return url.replace(/\/+$/, '');
}

function guardarBaseUrl() {
  const input = document.getElementById('baseUrl');
  state.baseUrl = sanitizeBaseUrl(input?.value.trim());
  if (state.baseUrl) localStorage.setItem('baseUrl', state.baseUrl);
  if (input && state.baseUrl) input.value = state.baseUrl;
}

function getBaseUrl() {
  const input = document.getElementById('baseUrl');
  const raw = input?.value.trim();
  if (raw) {
    state.baseUrl = sanitizeBaseUrl(raw);
    localStorage.setItem('baseUrl', state.baseUrl);
  }
  if (!state.baseUrl) {
    state.baseUrl = sanitizeBaseUrl(defaultBaseUrl());
  }
  return state.baseUrl;
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

function applyRoleVisibility() {
  const adminOnly = document.querySelectorAll('.admin-only');
  adminOnly.forEach(el => {
    el.style.display = state.isAdmin ? '' : 'none';
  });

  const auditTab = document.querySelector('[data-tab="auditoria"]');
  const usersTab = document.querySelector('[data-tab="usuarios"]');
  const auditSection = document.getElementById('auditoria');
  const usersSection = document.getElementById('usuarios');

  if (!state.isAdmin) {
    if (auditTab) auditTab.style.display = 'none';
    if (usersTab) usersTab.style.display = 'none';
    if (auditSection) auditSection.classList.remove('active');
    if (usersSection) usersSection.classList.remove('active');
    const activeTab = document.querySelector('.nav-item.active')?.dataset?.tab;
    if (activeTab === 'auditoria' || activeTab === 'usuarios') {
      switchTab('dashboard');
    }
  }
}

function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === tab));
  loadTab(tab);
}

function loadTab(tab) {
  if (tab === 'dashboard') return loadDashboard();
  if (tab === 'bodegas') return filtrarBodegas();
  if (tab === 'productos') return filtrarProductos();
  if (tab === 'movimientos') return filtrarMovimientos();
  if (tab === 'auditoria') return filtrarAuditoria();
  if (tab === 'usuarios') return filtrarUsuarios();
}

function logout() {
  localStorage.removeItem('token');
  window.location = 'login.html';
}

async function fetchJson(path, options = {}) {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.token}`,
      ...(options.headers || {})
    }
  });
  const text = await res.text();
  if (res.status === 401 || res.status === 403) return logout();
  if (!res.ok) throw new Error(parseError(text) || `HTTP ${res.status}`);
  return text ? JSON.parse(text) : null;
}

function parseError(text) {
  if (!text) return null;
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

function setStatus(el, msg, ok = false) {
  if (!el) return;
  el.textContent = msg;
  el.style.color = ok ? '#0f766e' : '#dc2626';
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-CO');
}

function summarizeObject(obj) {
  if (!obj || typeof obj !== 'object') return null;
  const parts = [];
  if (obj.nombre) parts.push(obj.nombre);
  if (obj.apellido) parts.push(obj.apellido);
  const fullName = parts.join(' ');
  if (obj.username) return fullName ? `${fullName} (${obj.username})` : obj.username;
  if (fullName) return fullName;
  if (obj.email) return obj.email;
  if (obj.id !== undefined && obj.id !== null) return `#${obj.id}`;
  return null;
}

function summarizeValue(value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'number') return value.toString();
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(trimmed);
        const summary = summarizeValue(parsed);
        if (summary && summary !== '[object Object]') return summary;
      } catch (e) {
        return value;
      }
    }
    return value;
  }
  if (typeof value === 'object') {
    const summary = summarizeObject(value);
    return summary || 'Objeto';
  }
  return String(value);
}

function formatValue(value) {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'object') return summarizeValue(value);
  return String(value);
}

function renderGeneric(el, data) {
  if (!el) return;
  el.textContent = '';
  if (!Array.isArray(data)) {
    const error = document.createElement('div');
    error.className = 'error';
    error.textContent = data?.error || 'No se recibieron datos en formato esperado.';
    el.appendChild(error);
    return;
  }
  if (data.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'muted';
    empty.textContent = 'Sin registros.';
    el.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'data-table';
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  table.appendChild(thead);
  table.appendChild(tbody);

  const columns = Object.keys(data[0]);
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
      const value = item[col];
      const text = summarizeValue(value);
      let fullText = '';
      if (typeof value === 'object' && value !== null) {
        fullText = JSON.stringify(value);
      } else if (typeof value === 'string') {
        fullText = value;
      }
      if (fullText && fullText.length > 0) td.title = fullText;
      if (typeof text === 'string' && text.length > 36) {
        td.classList.add('truncate-text');
      }
      td.textContent = text;
      row.appendChild(td);
    });
    tbody.appendChild(row);
  });

  el.appendChild(table);
}

async function loadDashboard() {
  try {
    const [bodegas, productos, stockBajo, movimientos, resumen] = await Promise.all([
      fetchJson('/bodegas'),
      fetchJson('/productos'),
      fetchJson('/productos/stock-bajo?umbral=10'),
      fetchJson('/movimientos'),
      fetchJson('/movimientos/resumen')
    ]);

    state.bodegas = Array.isArray(bodegas) ? bodegas : [];
    state.productos = Array.isArray(productos) ? productos : [];

    const bodegasActivas = state.bodegas.filter(b => b.activa).length;
    const productosCount = state.productos.length;
    const movimientosCount = Array.isArray(movimientos) ? movimientos.length : 0;
    const stockCount = Array.isArray(stockBajo) ? stockBajo.length : 0;

    if (dashboardEls.bodegas) dashboardEls.bodegas.textContent = bodegasActivas;
    if (dashboardEls.productos) dashboardEls.productos.textContent = productosCount;
    if (dashboardEls.movimientos) dashboardEls.movimientos.textContent = movimientosCount;
    if (dashboardEls.stockBajo) dashboardEls.stockBajo.textContent = stockCount;

    renderResumen(resumen);
    renderMovimientosRecientes(Array.isArray(movimientos) ? movimientos : []);
  } catch (e) {
    if (dashboardEls.bodegas) dashboardEls.bodegas.textContent = '-';
    if (dashboardEls.productos) dashboardEls.productos.textContent = '-';
    if (dashboardEls.movimientos) dashboardEls.movimientos.textContent = '-';
    if (dashboardEls.stockBajo) dashboardEls.stockBajo.textContent = '-';
    renderResumen({});
    renderMovimientosRecientes([]);
  }
}

function renderResumen(resumen) {
  if (!dashboardEls.resumen) return;
  dashboardEls.resumen.textContent = '';
  if (!resumen || Object.keys(resumen).length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Sin datos disponibles.';
    dashboardEls.resumen.appendChild(li);
    return;
  }
  Object.entries(resumen).forEach(([bodega, total]) => {
    const li = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = bodega;
    const strong = document.createElement('strong');
    strong.textContent = Number(total || 0).toFixed(0);
    li.appendChild(span);
    li.appendChild(strong);
    dashboardEls.resumen.appendChild(li);
  });
}

function renderMovimientosRecientes(movs) {
  if (!dashboardEls.recientes) return;
  dashboardEls.recientes.textContent = '';
  if (!movs || movs.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Sin movimientos recientes.';
    dashboardEls.recientes.appendChild(li);
    return;
  }
  movs
    .slice()
    .sort((a, b) => new Date(b.fecha || 0) - new Date(a.fecha || 0))
    .slice(0, 5)
    .forEach(mov => {
      const li = document.createElement('li');
      const span = document.createElement('span');
      span.textContent = `${mov.tipo || 'MOV'} #${mov.id || ''}`.trim();
      const strong = document.createElement('strong');
      strong.textContent = formatDate(mov.fecha);
      li.appendChild(span);
      li.appendChild(strong);
      dashboardEls.recientes.appendChild(li);
    });
}

async function filtrarBodegas() {
  try {
    const data = await fetchJson('/bodegas');
    state.bodegas = Array.isArray(data) ? data : [];
    renderBodegasTable(state.bodegas);
  } catch (e) {
    renderGeneric(outputs.bodegas, { error: e.message });
  }
}

function renderBodegasTable(data) {
  if (!outputs.bodegas) return;
  outputs.bodegas.textContent = '';
  if (!data.length) {
    const empty = document.createElement('div');
    empty.className = 'muted';
    empty.textContent = 'No hay bodegas registradas.';
    outputs.bodegas.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'data-table';
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  table.appendChild(thead);
  table.appendChild(tbody);

  const headers = ['id', 'nombre', 'ubicacion', 'capacidad', 'encargado', 'activa', 'createdAt', 'updatedAt', 'acciones'];
  const headRow = document.createElement('tr');
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  data.forEach(bodega => {
    const row = document.createElement('tr');
    row.appendChild(cell(bodega.id));
    row.appendChild(cell(bodega.nombre));
    row.appendChild(cell(bodega.ubicacion));
    row.appendChild(cell(bodega.capacidad ?? '-'));
    row.appendChild(cell(bodega.encargado ?? '-'));
    row.appendChild(cell(bodega.activa ? 'Sí' : 'No'));
    row.appendChild(cell(formatDate(bodega.createdAt)));
    row.appendChild(cell(formatDate(bodega.updatedAt)));

    const actions = document.createElement('td');
    if (state.isAdmin) {
      const editBtn = makeBtn('Editar', 'btn-mini btn-ghost', () => editarBodega(bodega.id));
      const delBtn = makeBtn('Eliminar', 'btn-mini btn-danger', () => eliminarBodega(bodega.id));
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
    } else {
      actions.textContent = '-';
    }
    row.appendChild(actions);
    tbody.appendChild(row);
  });

  outputs.bodegas.appendChild(table);
}

function limpiarBodega() {
  state.bodegaEditId = null;
  ['bodNombre', 'bodUbicacion', 'bodCapacidad', 'bodEncargado'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const activa = document.getElementById('bodActiva');
  if (activa) activa.value = 'true';
  setStatus(statusEls.bodega, '');
}

async function guardarBodega() {
  const nombre = document.getElementById('bodNombre')?.value.trim();
  const ubicacion = document.getElementById('bodUbicacion')?.value.trim();
  const capacidadRaw = document.getElementById('bodCapacidad')?.value;
  const encargado = document.getElementById('bodEncargado')?.value.trim();
  const activa = document.getElementById('bodActiva')?.value === 'true';

  if (!nombre || !ubicacion) {
    return setStatus(statusEls.bodega, 'Nombre y ubicación son obligatorios');
  }

  const payload = {
    nombre,
    ubicacion,
    capacidad: capacidadRaw ? Number(capacidadRaw) : null,
    encargado: encargado || null,
    activa
  };

  try {
    setStatus(statusEls.bodega, 'Guardando bodega...', true);
    if (state.bodegaEditId) {
      await fetchJson(`/bodegas/${state.bodegaEditId}`, { method: 'PUT', body: JSON.stringify(payload) });
      setStatus(statusEls.bodega, 'Bodega actualizada.', true);
    } else {
      await fetchJson('/bodegas', { method: 'POST', body: JSON.stringify(payload) });
      setStatus(statusEls.bodega, 'Bodega creada.', true);
    }
    limpiarBodega();
    filtrarBodegas();
  } catch (e) {
    setStatus(statusEls.bodega, `Error: ${e.message}`);
  }
}

function editarBodega(id) {
  const bodega = state.bodegas.find(b => b.id === id);
  if (!bodega) return;
  state.bodegaEditId = id;
  document.getElementById('bodNombre').value = bodega.nombre || '';
  document.getElementById('bodUbicacion').value = bodega.ubicacion || '';
  document.getElementById('bodCapacidad').value = bodega.capacidad ?? '';
  document.getElementById('bodEncargado').value = bodega.encargado || '';
  document.getElementById('bodActiva').value = bodega.activa ? 'true' : 'false';
  setStatus(statusEls.bodega, `Editando bodega #${id}`, true);
}

async function eliminarBodega(id) {
  if (!confirm('¿Eliminar esta bodega?')) return;
  try {
    await fetchJson(`/bodegas/${id}`, { method: 'DELETE' });
    setStatus(statusEls.bodega, 'Bodega eliminada.', true);
    filtrarBodegas();
  } catch (e) {
    setStatus(statusEls.bodega, `Error: ${e.message}`);
  }
}

async function filtrarProductos() {
  try {
    const data = await fetchJson('/productos');
    state.productos = Array.isArray(data) ? data : [];
    renderProductosTable(state.productos);
  } catch (e) {
    renderGeneric(outputs.productos, { error: e.message });
  }
}

function renderProductosTable(data) {
  if (!outputs.productos) return;
  outputs.productos.textContent = '';
  if (!data.length) {
    const empty = document.createElement('div');
    empty.className = 'muted';
    empty.textContent = 'No hay productos registrados.';
    outputs.productos.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'data-table';
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  table.appendChild(thead);
  table.appendChild(tbody);

  const headers = ['id', 'nombre', 'categoria', 'stock', 'precio', 'activo', 'createdAt', 'updatedAt', 'acciones'];
  const headRow = document.createElement('tr');
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  data.forEach(prod => {
    const row = document.createElement('tr');
    row.appendChild(cell(prod.id));
    row.appendChild(cell(prod.nombre));
    row.appendChild(cell(prod.categoria));
    row.appendChild(cell(prod.stock));
    row.appendChild(cell(prod.precio));
    row.appendChild(cell(prod.activo ? 'Sí' : 'No'));
    row.appendChild(cell(formatDate(prod.createdAt)));
    row.appendChild(cell(formatDate(prod.updatedAt)));

    const actions = document.createElement('td');
    if (state.isAdmin) {
      const editBtn = makeBtn('Editar', 'btn-mini btn-ghost', () => editarProducto(prod.id));
      const delBtn = makeBtn('Eliminar', 'btn-mini btn-danger', () => eliminarProducto(prod.id));
      actions.appendChild(editBtn);
      actions.appendChild(delBtn);
    } else {
      actions.textContent = '-';
    }
    row.appendChild(actions);
    tbody.appendChild(row);
  });

  outputs.productos.appendChild(table);
}

function limpiarProducto() {
  state.productoEditId = null;
  ['prodNombre', 'prodCategoria', 'prodStock', 'prodPrecio'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const activo = document.getElementById('prodActivo');
  if (activo) activo.value = 'true';
  setStatus(statusEls.producto, '');
}

async function guardarProducto() {
  const nombre = document.getElementById('prodNombre')?.value.trim();
  const categoria = document.getElementById('prodCategoria')?.value.trim();
  const stockRaw = document.getElementById('prodStock')?.value;
  const precioRaw = document.getElementById('prodPrecio')?.value;
  const activo = document.getElementById('prodActivo')?.value === 'true';

  if (!nombre || !categoria || !precioRaw) {
    return setStatus(statusEls.producto, 'Nombre, categoría y precio son obligatorios');
  }

  const payload = {
    nombre,
    categoria,
    stock: stockRaw ? Number(stockRaw) : 0,
    precio: Number(precioRaw),
    activo
  };

  try {
    setStatus(statusEls.producto, 'Guardando producto...', true);
    if (state.productoEditId) {
      await fetchJson(`/productos/${state.productoEditId}`, { method: 'PUT', body: JSON.stringify(payload) });
      setStatus(statusEls.producto, 'Producto actualizado.', true);
    } else {
      await fetchJson('/productos', { method: 'POST', body: JSON.stringify(payload) });
      setStatus(statusEls.producto, 'Producto creado.', true);
    }
    limpiarProducto();
    filtrarProductos();
  } catch (e) {
    setStatus(statusEls.producto, `Error: ${e.message}`);
  }
}

function editarProducto(id) {
  const prod = state.productos.find(p => p.id === id);
  if (!prod) return;
  state.productoEditId = id;
  document.getElementById('prodNombre').value = prod.nombre || '';
  document.getElementById('prodCategoria').value = prod.categoria || '';
  document.getElementById('prodStock').value = prod.stock ?? 0;
  document.getElementById('prodPrecio').value = prod.precio ?? 0;
  document.getElementById('prodActivo').value = prod.activo ? 'true' : 'false';
  setStatus(statusEls.producto, `Editando producto #${id}`, true);
}

async function eliminarProducto(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  try {
    await fetchJson(`/productos/${id}`, { method: 'DELETE' });
    setStatus(statusEls.producto, 'Producto eliminado.', true);
    filtrarProductos();
  } catch (e) {
    setStatus(statusEls.producto, `Error: ${e.message}`);
  }
}

async function filtrarStockBajo() {
  try {
    const data = await fetchJson('/productos/stock-bajo?umbral=10');
    state.productos = Array.isArray(data) ? data : [];
    renderProductosTable(state.productos);
    setStatus(statusEls.producto, 'Mostrando productos con stock bajo.', true);
  } catch (e) {
    setStatus(statusEls.producto, `Error: ${e.message}`);
  }
}

async function filtrarMovimientos() {
  const desde = document.getElementById('movDesde').value;
  const hasta = document.getElementById('movHasta').value;
  const params = new URLSearchParams();
  if (desde) params.append('desde', new Date(`${desde}T00:00:00Z`).toISOString());
  if (hasta) params.append('hasta', new Date(`${hasta}T23:59:59Z`).toISOString());
  const query = params.toString() ? `?${params.toString()}` : '';
  try {
    const data = await fetchJson(`/movimientos${query}`);
    renderGeneric(outputs.mov, data);
  } catch (e) {
    renderGeneric(outputs.mov, { error: e.message });
  }
}

async function filtrarAuditoria() {
  const usuarioId = document.getElementById('audUser').value;
  const accion = document.getElementById('audAccion').value;
  const params = new URLSearchParams();
  if (usuarioId) params.append('usuarioId', usuarioId);
  if (accion) params.append('accion', accion);
  try {
    const data = await fetchJson(`/auditorias${params.toString() ? '?' + params.toString() : ''}`);
    renderGeneric(outputs.audit, data);
  } catch (e) {
    renderGeneric(outputs.audit, { error: e.message });
  }
}

async function filtrarUsuarios() {
  try {
    const data = await fetchJson('/usuarios');
    state.usuarios = Array.isArray(data) ? data : [];
    renderUsuariosTable(state.usuarios);
  } catch (e) {
    renderGeneric(outputs.usuarios, { error: e.message });
  }
}

function renderUsuariosTable(data) {
  if (!outputs.usuarios) return;
  outputs.usuarios.textContent = '';
  if (!data.length) {
    const empty = document.createElement('div');
    empty.className = 'muted';
    empty.textContent = 'No hay usuarios registrados.';
    outputs.usuarios.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'data-table';
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  table.appendChild(thead);
  table.appendChild(tbody);

  const headers = ['id', 'nombre', 'apellido', 'usuario', 'email', 'estado', 'roles', 'acciones'];
  const headRow = document.createElement('tr');
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);

  data.forEach(user => {
    const row = document.createElement('tr');
    row.appendChild(cell(user.id));
    row.appendChild(cell(user.nombre));
    row.appendChild(cell(user.apellido));
    row.appendChild(cell(user.username));
    row.appendChild(cell(user.email));
    row.appendChild(cell(user.habilitado ? 'Activo' : 'Inactivo'));
    row.appendChild(cell((user.roles || []).join(', ') || '-'));

    const actions = document.createElement('td');
    const editBtn = makeBtn('Editar', 'btn-mini btn-ghost', () => editarUsuario(user.id));
    const delBtn = makeBtn('Eliminar', 'btn-mini btn-danger', () => eliminarUsuario(user.id));
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    row.appendChild(actions);
    tbody.appendChild(row);
  });

  outputs.usuarios.appendChild(table);
}

function limpiarUsuarioForm() {
  state.usuarioEditId = null;
  ['userNombre', 'userApellido', 'userEmail', 'userUsername', 'userPassword'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const rol = document.getElementById('userRol');
  if (rol) rol.value = 'EMPLEADO';
  const estado = document.getElementById('userEstado');
  if (estado) estado.value = 'true';
  setStatus(statusEls.usuario, '');
}

async function guardarUsuario() {
  const nombre = document.getElementById('userNombre')?.value.trim();
  const apellido = document.getElementById('userApellido')?.value.trim();
  const email = document.getElementById('userEmail')?.value.trim();
  const username = document.getElementById('userUsername')?.value.trim();
  const password = document.getElementById('userPassword')?.value;
  const rol = document.getElementById('userRol')?.value || 'EMPLEADO';
  const habilitado = document.getElementById('userEstado')?.value === 'true';

  if (!nombre || !apellido || !email || !username) {
    return setStatus(statusEls.usuario, 'Todos los campos son obligatorios');
  }
  if (!state.usuarioEditId && !password) {
    return setStatus(statusEls.usuario, 'La contraseña es obligatoria');
  }

  const payload = {
    nombre,
    apellido,
    email,
    username,
    rol,
    habilitado
  };
  if (password) payload.password = password;

  try {
    setStatus(statusEls.usuario, 'Guardando usuario...', true);
    if (state.usuarioEditId) {
      await fetchJson(`/usuarios/${state.usuarioEditId}`, { method: 'PUT', body: JSON.stringify(payload) });
      setStatus(statusEls.usuario, 'Usuario actualizado.', true);
    } else {
      await fetchJson('/usuarios', { method: 'POST', body: JSON.stringify(payload) });
      setStatus(statusEls.usuario, 'Usuario creado.', true);
    }
    limpiarUsuarioForm();
    filtrarUsuarios();
  } catch (e) {
    setStatus(statusEls.usuario, `Error: ${e.message}`);
  }
}

function editarUsuario(id) {
  const user = state.usuarios.find(u => u.id === id);
  if (!user) return;
  state.usuarioEditId = id;
  document.getElementById('userNombre').value = user.nombre || '';
  document.getElementById('userApellido').value = user.apellido || '';
  document.getElementById('userEmail').value = user.email || '';
  document.getElementById('userUsername').value = user.username || '';
  document.getElementById('userPassword').value = '';
  const rol = document.getElementById('userRol');
  if (rol) rol.value = (user.roles && user.roles.includes('ADMIN')) ? 'ADMIN' : 'EMPLEADO';
  const estado = document.getElementById('userEstado');
  if (estado) estado.value = user.habilitado ? 'true' : 'false';
  setStatus(statusEls.usuario, `Editando usuario #${id}`, true);
}

async function eliminarUsuario(id) {
  if (!confirm('¿Eliminar este usuario?')) return;
  try {
    await fetchJson(`/usuarios/${id}`, { method: 'DELETE' });
    setStatus(statusEls.usuario, 'Usuario eliminado.', true);
    filtrarUsuarios();
  } catch (e) {
    setStatus(statusEls.usuario, `Error: ${e.message}`);
  }
}

function cell(value) {
  const td = document.createElement('td');
  td.textContent = formatValue(value);
  return td;
}

function makeBtn(label, className, handler) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = className;
  btn.textContent = label;
  btn.addEventListener('click', handler);
  return btn;
}
