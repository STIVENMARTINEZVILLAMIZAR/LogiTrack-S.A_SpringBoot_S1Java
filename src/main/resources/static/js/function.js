let token = null;
const outputs = {
  bodegas: document.getElementById('bodegasOut'),
  productos: document.getElementById('productosOut'),
  movimientos: document.getElementById('movOut'),
  auditoria: document.getElementById('audOut'),
};

function switchTab(ev, id) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  ev.target.classList.add('active');
  document.querySelectorAll('.tab-panel').forEach(p => p.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

async function login() {
  const base = document.getElementById('baseUrl').value.trim();
  const body = { username: document.getElementById('user').value, password: document.getElementById('pass').value };
  const res = await fetch(base + '/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) { alert('Login fallo: ' + JSON.stringify(data)); return; }
  token = data.token;
  const pill = document.getElementById('tokenStatus');
  pill.textContent = 'Token activo';
  pill.style.background = 'rgba(34,211,238,0.15)';
  pill.style.color = '#22d3ee';
}

async function register() {
  const base = document.getElementById('baseUrl').value.trim();
  const uname = prompt('username nuevo:'); if (!uname) return;
  const email = prompt('email:'); if (!email) return;
  const pass = prompt('password:'); if (!pass) return;
  const body = { nombre: 'Nuevo', apellido: 'Usuario', username: uname, email, password: pass };
  const res = await fetch(base + '/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const data = await res.json();
  alert(res.ok ? 'Registrado, token emitido' : 'Error: ' + JSON.stringify(data));
}

async function fetchJson(path) {
  const base = document.getElementById('baseUrl').value.trim();
  const res = await fetch(base + path, { headers: token ? { 'Authorization': 'Bearer ' + token } : {} });
  const out = outputs[getCurrentTab()];
  try { const data = await res.json(); out.textContent = JSON.stringify(data, null, 2); }
  catch (e) { out.textContent = 'Respuesta no JSON: ' + (await res.text()); }
}

function getCurrentTab() { return document.querySelector('.tab-btn.active').dataset.tab; }

function filtrarMov() {
  const tipo = document.getElementById('movTipo').value;
  const d = document.getElementById('movDesde').value;
  const h = document.getElementById('movHasta').value;
  const params = new URLSearchParams();
  if (tipo) params.append('tipo', tipo);
  if (d) params.append('desde', d);
  if (h) params.append('hasta', h);
  fetchJson('/movimientos' + (params.toString() ? '?' + params.toString() : ''));
}

function filtrarAud() {
  const u = document.getElementById('audUser').value;
  const a = document.getElementById('audAccion').value;
  const params = new URLSearchParams();
  if (u) params.append('usuarioId', u);
  if (a) params.append('accion', a);
  fetchJson('/auditorias' + (params.toString() ? '?' + params.toString() : ''));
}
