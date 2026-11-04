// app.js — la página del Secretario.
import * as N from './nucleo.js?v=2';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ls = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
  json(k, d = null) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
};
const REPO_DEF = 'falsofacu/Secretario-datos';

// ───────────────────────── íconos ─────────────────────────
const I = {
  sol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  luna: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>',
  ajustes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
  refrescar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  mas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  puntos: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
  pausa: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></svg>',
  reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 5v5h5"/></svg>',
  saltar: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5.5v13l9-6.5z"/><rect x="16" y="5" width="2.5" height="14" rx="1"/></svg>',
  ola: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 9c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2"/></svg>',
  basura: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
};

// ───────────────────────── GitHub ─────────────────────────
const b64enc = (s) => {
  const b = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(bin);
};
const b64dec = (s) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, '')), (c) => c.charCodeAt(0)));

// ?local en localhost: lee ../datos/ del disco y no escribe nada (para probar).
const LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && new URLSearchParams(location.search).has('local');

const GH = {
  get repo() { return ls.get('sec.repo', REPO_DEF); },
  get token() { return LOCAL ? 'local' : ls.get('sec.token'); },
  async req(path, opts = {}) {
    if (LOCAL) {
      if (opts.method === 'PUT') return new Response(JSON.stringify({ content: { sha: `local${Date.now()}` } }), { status: 200 });
      const r = await fetch(`../${path.split('?')[0]}?t=${Date.now()}`);
      if (!r.ok) return new Response('', { status: 404 });
      const txt = await r.text();
      return new Response(JSON.stringify({ content: b64enc(txt), sha: 'local' }), { status: 200 });
    }
    return fetch(`https://api.github.com/repos/${this.repo}/contents/${path}`, {
      ...opts,
      cache: 'no-store',
      headers: { Authorization: `Bearer ${this.token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...(opts.headers || {}) },
    });
  },
  async leer(path) {
    const r = await this.req(`${path}?t=${Date.now()}`);
    if (r.status === 404) return { data: null, sha: null };
    if (r.status === 401 || r.status === 403) { const e = new Error('La llave no sirve o no tiene permiso'); e.auth = true; throw e; }
    if (!r.ok) throw new Error(`GitHub respondió ${r.status}`);
    const j = await r.json();
    return { data: JSON.parse(b64dec(j.content)), sha: j.sha };
  },
  async escribir(path, data, sha, msg) {
    const r = await this.req(path, { method: 'PUT', body: JSON.stringify({ message: msg, content: b64enc(JSON.stringify(data, null, 2) + '\n'), ...(sha ? { sha } : {}) }) });
    if (r.status === 409 || r.status === 422) { const e = new Error('conflicto'); e.conflicto = true; throw e; }
    if (!r.ok) throw new Error(`GitHub respondió ${r.status}`);
    return (await r.json()).content.sha;
  },
};

// ───────────────────────── estado de la app ─────────────────────────
const S = {
  estado: null, sha: null, cal: null, briefing: null, corrida: null,
  sucio: false, guardando: false, otraVez: false, error: null, sinConexion: false,
  tab: ls.get('sec.tab', 'hoy'), fechas: ls.json('sec.fechas', {}), A: null,
};

function cachear() {
  ls.set('sec.cache', JSON.stringify({ estado: S.estado, sha: S.sha, cal: S.cal, briefing: S.briefing, corrida: S.corrida, sucio: S.sucio }));
}

async function cargar(primera = false) {
  try {
    const [e, c, b, k] = await Promise.all([
      GH.leer('datos/estado.json'), GH.leer('datos/calendario.json').catch(() => ({})),
      GH.leer('datos/briefing.json').catch(() => ({})), GH.leer('datos/corrida.json').catch(() => ({})),
    ]);
    if (!e.data) throw new Error('No encontré datos/estado.json en el repo');
    if (S.sucio && S.estado) { S.estado = N.fusionar(S.estado, e.data); S.sha = e.sha; programarGuardado(0); }
    else { S.estado = N.asegurarEstado(e.data); S.sha = e.sha; }
    if (!S.calVivo) S.cal = c.data || S.cal;
    S.briefing = b.data || null;
    S.corrida = k.data || null;
    S.error = null; S.sinConexion = false;
    cachear();
    render();
    if (primera) { calendarioEnVivo(); fechasClientes(); }
  } catch (err) {
    if (err.auth) { ls.del('sec.token'); return vistaLogin(err.message); }
    S.sinConexion = true; S.error = err.message;
    if (S.estado) render(); else vistaLogin(`No pude cargar: ${err.message}`);
  }
}

let tGuardar = null;
function programarGuardado(ms = 700) {
  clearTimeout(tGuardar);
  tGuardar = setTimeout(guardar, ms);
}
async function guardar(intento = 0) {
  if (!S.sucio) return;
  if (S.guardando) { S.otraVez = true; return; }
  S.guardando = true; pintarSync();
  const enviado = JSON.stringify(S.estado);
  try {
    S.sha = await GH.escribir('datos/estado.json', S.estado, S.sha, 'Página: actualización');
    if (JSON.stringify(S.estado) === enviado) S.sucio = false;
    S.sinConexion = false; S.error = null;
  } catch (err) {
    if (err.conflicto && intento < 3) {
      try {
        const r = await GH.leer('datos/estado.json');
        S.estado = N.fusionar(S.estado, r.data); S.sha = r.sha;
        S.guardando = false;
        return guardar(intento + 1);
      } catch {}
    }
    S.sinConexion = true; S.error = err.message;
    setTimeout(() => guardar(), 30000);
  } finally {
    S.guardando = false; cachear(); pintarSync();
    if (S.otraVez) { S.otraVez = false; programarGuardado(200); }
  }
}

const ahoraMs = () => Date.now();
function mutar(fn, aviso) {
  fn(S.estado);
  S.sucio = true;
  cachear(); render(); programarGuardado();
  if (aviso) toast(aviso);
}

// ───────────────────────── calendario en vivo (Apps Script) ─────────────────────────
async function calendarioEnVivo() {
  const cfg = S.estado?.config?.calendario;
  if (!cfg?.url || !cfg?.clave) return;
  try {
    const hoy = new Date();
    const u = new URL(cfg.url);
    u.searchParams.set('clave', cfg.clave);
    u.searchParams.set('accion', 'eventos');
    u.searchParams.set('desde', N.diaStr(N.sumarDias(hoy, -14)));
    u.searchParams.set('hasta', N.diaStr(N.sumarDias(hoy, 120)));
    const r = await fetch(u);
    const j = await r.json();
    if (j.eventos) { S.cal = { actualizado: new Date().toISOString(), fuente: 'en vivo', eventos: j.eventos }; S.calVivo = true; cachear(); render(); }
  } catch (e) { console.warn('calendario en vivo', e); }
}
async function postCalendario(body) {
  const cfg = S.estado?.config?.calendario;
  if (!cfg?.url || !cfg?.clave) return null;
  const u = new URL(cfg.url);
  u.searchParams.set('clave', cfg.clave);
  u.searchParams.set('accion', 'sync');
  const r = await fetch(u, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain;charset=utf-8' } });
  return r.json();
}

async function fechasClientes() {
  for (const a of S.estado.areas.filter((a) => a.fechasUrl)) {
    try {
      const r = await fetch(`${a.fechasUrl}?t=${Date.now()}`);
      const lista = await r.json();
      S.fechas[a.id] = (Array.isArray(lista) ? lista : []).filter((f) => f.visible !== false);
    } catch {}
  }
  ls.set('sec.fechas', JSON.stringify(S.fechas));
  render();
}

// ───────────────────────── formato ─────────────────────────
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaLarga = (d) => `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
const fechaCorta = (s) => { const d = N.parseDia(s); return `${DIAS[d.getDay()].slice(0, 3)} ${d.getDate()}/${d.getMonth() + 1}`; };
function vence(s) {
  const n = N.diasEntre(new Date(), N.parseDia(s));
  if (n < -1) return { txt: `venció hace ${-n} días`, cls: 'rojo' };
  if (n === -1) return { txt: 'venció ayer', cls: 'rojo' };
  if (n === 0) return { txt: 'hoy', cls: 'ambar' };
  if (n === 1) return { txt: 'mañana', cls: 'ambar' };
  if (n < 7) return { txt: fechaCorta(s), cls: '' };
  return { txt: fechaCorta(s), cls: '' };
}
const area = (id) => S.estado.areas.find((a) => a.id === id) || { id, nombre: 'Otro', corto: 'Otro', color: 'var(--acento)' };
const nivelHtml = (n, chico = false) => `<span class="nivel n-${n} ${chico ? 'chico' : ''}">${N.NIVELES[n].nombre}</span>`;
const pct = (x) => Math.round(Math.max(0, Math.min(1, x)) * 100);
const nombrePieza = (p) => `${p.cuota.nombre}${N.cantidadEn(p.cuota, p.lunes) > 1 ? ` ${p.n}` : ''}${p.titulo ? ` · ${p.titulo}` : ''}`;
const semNum = (id) => id.split('-W')[1];

function saludo(d) {
  const h = d.getHours();
  return h < 6 ? 'Buenas noches' : h < 13 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
}
const FRASES = {
  adelantado: ['Vas con viento a favor.', 'Estás adelantado. Disfrutá el margen.', 'Ritmo bárbaro, seguí así.'],
  al_dia: ['Vas bien. Un paso a la vez.', 'Todo en orden. Tranqui.', 'Al día y sin apuro.'],
  en_riesgo: ['Se puede. Priorizá lo que vence primero.', 'Un empujoncito hoy y llegás.', 'Foco en lo importante, el resto espera.'],
  atrasado: ['Respirá. Ordenemos y vamos de a una.', 'Hoy no es para todo, es para lo urgente.', 'Hablar con un cliente a tiempo también es trabajar.'],
  libre: ['Semana despejada. Buen momento para Turrákata.', 'Nada urgente. Elegí algo que te guste.'],
};
const frase = (n) => { const l = FRASES[n] || FRASES.al_dia; return l[new Date().getDate() % l.length]; };
const CELEBRA = ['¡Bien ahí!', 'Una menos.', 'Así se hace.', 'Vas bárbaro.', 'Excelente.', 'Eso.'];

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  $('#toasts').append(t);
  setTimeout(() => t.remove(), 2800);
}

// ───────────────────────── render ─────────────────────────
function render() {
  if (!S.estado) return;
  S.A = N.analizar(S.estado, S.cal, new Date());
  const A = S.A;
  const app = $('#app');
  const scroll = window.scrollY;
  app.innerHTML = `
    ${renderTop(A)}
    ${renderHero(A)}
    ${renderTabs(A)}
    <main id="vista">${renderVista(A)}</main>
    ${renderPie()}
  `;
  window.scrollTo(0, scroll);
  pintarReloj();
}

function renderTop(A) {
  const tema = ls.get('sec.tema', 'auto');
  const icTema = tema === 'claro' ? I.sol : tema === 'oscuro' ? I.luna : I.auto;
  const show = A.showHoy[0];
  let sub = `Hoy es <b>${fechaLarga(A.ahora)}</b>.`;
  if (A.vidaHoy.length) sub += ` ${esc(A.vidaHoy[0].titulo)}.`;
  else if (show) sub += ` Esta noche tenés <b>show</b>${show.hora ? ` a las ${show.hora}` : ''}.`;
  else sub += ` ${frase(A.semana.nivel)}`;
  return `<header class="top">
    <div><h1>${saludo(A.ahora)}, Facu</h1><p class="sub">${sub}</p></div>
    <div class="acciones">
      <button class="icono" data-a="actualizar" title="Actualizar ahora">${I.refrescar}</button>
      <button class="icono" data-a="tema" title="Tema: ${tema}">${icTema}</button>
      <button class="icono" data-a="ajustes" title="Ajustes">${I.ajustes}</button>
    </div>
  </header>`;
}

function anillo(valor, color, tam = 168, grosor = 12) {
  const r = (tam - grosor) / 2, c = 2 * Math.PI * r;
  return `<svg width="${tam}" height="${tam}" viewBox="0 0 ${tam} ${tam}">
    <defs><linearGradient id="g-${tam}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--acento)"/><stop offset="1" stop-color="${color}"/></linearGradient></defs>
    <circle class="pista" cx="${tam / 2}" cy="${tam / 2}" r="${r}" fill="none" stroke-width="${grosor}"/>
    <circle class="prog" cx="${tam / 2}" cy="${tam / 2}" r="${r}" fill="none" stroke="url(#g-${tam})" stroke-width="${grosor}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.max(0.001, valor))}"/>
  </svg>`;
}

function renderHero(A) {
  const s = A.semana;
  const color = `var(--n-${s.nivel})`;
  return `<section class="hero">
    <div class="card reloj" id="reloj">${htmlReloj()}</div>
    <div class="card medidor">
      <div class="anillo" id="anillo-semana">
        ${anillo(s.pct, color)}
        <div class="centro"><div class="pct">${pct(s.pct)}<small>%</small></div><div class="lbl">DE LA SEMANA</div></div>
      </div>
      <div class="info">
        ${nivelHtml(s.nivel)}
        <p class="mensaje">${esc(s.mensaje)}</p>
        <div class="minis">
          <div class="mini-stat"><b>${pct(A.pctHoy)}%</b><span>de hoy</span></div>
          <div class="mini-stat"><b>${N.fh(s.necesarias)}</b><span>de trabajo pendiente</span></div>
          <div class="mini-stat"><b>${N.fh(s.cap8)}</b><span>disponibles</span></div>
        </div>
        ${A.bloqueadas.length ? `<span class="tenue">${A.bloqueadas.length} esperando material (no cuentan en contra).</span>` : ''}
      </div>
    </div>
  </section>`;
}

const TABS_FIJAS = [
  { id: 'hoy', nombre: 'Hoy' },
  { id: '*areas' },
  { id: 'metas', nombre: 'Metas' },
  { id: 'vida', nombre: 'Vida' },
];
function renderTabs(A) {
  const out = [];
  for (const t of TABS_FIJAS) {
    if (t.id === '*areas') {
      for (const a of A.areas) {
        const pa = A.porArea[a.id];
        const n = pa?.pendientes || 0;
        out.push(`<button class="tab ${S.tab === a.id ? 'on' : ''}" style="--c:${a.color}" data-a="tab" data-id="${a.id}"><span class="dot"></span>${esc(a.nombre)}${n ? `<span class="num">${n}</span>` : ''}</button>`);
      }
    } else out.push(`<button class="tab ${S.tab === t.id ? 'on' : ''}" data-a="tab" data-id="${t.id}">${t.nombre}</button>`);
  }
  out.push(`<button class="tab plata ${S.tab === 'plata' ? 'on' : ''}" data-a="tab" data-id="plata">Plata</button>`);
  return `<nav class="tabs" aria-label="Secciones">${out.join('')}</nav>`;
}

function renderVista(A) {
  if (S.tab === 'hoy') return vistaHoy(A);
  if (S.tab === 'metas') return vistaMetas(A);
  if (S.tab === 'vida') return vistaVida(A);
  if (S.tab === 'plata') return vistaPlata(A);
  const a = A.areas.find((x) => x.id === S.tab);
  if (a) return vistaArea(A, a);
  S.tab = 'hoy';
  return vistaHoy(A);
}

function renderPie() {
  const k = S.corrida;
  let txt = 'La actualización automática todavía no corrió.';
  if (k?.fecha) {
    const hoy = N.diaStr(new Date());
    txt = `Última actualización automática: ${k.fecha === hoy ? 'hoy' : fechaCorta(k.fecha)} a las ${k.hora}${k.ok ? '' : ' (con errores)'}.`;
  }
  const estado = S.sinConexion ? `<span class="sync error"></span>Sin conexión, guardo cuando vuelva` : S.sucio || S.guardando ? `<span class="sync guardando"></span>Guardando…` : `<span class="sync"></span>Todo guardado`;
  return `<footer class="pie-pag"><div id="sync-txt">${estado}</div><div>${txt}</div></footer>`;
}
function pintarSync() {
  const el = $('#sync-txt');
  if (!el) return;
  el.innerHTML = S.sinConexion ? `<span class="sync error"></span>Sin conexión, guardo cuando vuelva` : S.sucio || S.guardando ? `<span class="sync guardando"></span>Guardando…` : `<span class="sync"></span>Todo guardado`;
}

// ───────────────────────── filas reutilizables ─────────────────────────
function filaPieza(p, opts = {}) {
  const sig = N.siguienteEtapa(p);
  const etq = p.etapa === 'material' && p.cuota.material ? p.cuota.material : N.NOMBRE_ETAPA[p.etapa];
  const sigEtq = sig === 'material' && p.cuota.material ? p.cuota.material : N.NOMBRE_ETAPA[sig];
  const chips = [];
  chips.push(`<span>${esc(etq)}</span>`);
  if (opts.horas != null && opts.horas > 0.01) chips.push(`<span>${N.fh(opts.horas)}</span>`);
  if (p.atrasada && p.etapa !== 'entregado') chips.push(`<span class="chip rojo">de la semana ${semNum(p.semana)}</span>`);
  if (p.bloqueado) chips.push(`<span class="chip ambar">esperando material</span>`);
  const hecha = p.etapa === 'entregado';
  return `<div class="fila ${hecha ? 'hecha' : ''} ${opts.extra ? 'extra' : ''}">
    <button class="chk ${hecha ? 'on' : ''}" data-a="entregar" data-id="${esc(p.id)}" title="${hecha ? 'Entregado' : 'Marcar entregado'}">${hecha ? I.check : ''}</button>
    <div class="txt"><b>${esc(nombrePieza(p))}</b><div class="meta">${chips.join('')}</div></div>
    ${!hecha && !p.bloqueado ? `<button class="etapa-btn" data-a="avanzar" data-id="${esc(p.id)}">→ ${esc(sigEtq)}</button>` : ''}
    <button class="mini" data-a="pieza" data-id="${esc(p.id)}" title="Más">${I.puntos}</button>
  </div>`;
}

function filaTarea(t, opts = {}) {
  const chips = [];
  if (t.fecha) { const v = vence(t.fecha); chips.push(`<span class="chip ${t.hecha ? '' : v.cls}">${v.txt}</span>`); }
  const h = N.horasTarea(S.estado, t);
  if (!t.hecha) chips.push(`<span>${N.fh(opts.horas ?? h * (1 - N.progresoTarea(t)))}</span>`);
  if (opts.metaHoy) chips.push(`<span class="chip verde">hoy: ${opts.metaHoy}</span>`);
  if (t.notas) chips.push(`<span>${esc(t.notas.slice(0, 60))}</span>`);
  let contador = '';
  if (t.total && !t.hecha) {
    contador = `<div class="contador"><div class="barra"><i style="width:${pct((t.actual || 0) / t.total)}%"></i></div>
      <span class="tenue">${t.actual || 0}/${t.total}</span>
      <button data-a="sumar" data-id="${esc(t.id)}" data-n="1">+1</button>
      <button data-a="sumar" data-id="${esc(t.id)}" data-n="10">+10</button>
      <button data-a="sumar" data-id="${esc(t.id)}" data-n="?">…</button></div>`;
  }
  return `<div class="fila ${t.hecha ? 'hecha' : ''} ${opts.extra ? 'extra' : ''}">
    <button class="chk ${t.hecha ? 'on' : ''}" data-a="hecha" data-id="${esc(t.id)}">${t.hecha ? I.check : ''}</button>
    <div class="txt"><b>${esc(t.titulo)}</b><div class="meta">${chips.join('')}</div>${contador}</div>
    <button class="mini" data-a="editar-tarea" data-id="${esc(t.id)}" title="Editar">${I.puntos}</button>
  </div>`;
}

function filaPlan(it) {
  return it.tipo === 'pieza' ? filaPieza(it.ref, { horas: it.horas, extra: it.extra }) : filaTarea(it.ref, { horas: it.horas, extra: it.extra, metaHoy: it.metaHoy });
}

function agruparPorArea(items) {
  const m = new Map();
  for (const it of items) {
    if (!m.has(it.area)) m.set(it.area, []);
    m.get(it.area).push(it);
  }
  return [...m.entries()].map(([id, l]) => `<div class="grupo" style="--c:${area(id).color}">
    <div class="grupo-tit"><b>${esc(area(id).nombre)}</b><span class="tenue">${N.fh(l.reduce((s, x) => s + x.horas, 0))}</span></div>
    ${l.map(filaPlan).join('')}</div>`).join('');
}

function agenda(dias) {
  const filas = [];
  for (const [tit, evs] of dias) {
    if (!evs.length) continue;
    filas.push(`<div class="dia-tit">${tit}</div>`);
    for (const e of evs) {
      const h = e.todoElDia ? 'todo el día' : `${N.pad(e.ini.getHours())}:${N.pad(e.ini.getMinutes())}`;
      const a = e.area ? area(e.area) : null;
      const tipo = { show: '🎤 ', grabacion: '🎥 ', feriado: '🏖️ ', cumple: '🎂 ' }[e.tipo] || '';
      filas.push(`<div class="ev"><span class="h">${h}</span><span class="t">${tipo}${esc(e.titulo)}${a ? ` <span class="chip" style="color:${a.color}">${esc(a.corto)}</span>` : ''}</span></div>`);
    }
  }
  return filas.length ? `<div class="agenda">${filas.join('')}</div>` : '<div class="vacio">Nada en el calendario.</div>';
}

// ───────────────────────── vista: Hoy ─────────────────────────
function vistaHoy(A) {
  const partes = [];
  for (const v of A.vidaHoy) partes.push(`<div class="banner" style="--c:var(--n-al_dia)"><span class="emoji">${emojiVida(v.tipo)}</span><div><b>${esc(v.titulo)}</b><span>${v.capacidad ? `Hoy trabajás al ${pct(v.capacidad)}%.` : 'Hoy no se trabaja. Disfrutá.'}</span></div></div>`);
  for (const s of A.showHoy) {
    const items = prepItems(s);
    const hechos = items.filter((i) => i.hecho).length;
    partes.push(`<div class="banner" style="--c:${area('standup').color}"><span class="emoji">🎤</span><div style="flex:1"><b>Esta noche: ${esc(s.titulo)}</b><span>${[s.hora, s.lugar].filter(Boolean).map(esc).join(' · ') || 'Revisá horario y lugar'} · prep ${hechos}/${items.length}</span></div><button class="btn chico" data-a="tab" data-id="standup">Ver</button></div>`);
  }

  const plan = A.plan.filter((p) => !p.extra);
  const extras = A.plan.filter((p) => p.extra);
  const b = S.briefing && S.briefing.fecha === A.hoyS ? S.briefing : null;

  const alertas = [];
  if (A.atrasadas.length) alertas.push(`<div class="fila"><span class="chip rojo">${A.atrasadas.length}</span><div class="txt">piezas arrastradas de semanas anteriores</div></div>`);
  if (A.vencidas.length) alertas.push(`<div class="fila"><span class="chip rojo">${A.vencidas.length}</span><div class="txt">tareas vencidas</div></div>`);
  for (const p of A.bloqueadas) alertas.push(`<div class="fila"><span class="chip ambar">espera</span><div class="txt">${esc(area(p.area).corto)} · ${esc(nombrePieza(p))} <span class="tenue">sin material</span></div></div>`);
  for (const v of A.vidaProxima) alertas.push(`<div class="fila"><span class="chip">${N.diasEntre(A.ahora, N.parseDia(v.desde))} días</span><div class="txt">${emojiVida(v.tipo)} ${esc(v.titulo)} <span class="tenue">desde el ${fechaCorta(v.desde)}</span></div></div>`);
  for (const w of A.pronostico.filter((w) => w.nivel === 'en_riesgo' || w.nivel === 'atrasado').slice(0, 3))
    alertas.push(`<div class="fila"><span class="chip ${w.nivel === 'atrasado' ? 'rojo' : 'ambar'}">sem ${semNum(w.semana)}</span><div class="txt">La semana del ${fechaCorta(N.diaStr(w.lunes))} tiene ${N.fh(w.carga)} de trabajo y ${N.fh(w.cap)} disponibles. Conviene adelantar.</div></div>`);

  return `${partes.join('')}
  <div class="grid2">
    <div class="col">
      ${b ? `<div class="card briefing"><div class="cab"><span class="etiqueta">Tu resumen de hoy</span><span class="tenue">${esc(b.modelo || '')}</span></div>
        ${b.resumen ? `<p>${esc(b.resumen)}</p>` : ''}
        ${b.foco?.length ? `<ul>${b.foco.map((f) => `<li>${f.area ? `<b style="color:${area(f.area).color}">${esc(area(f.area).corto)}:</b> ` : ''}${esc(f.texto)}</li>`).join('')}</ul>` : ''}
        ${b.avisos?.length ? `<ul>${b.avisos.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
        ${b.frase ? `<div class="frase">${esc(b.frase)}</div>` : ''}</div>` : ''}
      <div class="card">
        <div class="cab"><h2>Qué hacer hoy</h2><span class="tenue">${plan.length ? `${N.fh(plan.reduce((s, p) => s + p.horas, 0))} planificadas` : ''}</span></div>
        ${plan.length ? agruparPorArea(plan) : `<div class="vacio">${N.esLaboral(S.estado, A.ahora) ? 'No queda nada planificado para hoy. ¡Bien!' : 'Hoy es día libre. Nada urgente.'}</div>`}
        ${extras.length ? `<details class="plegable"><summary>Si te da el tiempo (${extras.length})</summary>${agruparPorArea(extras)}</details>` : ''}
      </div>
    </div>
    <div class="col">
      ${alertas.length ? `<div class="card"><div class="cab"><h2>Ojo con esto</h2></div>${alertas.join('')}</div>` : ''}
      <div class="card"><div class="cab"><h2>Agenda</h2><span class="tenue">${S.calVivo ? 'en vivo' : S.cal?.actualizado ? `al ${fechaCorta(S.cal.actualizado.slice(0, 10))}` : ''}</span></div>
        ${agenda([['Hoy', A.hoyEventos], ['Mañana', A.mananaEventos]])}</div>
      <div class="card"><div class="cab"><h2>La semana por área</h2></div>
        <div class="areas-res">${A.areas.map((a) => {
          const pa = A.porArea[a.id];
          return `<button class="area-res" style="--c:${a.color}" data-a="tab" data-id="${a.id}"><span class="nom">${esc(a.nombre)}</span>${nivelHtml(pa.nivel, true)}<div class="barra"><i style="width:${pct(pa.progreso)}%"></i></div></button>`;
        }).join('')}</div></div>
    </div>
  </div>`;
}

const emojiVida = (t) => ({ vacaciones: '🌴', mudanza: '📦', viaje: '✈️', salud: '🩺' }[t] || '📌');

// ───────────────────────── vista: Área ─────────────────────────
function vistaArea(A, a) {
  const pa = A.porArea[a.id];
  const piezas = A.piezas.filter((p) => p.area === a.id);
  const cuotas = S.estado.cuotas.filter((c) => c.area === a.id && !c.borrado && c.activa !== false);
  const tareas = A.tareas.filter((t) => t.area === a.id);
  const conFecha = tareas.filter((t) => !t.hecha && t.fecha).sort((x, y) => x.fecha.localeCompare(y.fecha));
  const sinFecha = tareas.filter((t) => !t.hecha && !t.fecha).sort((x, y) => (y.prioridad || 0) - (x.prioridad || 0) || (x.creada || 0) - (y.creada || 0));
  const hace7 = Date.now() - 7 * 864e5;
  const hechas = tareas.filter((t) => t.hecha && (t.hechaEn || 0) > hace7);
  const metas = S.estado.metas.filter((m) => m.area === a.id && !m.borrado);

  const cuotaHtml = cuotas.map((c) => {
    const ps = piezas.filter((p) => p.cuota.id === c.id);
    const actuales = ps.filter((p) => !p.atrasada);
    const ok = actuales.filter((p) => p.etapa === 'entregado').length;
    return `<div class="cuota"><div class="cuota-tit"><b>${esc(c.nombre)}</b><span class="tenue">${ok} de ${actuales.length} esta semana · ${N.fh(c.horas)} c/u</span></div>
      <div class="piezas">${ps.map((p) => chipPieza(p, a)).join('') || '<span class="vacio">Pausada esta semana.</span>'}</div></div>`;
  }).join('');

  const extra = [];
  if (a.id === 'standup') extra.push(cardShows(A));
  if (a.fechasUrl) extra.push(cardFechasCliente(A, a));
  const evs = A.eventos.filter((e) => e.area === a.id && e.tipo !== 'show' && e.fin >= A.ahora).slice(0, 8);
  if (evs.length) extra.push(`<div class="card"><div class="cab"><h2>${a.id === 'agencia' ? 'Próximas grabaciones' : 'En el calendario'}</h2></div>${agenda(groupByDay(evs))}</div>`);

  return `<div class="card" style="margin-bottom:14px">
      <div class="cab"><div><h2 style="font-family:var(--fuente-display);font-weight:400;font-size:26px">${esc(a.nombre)}</h2>${a.nota ? `<div class="tenue">${esc(a.nota)}</div>` : ''}</div>${nivelHtml(pa.nivel)}</div>
      <div class="barra" style="--c:${a.color}"><i style="width:${pct(pa.progreso)}%"></i></div>
      <div class="tenue" style="margin-top:8px">${pa.total ? `${pct(pa.progreso)}% de lo de esta semana · ${N.fh(pa.total - pa.hecho)} pendientes` : 'Nada con fecha para esta semana.'}${pa.bloqueadas ? ` · ${pa.bloqueadas} esperando material` : ''}</div>
    </div>
    <div class="grid2">
      <div class="col">
        ${cuotas.length ? `<div class="card"><div class="cab"><h2>Cuotas de la semana</h2><span class="tenue">vencen el domingo</span></div>${cuotaHtml}</div>` : ''}
        ${a.id === 'standup' && !cuotas.length ? `<div class="card"><div class="cab"><h2>Metas semanales de stand-up</h2></div><div class="vacio">Opcional. Por ejemplo: escribir material nuevo una vez por semana.</div><button class="btn chico" data-a="nueva-cuota" data-area="standup">${I.mas} Activar una meta semanal</button></div>` : ''}
        <div class="card"><div class="cab"><h2>Tareas</h2></div>
          ${conFecha.map((t) => filaTarea(t)).join('')}
          ${sinFecha.length ? `<div class="etiqueta" style="margin-top:${conFecha.length ? 14 : 0}px">Sin apuro</div>${sinFecha.map((t) => filaTarea(t)).join('')}` : ''}
          ${!conFecha.length && !sinFecha.length ? '<div class="vacio">Sin tareas. Agregá una abajo.</div>' : ''}
          ${hechas.length ? `<details class="plegable"><summary>Hechas esta semana (${hechas.length})</summary>${hechas.map((t) => filaTarea(t)).join('')}</details>` : ''}
          ${formTarea(a.id)}
        </div>
      </div>
      <div class="col">
        ${extra.join('')}
        <div class="card"><div class="cab"><h2>Metas a largo plazo</h2><button class="btn chico" data-a="nueva-meta" data-area="${a.id}">${I.mas} Meta</button></div>
          ${metas.length ? metas.map(metaHtml).join('') : '<div class="vacio">Sin metas todavía.</div>'}</div>
      </div>
    </div>`;
}

function groupByDay(evs) {
  const m = new Map();
  for (const e of evs) { const k = N.diaStr(e.ini); if (!m.has(k)) m.set(k, []); m.get(k).push(e); }
  return [...m.entries()].map(([k, l]) => [fechaLarga(N.parseDia(k)), l]);
}

function chipPieza(p, a) {
  const etq = p.bloqueado ? 'esperando material' : p.etapa === 'material' && p.cuota.material ? p.cuota.material : N.NOMBRE_ETAPA[p.etapa];
  const nom = N.cantidadEn(p.cuota, p.lunes) > 1 ? `#${p.n}` : p.cuota.nombre.split(' ')[0];
  return `<button class="pieza ${p.etapa} ${p.bloqueado ? 'bloq' : ''} ${p.atrasada && p.etapa !== 'entregado' ? 'vieja' : ''}" style="--c:${a.color};--p:${N.PESO[p.etapa]}" data-a="pieza" data-id="${esc(p.id)}">
    <b>${esc(p.titulo || nom)}</b><small>${esc(etq)}${p.atrasada && p.etapa !== 'entregado' ? ` · sem ${semNum(p.semana)}` : ''}</small><span class="nivelpz"></span></button>`;
}

function formTarea(areaId) {
  return `<form class="agregar" data-form="tarea" data-area="${areaId}">
    <input type="text" name="titulo" placeholder="Nueva tarea…" required>
    <input type="date" name="fecha" title="Fecha límite (opcional)">
    <input type="number" name="horas" step="0.25" min="0" placeholder="horas" title="Horas estimadas (opcional)">
    <button class="btn primario" type="submit">${I.mas}</button>
  </form>`;
}

function metaHtml(m) {
  const pasos = m.pasos || [];
  const hechos = pasos.filter((p) => p.hecho).length;
  const prox = pasos.find((p) => !p.hecho);
  return `<div class="meta-card">
    <div class="cab"><div><b>${m.hecha ? '✓ ' : ''}${esc(m.titulo)}</b>${m.objetivo ? ` <span class="chip">${esc(m.objetivo)}</span>` : ''}</div>
      <button class="mini" data-a="editar-meta" data-id="${esc(m.id)}">${I.puntos}</button></div>
    ${pasos.length ? `<div class="barra"><i style="width:${pct(hechos / pasos.length)}%"></i></div><div class="proximo">${prox ? `Próximo paso: <b>${esc(prox.t)}</b>` : 'Todos los pasos hechos.'} · ${hechos}/${pasos.length}</div>` : '<div class="proximo">Todavía sin pasos. Partila en pasos chicos.</div>'}
    <details class="plegable"><summary>Pasos</summary><div class="pasos">
      ${pasos.map((p) => `<div class="fila ${p.hecho ? 'hecha' : ''}"><button class="chk ${p.hecho ? 'on' : ''}" data-a="paso" data-meta="${esc(m.id)}" data-id="${esc(p.id)}">${p.hecho ? I.check : ''}</button><div class="txt"><b>${esc(p.t)}</b></div><button class="mini" data-a="borrar-paso" data-meta="${esc(m.id)}" data-id="${esc(p.id)}">${I.basura}</button></div>`).join('')}
      <form class="agregar" data-form="paso" data-meta="${esc(m.id)}"><input type="text" name="t" placeholder="Agregar paso…" required><button class="btn chico" type="submit">${I.mas}</button></form>
    </div></details>
  </div>`;
}

function prepItems(s) {
  const base = s.prep.items || N.PREP_BASE.map((t, i) => ({ id: `b${i}`, t, hecho: false }));
  return base;
}

function cardShows(A) {
  const hoyS = A.hoyS;
  const prox = A.shows.filter((s) => s.dia >= hoyS);
  const pasados = A.shows.filter((s) => s.dia < hoyS).reverse().slice(0, 5);
  const fila = (s) => {
    const d = N.parseDia(s.dia);
    const items = prepItems(s);
    return `<div class="fila"><div class="fecha" style="min-width:54px;text-align:center;line-height:1.1"><b style="font-family:var(--fuente-display);font-size:22px;font-weight:400;display:block">${d.getDate()}</b><small class="tenue">${MESES[d.getMonth()].slice(0, 3)}</small></div>
      <div class="txt"><b>${esc(s.titulo)}</b><div class="meta">${s.dia === hoyS ? '<span class="chip ambar">hoy</span>' : `<span>${DIAS[d.getDay()]}</span>`}${s.hora ? `<span>${s.hora}</span>` : ''}${s.lugar ? `<span>${esc(s.lugar)}</span>` : ''}${s.sinSync ? '<span class="chip">sin sincronizar</span>' : ''}<span>prep ${items.filter((i) => i.hecho).length}/${items.length}</span></div></div>
      <button class="mini" data-a="show" data-clave="${esc(s.clave)}">${I.puntos}</button></div>`;
  };
  return `<div class="card"><div class="cab"><h2>Shows</h2><button class="btn chico" data-a="nuevo-show">${I.mas} Show</button></div>
    ${prox.length ? prox.map(fila).join('') : '<div class="vacio">No hay shows próximos en el calendario.</div>'}
    ${pasados.length ? `<details class="plegable"><summary>Recientes</summary>${pasados.map(fila).join('')}</details>` : ''}</div>`;
}

function cardFechasCliente(A, a) {
  const lista = (S.fechas[a.id] || []).filter((f) => f.fecha >= A.hoyS).sort((x, y) => x.fecha.localeCompare(y.fecha)).slice(0, 8);
  const filas = lista.map((f) => {
    const d = N.parseDia(f.fecha);
    const ref = `flyer:${a.id}:${f.id}`;
    const ya = S.estado.tareas.some((t) => t.ref === ref && !t.borrado);
    return `<div class="fila"><div class="fecha"><b>${d.getDate()}</b><small>${MESES[d.getMonth()].slice(0, 3)}</small></div>
      <div class="txt"><b>${esc(f.titulo || f.show)}</b><div class="meta"><span>${esc([f.lugar, f.ciudad].filter(Boolean).join(', '))}</span>${f.hora ? `<span>${f.hora}</span>` : ''}${f.agotado ? '<span class="chip verde">agotado</span>' : ''}</div></div>
      ${ya ? '<span class="chip verde">tarea creada</span>' : `<button class="btn chico" data-a="flyer" data-area="${a.id}" data-id="${esc(f.id)}">Flyer</button>`}</div>`;
  });
  return `<div class="card lista-fechas"><div class="cab"><h2>Próximas fechas de ${esc(a.corto)}</h2><a class="tenue" href="${esc(a.web)}" target="_blank" rel="noopener">web ↗</a></div>
    ${filas.length ? filas.join('') : '<div class="vacio">No encontré fechas próximas en su web.</div>'}</div>`;
}

// ───────────────────────── vista: Metas ─────────────────────────
function vistaMetas(A) {
  return `<div class="grid2"><div class="col">${A.areas.map((a) => {
    const ms = S.estado.metas.filter((m) => m.area === a.id && !m.borrado);
    return `<div class="card" style="border-top:3px solid ${a.color}"><div class="cab"><h2>${esc(a.nombre)}</h2><button class="btn chico" data-a="nueva-meta" data-area="${a.id}">${I.mas} Meta</button></div>
      ${ms.length ? ms.map(metaHtml).join('') : '<div class="vacio">Sin metas.</div>'}</div>`;
  }).join('')}</div>
  <div class="col"><div class="card"><h2>Cómo usar las metas</h2><p class="suave" style="margin:8px 0 0">Son las cosas grandes que no tienen fecha de la semana: lanzar el marketing de Turrákata en EE.UU., ponerle nombre al proyecto con Lu… Partilas en pasos chicos. El próximo paso aparece en el plan de hoy cuando te sobra tiempo, si lo pasás a tarea.</p></div></div></div>`;
}

// ───────────────────────── vista: Vida ─────────────────────────
function vistaVida(A) {
  const evs = S.estado.eventosVida.filter((e) => !e.borrado).sort((a, b) => a.desde.localeCompare(b.desde));
  const max = Math.max(1, ...A.pronostico.map((w) => Math.max(w.carga, w.cap)));
  const barras = A.pronostico.map((w) => `<div class="sem" title="${esc(`Semana ${semNum(w.semana)}: ${N.fh(w.carga)} de trabajo, ${N.fh(w.cap)} disponibles${w.vida.length ? ` · ${w.vida.join(', ')}` : ''}`)}">
      <div class="col-b" style="--c:var(--n-${w.nivel})"><i style="height:${(w.carga / max) * 100}%"></i>${w.vida.length ? '<span class="vida">🌴</span>' : ''}<span style="position:absolute;left:0;right:0;bottom:${(w.cap / max) * 100}%;border-top:2px dashed var(--tinta-3)"></span></div>
      <small>${fechaCorta(N.diaStr(w.lunes)).split(' ')[1]}</small></div>`).join('');
  return `<div class="grid2"><div class="col">
    <div class="card"><div class="cab"><h2>Lo que viene</h2><span class="tenue">barra = trabajo · línea = horas disponibles</span></div>
      <div class="semanas">${barras}</div>
      <p class="tenue" style="margin:10px 0 0">Si una barra pasa la línea, esa semana no te da con jornadas de ${S.estado.config.horasMin} h. Vacaciones, mudanzas y grabaciones bajan la línea.</p></div>
    <div class="card"><div class="cab"><h2>Vacaciones, mudanza y cosas grandes</h2><button class="btn chico" data-a="nuevo-vida">${I.mas} Agregar</button></div>
      ${evs.length ? evs.map((e) => `<div class="fila"><span style="font-size:22px">${emojiVida(e.tipo)}</span><div class="txt"><b>${esc(e.titulo)}</b><div class="meta"><span>${fechaCorta(e.desde)}${e.hasta && e.hasta !== e.desde ? ` → ${fechaCorta(e.hasta)}` : ''}</span><span>${e.capacidad ? `trabajás al ${pct(e.capacidad)}%` : 'sin trabajo'}</span>${e.pausarCuotas ? '<span class="chip">cuotas en pausa</span>' : ''}</div></div><button class="mini" data-a="editar-vida" data-id="${esc(e.id)}">${I.puntos}</button></div>`).join('') : '<div class="vacio">Nada cargado. Cuando sepas la fecha de la mudanza o de unas vacaciones, cargala acá y el Secretario te avisa con tiempo qué adelantar.</div>'}</div>
  </div><div class="col"><div class="card"><h2>Cómo funciona</h2><p class="suave" style="margin:8px 0 0">Cada evento baja tus horas disponibles esos días (vacaciones = 0%). Si marcás <b>cuotas en pausa</b>, las semanas completas que caigan dentro no generan reels ni videos (para cuando lo arreglás con los clientes). Si no, el Secretario te avisa en <i>Hoy</i> qué semanas no te dan para que adelantes.</p></div></div></div>`;
}

// ───────────────────────── vista: Plata ─────────────────────────
function vistaPlata() {
  const d = S.estado.dinero;
  const mon = d.moneda || '$';
  const fmt = (n) => `${mon} ${Math.round(n).toLocaleString('es-UY')}`;
  const meses = N.resumenDinero(S.estado);
  const claves = Object.keys(meses).sort().reverse().slice(0, 6);
  const tablas = claves.map((m) => {
    const filas = Object.entries(meses[m]);
    const tg = filas.reduce((s, [, f]) => s + f.ganado, 0), tc = filas.reduce((s, [, f]) => s + f.cobrado, 0);
    const [y, mm] = m.split('-');
    return `<div class="card"><div class="cab"><h2>${MESES[Number(mm) - 1]} ${y}</h2><span class="tenue">ganado ${fmt(tg)} · cobrado ${fmt(tc)}</span></div><div class="scroll-x"><table class="tabla">
      <tr><th>Área</th><th class="num">Piezas</th><th class="num">Ganado</th><th class="num">Cobrado</th><th class="num">Te deben</th></tr>
      ${filas.map(([a, f]) => `<tr><td>${esc(area(a).nombre)}</td><td class="num">${f.piezas}</td><td class="num">${fmt(f.ganado)}</td><td class="num">${fmt(f.cobrado)}</td><td class="num">${fmt(Math.max(0, f.ganado - f.cobrado))}</td></tr>`).join('')}
    </table></div></div>`;
  }).join('');
  const movs = d.movimientos.filter((m) => !m.borrado).sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 30);
  return `<div class="grid2"><div class="col">
    ${tablas || '<div class="card"><div class="vacio">Todavía no hay entregas con tarifa ni movimientos. Cargá tus tarifas a la derecha.</div></div>'}
    <div class="card"><div class="cab"><h2>Movimientos</h2><button class="btn chico" data-a="nuevo-mov">${I.mas} Agregar</button></div>
      ${movs.length ? movs.map((m) => `<div class="fila"><div class="txt"><b>${esc(m.concepto || (m.tipo === 'cobro' ? 'Cobro' : 'Trabajo extra'))}</b><div class="meta"><span>${fechaCorta(m.fecha)}</span><span>${esc(area(m.area).nombre)}</span><span class="chip ${m.tipo === 'cobro' ? 'verde' : ''}">${m.tipo === 'cobro' ? 'cobro' : 'trabajo'}</span></div></div><b>${fmt(m.monto)}</b><button class="mini" data-a="borrar-mov" data-id="${esc(m.id)}">${I.basura}</button></div>`).join('') : '<div class="vacio">Cobros y trabajos extra (flyers, webs…) van acá.</div>'}</div>
  </div><div class="col"><div class="card"><div class="cab"><h2>Tarifas por pieza</h2></div>
    <form data-form="tarifas" class="campos">
      <label class="campo"><span>Moneda</span><input type="text" name="moneda" value="${esc(mon)}" style="width:90px"></label>
      ${S.estado.cuotas.filter((c) => !c.borrado).map((c) => `<label class="campo"><span>${esc(area(c.area).nombre)} · ${esc(c.nombre)}</span><input type="number" name="t:${esc(c.id)}" value="${esc(d.tarifas[c.id] ?? '')}" min="0" step="1" style="width:140px"></label>`).join('')}
      <button class="btn primario" type="submit">Guardar tarifas</button>
    </form></div></div></div>`;
}

// ───────────────────────── hojas (modales) ─────────────────────────
function abrirHoja(html, ancho = false) {
  const h = $('#hoja');
  h.innerHTML = `<div class="panel ${ancho ? 'ancho' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  h.hidden = false;
  setTimeout(() => h.querySelector('input:not([type=hidden]),textarea,select')?.focus?.(), 50);
}
function cerrarHoja() { $('#hoja').hidden = true; $('#hoja').innerHTML = ''; }

const buscarPieza = (id) => S.A.todas.find((p) => p.id === id);
function setEtapa(id, etapa) {
  mutar((e) => {
    const st = e.piezas[id] || {};
    st.etapa = etapa;
    st.hist = [...(st.hist || []), { e: etapa, t: ahoraMs() }];
    if (etapa === 'material' || etapa === 'entregado') st.bloqueado = false;
    st.u = ahoraMs();
    e.piezas[id] = st;
  }, etapa === 'entregado' ? CELEBRA[Math.floor(Math.random() * CELEBRA.length)] : null);
  if (etapa === 'entregado') $('#anillo-semana')?.classList.add('pulso');
}
function setPieza(id, cambios) {
  mutar((e) => { e.piezas[id] = { ...(e.piezas[id] || {}), ...cambios, u: ahoraMs() }; });
}

function hojaPieza(id) {
  const p = buscarPieza(id);
  if (!p) return;
  const a = area(p.area);
  const etapas = p.cuota.simple ? ['pendiente', 'entregado'] : N.ETAPAS.filter((x) => x !== 'revision' || p.cuota.revision !== false);
  abrirHoja(`<div class="etiqueta" style="color:${a.color}">${esc(a.nombre)} · semana ${semNum(p.semana)}</div>
    <h2>${esc(nombrePieza(p))}</h2>
    <div class="etapas">${etapas.map((x) => `<button class="${p.etapa === x ? 'on' : ''}" data-a="set-etapa" data-id="${esc(id)}" data-etapa="${x}"><span class="p"><i style="width:${N.PESO[x] * 100}%"></i></span>${esc(x === 'material' && p.cuota.material ? p.cuota.material : N.NOMBRE_ETAPA[x])}</button>`).join('')}</div>
    <section class="campos">
      <label class="check"><input type="checkbox" data-a="bloquear" data-id="${esc(id)}" ${p.bloqueado ? 'checked' : ''}> Esperando material del cliente (no cuenta en contra)</label>
      <label class="campo"><span>Título (opcional)</span><input type="text" id="pz-titulo" value="${esc(p.titulo)}" placeholder="Ej: reel del show en Movie"></label>
      <label class="campo"><span>Nota</span><input type="text" id="pz-nota" value="${esc(p.nota)}"></label>
      <label class="campo"><span>Monto (si es distinto de la tarifa)</span><input type="number" id="pz-monto" value="${esc(p.monto ?? '')}"></label>
    </section>
    <div class="pie"><button class="btn peligro" data-a="descartar" data-id="${esc(id)}">${p.descartada ? 'Recuperar' : 'Descartar esta pieza'}</button>
      <div class="der"><button class="btn" data-a="cerrar">Cerrar</button><button class="btn primario" data-a="guardar-pieza" data-id="${esc(id)}">Guardar</button></div></div>`);
}

function hojaTarea(t, areaId) {
  const nueva = !t;
  t = t || { id: N.nuevoId('t'), area: areaId || 'gamedev', titulo: '', hecha: false };
  abrirHoja(`<h2>${nueva ? 'Nueva tarea' : 'Editar tarea'}</h2>
    <form data-form="editar-tarea" data-id="${esc(t.id)}" data-nueva="${nueva ? 1 : ''}" class="campos" style="margin-top:14px">
      <label class="campo"><span>Qué hay que hacer</span><input type="text" name="titulo" value="${esc(t.titulo)}" required></label>
      <div class="campos-2">
        <label class="campo"><span>Área</span><select name="area">${S.estado.areas.map((a) => `<option value="${a.id}" ${a.id === t.area ? 'selected' : ''}>${esc(a.nombre)}</option>`).join('')}</select></label>
        <label class="campo"><span>Fecha límite</span><input type="date" name="fecha" value="${esc(t.fecha || '')}"></label>
        <label class="campo"><span>Horas estimadas</span><input type="number" name="horas" step="0.25" min="0" value="${esc(t.horas ?? '')}" placeholder="${S.estado.config.horasTarea}"></label>
        <label class="campo"><span>Cantidad (contador)</span><input type="number" name="total" min="0" value="${esc(t.total ?? '')}" placeholder="ej: 200"></label>
      </div>
      <label class="campo"><span>Prioridad (para las sin fecha)</span><select name="prioridad">${[[0, 'Normal'], [1, 'Alta'], [2, 'Muy alta']].map(([v, n]) => `<option value="${v}" ${(t.prioridad || 0) == v ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="campo"><span>Notas</span><textarea name="notas">${esc(t.notas || '')}</textarea></label>
      <div class="pie">${nueva ? '<span></span>' : `<button class="btn peligro" type="button" data-a="borrar-tarea" data-id="${esc(t.id)}">${I.basura} Borrar</button>`}
        <div class="der"><button class="btn" type="button" data-a="cerrar">Cancelar</button><button class="btn primario" type="submit">Guardar</button></div></div>
    </form>`);
}

function hojaMeta(m, areaId) {
  const nueva = !m;
  m = m || { id: N.nuevoId('m'), area: areaId, titulo: '', objetivo: '', pasos: [] };
  abrirHoja(`<h2>${nueva ? 'Nueva meta' : 'Editar meta'}</h2>
    <form data-form="editar-meta" data-id="${esc(m.id)}" data-nueva="${nueva ? 1 : ''}" class="campos" style="margin-top:14px">
      <label class="campo"><span>Meta</span><input type="text" name="titulo" value="${esc(m.titulo)}" required></label>
      <div class="campos-2">
        <label class="campo"><span>Área</span><select name="area">${S.estado.areas.map((a) => `<option value="${a.id}" ${a.id === m.area ? 'selected' : ''}>${esc(a.nombre)}</option>`).join('')}</select></label>
        <label class="campo"><span>Para cuándo (texto libre)</span><input type="text" name="objetivo" value="${esc(m.objetivo || '')}" placeholder="ej: marzo 2027"></label>
      </div>
      ${nueva ? '<label class="campo"><span>Pasos (uno por línea, opcional)</span><textarea name="pasos"></textarea></label>' : `<label class="check"><input type="checkbox" name="hecha" ${m.hecha ? 'checked' : ''}> Meta cumplida</label>`}
      <div class="pie">${nueva ? '<span></span>' : `<button class="btn peligro" type="button" data-a="borrar-meta" data-id="${esc(m.id)}">${I.basura} Borrar</button>`}
        <div class="der"><button class="btn" type="button" data-a="cerrar">Cancelar</button><button class="btn primario" type="submit">Guardar</button></div></div>
    </form>`);
}

function hojaVida(v) {
  const nueva = !v;
  v = v || { id: N.nuevoId('v'), titulo: '', tipo: 'vacaciones', desde: N.diaStr(new Date()), hasta: '', capacidad: 0, pausarCuotas: false };
  abrirHoja(`<h2>${nueva ? 'Algo grande en el calendario' : 'Editar'}</h2>
    <form data-form="editar-vida" data-id="${esc(v.id)}" data-nueva="${nueva ? 1 : ''}" class="campos" style="margin-top:14px">
      <label class="campo"><span>Qué es</span><input type="text" name="titulo" value="${esc(v.titulo)}" placeholder="Ej: Vacaciones en Rocha, Mudanza a…" required></label>
      <div class="campos-2">
        <label class="campo"><span>Tipo</span><select name="tipo">${['vacaciones', 'mudanza', 'viaje', 'salud', 'otro'].map((t) => `<option ${t === v.tipo ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <label class="campo"><span>Desde</span><input type="date" name="desde" value="${esc(v.desde)}" required></label>
        <label class="campo"><span>Hasta</span><input type="date" name="hasta" value="${esc(v.hasta || '')}"></label>
        <label class="campo"><span>Cuánto trabajás esos días</span><select name="capacidad">${[[0, 'Nada (0%)'], [0.25, 'Poco (25%)'], [0.5, 'La mitad (50%)'], [0.75, 'Casi normal (75%)']].map(([x, n]) => `<option value="${x}" ${Number(v.capacidad) === x ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      </div>
      <label class="check"><input type="checkbox" name="pausarCuotas" ${v.pausarCuotas ? 'checked' : ''}> Pausar las cuotas semanales esas semanas (ya lo hablé con los clientes)</label>
      <label class="campo"><span>Notas</span><textarea name="notas">${esc(v.notas || '')}</textarea></label>
      <div class="pie">${nueva ? '<span></span>' : `<button class="btn peligro" type="button" data-a="borrar-vida" data-id="${esc(v.id)}">${I.basura} Borrar</button>`}
        <div class="der"><button class="btn" type="button" data-a="cerrar">Cancelar</button><button class="btn primario" type="submit">Guardar</button></div></div>
    </form>`);
}

function hojaShow(clave) {
  const s = clave ? S.A.shows.find((x) => x.clave === clave) : null;
  if (clave && !s) return;
  if (!s) {
    abrirHoja(`<h2>Nuevo show</h2>
      <form data-form="nuevo-show" class="campos" style="margin-top:14px">
        <label class="campo"><span>Nombre</span><input type="text" name="titulo" placeholder="Ej: Open mic en…" required></label>
        <div class="campos-2">
          <label class="campo"><span>Fecha</span><input type="date" name="fecha" required value="${N.diaStr(new Date())}"></label>
          <label class="campo"><span>Hora</span><input type="time" name="hora" value="21:00"></label>
        </div>
        <label class="campo"><span>Lugar</span><input type="text" name="lugar"></label>
        <label class="campo"><span>Notas</span><textarea name="notas"></textarea></label>
        <p class="tenue" style="margin:0">${S.estado.config.calendario.url ? 'Se agrega también a tu calendario "Shows".' : 'Se va a pasar a tu calendario "Shows" en la próxima actualización automática.'}</p>
        <div class="pie"><span></span><div class="der"><button class="btn" type="button" data-a="cerrar">Cancelar</button><button class="btn primario" type="submit">Agregar</button></div></div>
      </form>`);
    return;
  }
  const items = prepItems(s);
  abrirHoja(`<div class="etiqueta" style="color:${area('standup').color}">Show · ${fechaLarga(N.parseDia(s.dia))}${s.hora ? ` · ${s.hora}` : ''}</div>
    <h2>${esc(s.titulo)}</h2>${s.lugar ? `<div class="suave">${esc(s.lugar)}</div>` : ''}${s.notas ? `<p class="suave">${esc(s.notas)}</p>` : ''}
    <section><h3>Preparación</h3>
      ${items.map((i) => `<div class="fila ${i.hecho ? 'hecha' : ''}"><button class="chk ${i.hecho ? 'on' : ''}" data-a="prep" data-clave="${esc(clave)}" data-id="${esc(i.id)}">${i.hecho ? I.check : ''}</button><div class="txt"><b>${esc(i.t)}</b></div><button class="mini" data-a="borrar-prep" data-clave="${esc(clave)}" data-id="${esc(i.id)}">${I.basura}</button></div>`).join('')}
      <form class="agregar" data-form="prep" data-clave="${esc(clave)}"><input type="text" name="t" placeholder="Agregar a la preparación…" required><button class="btn chico" type="submit">${I.mas}</button></form>
    </section>
    <section><h3>Notas del show</h3><textarea id="show-notas" placeholder="Qué funcionó, qué probar la próxima…">${esc(s.prep.notas || '')}</textarea></section>
    <div class="pie"><button class="btn peligro" data-a="borrar-show" data-clave="${esc(clave)}">${I.basura} Sacar show</button>
      <div class="der"><button class="btn primario" data-a="guardar-show-notas" data-clave="${esc(clave)}">Listo</button></div></div>`);
}

function hojaCuotaNueva(areaId) {
  abrirHoja(`<h2>Meta semanal</h2>
    <form data-form="nueva-cuota" data-area="${areaId}" class="campos" style="margin-top:14px">
      <label class="campo"><span>Qué</span><input type="text" name="nombre" placeholder="Ej: Escribir material nuevo" required></label>
      <div class="campos-2">
        <label class="campo"><span>Veces por semana</span><input type="number" name="cantidad" value="1" min="1"></label>
        <label class="campo"><span>Horas cada vez</span><input type="number" name="horas" value="1" min="0" step="0.25"></label>
      </div>
      <div class="pie"><span></span><div class="der"><button class="btn" type="button" data-a="cerrar">Cancelar</button><button class="btn primario" type="submit">Activar</button></div></div>
    </form>`);
}

function hojaMov() {
  abrirHoja(`<h2>Movimiento</h2>
    <form data-form="nuevo-mov" class="campos" style="margin-top:14px">
      <div class="campos-2">
        <label class="campo"><span>Tipo</span><select name="tipo"><option value="cobro">Cobro (me pagaron)</option><option value="extra">Trabajo extra (flyer, web…)</option></select></label>
        <label class="campo"><span>Área</span><select name="area">${S.estado.areas.map((a) => `<option value="${a.id}">${esc(a.nombre)}</option>`).join('')}</select></label>
        <label class="campo"><span>Monto</span><input type="number" name="monto" min="0" required></label>
        <label class="campo"><span>Fecha</span><input type="date" name="fecha" value="${N.diaStr(new Date())}" required></label>
      </div>
      <label class="campo"><span>Concepto</span><input type="text" name="concepto" placeholder="Ej: Flyer PATOTERA 25/11"></label>
      <div class="pie"><span></span><div class="der"><button class="btn" type="button" data-a="cerrar">Cancelar</button><button class="btn primario" type="submit">Guardar</button></div></div>
    </form>`);
}

function hojaAjustes() {
  const c = S.estado.config;
  const tok = GH.token || '';
  abrirHoja(`<h2>Ajustes</h2>
    <form data-form="ajustes" class="campos">
      <section><h3>Tu jornada</h3><div class="campos-2">
        <label class="campo"><span>Horas por día (mínimo)</span><input type="number" name="horasMin" value="${c.horasMin}" min="1" max="16" step="0.5"></label>
        <label class="campo"><span>Horas por día (máximo)</span><input type="number" name="horasMax" value="${c.horasMax}" min="1" max="16" step="0.5"></label>
        <label class="campo"><span>Empezás a las</span><input type="number" name="inicioJornada" value="${c.inicioJornada}" min="0" max="23"></label>
        <label class="campo"><span>Horas de emergencia por día de finde</span><input type="number" name="horasFinde" value="${c.horasFinde}" min="0" max="12"></label>
        <label class="campo"><span>Horas por tarea sin estimar</span><input type="number" name="horasTarea" value="${c.horasTarea}" min="0" step="0.25"></label>
        <label class="campo"><span>Horas mínimas por grabación</span><input type="number" name="horasGrabacionMin" value="${c.horasGrabacionMin}" min="0" step="0.5"></label>
      </div></section>
      <section><h3>Cuotas semanales</h3>
        ${S.estado.cuotas.filter((q) => !q.borrado).map((q) => `<div class="campos-2" style="align-items:end;margin-bottom:8px">
          <label class="campo"><span>${esc(area(q.area).corto)} · nombre</span><input type="text" name="q:${q.id}:nombre" value="${esc(q.nombre)}"></label>
          <label class="campo"><span>Por semana</span><input type="number" name="q:${q.id}:cantidad" value="${N.cantidadEn(q, N.lunes(new Date()))}" min="0"></label>
          <label class="campo"><span>Horas c/u</span><input type="number" name="q:${q.id}:horas" value="${q.horas}" min="0" step="0.25"></label>
          <label class="check"><input type="checkbox" name="q:${q.id}:activa" ${q.activa !== false ? 'checked' : ''}> activa</label></div>`).join('')}
        <p class="tenue" style="margin:4px 0 0">Si cambiás la cantidad, aplica desde esta semana; las anteriores quedan como estaban.</p>
      </section>
      <section><h3>Pomodoro</h3><div class="campos-2">
        <label class="campo"><span>Foco (min)</span><input type="number" name="pFoco" value="${c.pomodoro.foco}" min="5" max="120"></label>
        <label class="campo"><span>Descanso (min)</span><input type="number" name="pDescanso" value="${c.pomodoro.descanso}" min="1" max="60"></label>
        <label class="campo"><span>Descanso largo (min)</span><input type="number" name="pLargo" value="${c.pomodoro.largo}" min="1" max="60"></label>
        <label class="campo"><span>Largo cada (ciclos)</span><input type="number" name="pCada" value="${c.pomodoro.cada}" min="2" max="10"></label>
      </div></section>
      <section><h3>Google Calendar (Apps Script)</h3><div class="campos">
        <label class="campo"><span>URL del Apps Script</span><input type="url" name="calUrl" value="${esc(c.calendario.url)}" placeholder="https://script.google.com/macros/s/…/exec"></label>
        <label class="campo"><span>Clave</span><input type="password" name="calClave" value="${esc(c.calendario.clave)}"></label>
      </div></section>
      <section><h3>Cómo leo tu calendario</h3>
        <label class="campo"><span>Reglas (JSON): la primera que coincide gana. tipo: show · grabacion · evento · feriado · cumple · ignorar</span><textarea class="json" name="reglas" style="min-height:160px">${esc(JSON.stringify(c.reglas, null, 2))}</textarea></label>
      </section>
      <section><h3>Conexión</h3><div class="tenue">Repo: ${esc(GH.repo)} · llave …${esc(tok.slice(-4))}</div></section>
      <div class="pie"><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn peligro" type="button" data-a="salir">Cerrar sesión</button><button class="btn" type="button" data-a="json">Editar JSON</button></div>
        <div class="der"><button class="btn" type="button" data-a="cerrar">Cancelar</button><button class="btn primario" type="submit">Guardar</button></div></div>
    </form>`, true);
}

function hojaJson() {
  abrirHoja(`<h2>Editar datos (JSON)</h2><p class="tenue">Para cambios que no tienen botón. Cuidado: si rompés el formato no se guarda.</p>
    <textarea class="json" id="json-edit">${esc(JSON.stringify(S.estado, null, 2))}</textarea>
    <div class="pie"><span class="error" id="json-err"></span><div class="der"><button class="btn" data-a="cerrar">Cancelar</button><button class="btn primario" data-a="guardar-json">Guardar</button></div></div>`, true);
}

// ───────────────────────── acciones ─────────────────────────
const ACC = {
  tab(el) { S.tab = el.dataset.id; ls.set('sec.tab', S.tab); render(); window.scrollTo({ top: Math.min(window.scrollY, $('.tabs').offsetTop - 6), behavior: 'smooth' }); },
  tema() {
    const orden = ['auto', 'claro', 'oscuro'];
    const t = orden[(orden.indexOf(ls.get('sec.tema', 'auto')) + 1) % 3];
    ls.set('sec.tema', t);
    document.documentElement.dataset.tema = t;
    toast(t === 'auto' ? 'Tema automático' : t === 'claro' ? 'Modo día' : 'Modo noche');
    render();
  },
  ajustes: hojaAjustes,
  cerrar: cerrarHoja,
  json: hojaJson,
  'guardar-json'() {
    try {
      const nuevo = N.asegurarEstado(JSON.parse($('#json-edit').value));
      const t = ahoraMs();
      for (const k of ['areas', 'cuotas', 'tareas', 'metas', 'eventosVida', 'shows']) for (const x of nuevo[k]) x.u = t;
      for (const k of ['piezas', 'showsPrep']) for (const v of Object.values(nuevo[k])) v.u = t;
      nuevo.config.u = t; nuevo.dinero.u = t;
      for (const m of nuevo.dinero.movimientos) m.u = t;
      mutar((e) => Object.assign(e, nuevo), 'Datos guardados');
      cerrarHoja();
    } catch (err) { $('#json-err').textContent = `JSON inválido: ${err.message}`; }
  },
  salir() { if (confirm('¿Cerrar sesión en este dispositivo?')) { ls.del('sec.token'); ls.del('sec.cache'); location.reload(); } },
  async actualizar() {
    toast('Pidiendo actualización…');
    try {
      const r = await GH.leer('datos/pedido.json');
      await GH.escribir('datos/pedido.json', { pedido: new Date().toISOString(), por: 'página' }, r.sha, 'Página: pedir actualización');
      toast('Listo. Si tu PC está prendida, el resumen se actualiza en unos minutos.');
    } catch (e) { toast(`No pude pedirla: ${e.message}`); }
    await cargar();
    calendarioEnVivo();
    fechasClientes();
  },
  avanzar(el) { const p = buscarPieza(el.dataset.id); if (p) setEtapa(p.id, N.siguienteEtapa(p)); },
  entregar(el) { const p = buscarPieza(el.dataset.id); if (p) setEtapa(p.id, p.etapa === 'entregado' ? (p.cuota.simple ? 'pendiente' : 'editado') : 'entregado'); },
  pieza(el) { hojaPieza(el.dataset.id); },
  'set-etapa'(el) { setEtapa(el.dataset.id, el.dataset.etapa); hojaPieza(el.dataset.id); },
  bloquear(el) { setPieza(el.dataset.id, { bloqueado: el.checked }); },
  descartar(el) {
    const p = buscarPieza(el.dataset.id);
    if (!p.descartada && !confirm('¿Descartar esta pieza? No se va a arrastrar a la semana siguiente.')) return;
    setPieza(p.id, { descartada: !p.descartada });
    cerrarHoja();
    toast(p.descartada ? 'Pieza recuperada' : 'Pieza descartada');
  },
  'guardar-pieza'(el) {
    const m = $('#pz-monto').value;
    setPieza(el.dataset.id, { titulo: $('#pz-titulo').value.trim(), nota: $('#pz-nota').value.trim(), monto: m === '' ? undefined : Number(m) });
    cerrarHoja();
  },
  hecha(el) {
    const t = S.estado.tareas.find((x) => x.id === el.dataset.id);
    const ya = t.hecha;
    mutar((e) => {
      const x = e.tareas.find((y) => y.id === t.id);
      x.hecha = !ya; x.hechaEn = !ya ? ahoraMs() : null; x.u = ahoraMs();
    }, !ya ? CELEBRA[Math.floor(Math.random() * CELEBRA.length)] : null);
    if (!ya) $('#anillo-semana')?.classList.add('pulso');
  },
  sumar(el) {
    let n = el.dataset.n;
    const t = S.estado.tareas.find((x) => x.id === el.dataset.id);
    let nuevo;
    if (n === '?') {
      const v = prompt(`¿Cuántos llevás de ${t.total}?`, t.actual || 0);
      if (v === null || isNaN(Number(v))) return;
      nuevo = Number(v);
    } else nuevo = (t.actual || 0) + Number(n);
    nuevo = Math.max(0, Math.min(t.total, nuevo));
    mutar((e) => {
      const x = e.tareas.find((y) => y.id === t.id);
      x.actual = nuevo; x.hist = [...(x.hist || []), { v: nuevo, t: ahoraMs() }].slice(-200); x.u = ahoraMs();
      if (nuevo >= x.total) { x.hecha = true; x.hechaEn = ahoraMs(); }
    }, nuevo >= t.total ? '¡Terminaste! 🎉' : null);
  },
  'editar-tarea'(el) { hojaTarea(S.estado.tareas.find((x) => x.id === el.dataset.id)); },
  'borrar-tarea'(el) { if (!confirm('¿Borrar la tarea?')) return; mutar((e) => { const x = e.tareas.find((y) => y.id === el.dataset.id); x.borrado = true; x.u = ahoraMs(); }, 'Tarea borrada'); cerrarHoja(); },
  'nueva-meta'(el) { hojaMeta(null, el.dataset.area); },
  'editar-meta'(el) { hojaMeta(S.estado.metas.find((x) => x.id === el.dataset.id)); },
  'borrar-meta'(el) { if (!confirm('¿Borrar la meta?')) return; mutar((e) => { const x = e.metas.find((y) => y.id === el.dataset.id); x.borrado = true; x.u = ahoraMs(); }); cerrarHoja(); },
  paso(el) { mutar((e) => { const m = e.metas.find((y) => y.id === el.dataset.meta); const p = m.pasos.find((y) => y.id === el.dataset.id); p.hecho = !p.hecho; m.u = ahoraMs(); }, null); },
  'borrar-paso'(el) { mutar((e) => { const m = e.metas.find((y) => y.id === el.dataset.meta); m.pasos = m.pasos.filter((y) => y.id !== el.dataset.id); m.u = ahoraMs(); }); },
  'nuevo-vida'() { hojaVida(); },
  'editar-vida'(el) { hojaVida(S.estado.eventosVida.find((x) => x.id === el.dataset.id)); },
  'borrar-vida'(el) { if (!confirm('¿Borrar?')) return; mutar((e) => { const x = e.eventosVida.find((y) => y.id === el.dataset.id); x.borrado = true; x.u = ahoraMs(); }); cerrarHoja(); },
  'nuevo-show'() { hojaShow(null); },
  show(el) { hojaShow(el.dataset.clave); },
  prep(el) {
    const clave = el.dataset.clave;
    const s = S.A.shows.find((x) => x.clave === clave);
    mutar((e) => {
      const p = e.showsPrep[clave] || {};
      p.items = (p.items || prepItems(s)).map((i) => (i.id === el.dataset.id ? { ...i, hecho: !i.hecho } : i));
      p.u = ahoraMs(); e.showsPrep[clave] = p;
    });
    hojaShow(clave);
  },
  'borrar-prep'(el) {
    const clave = el.dataset.clave;
    const s = S.A.shows.find((x) => x.clave === clave);
    mutar((e) => { const p = e.showsPrep[clave] || {}; p.items = (p.items || prepItems(s)).filter((i) => i.id !== el.dataset.id); p.u = ahoraMs(); e.showsPrep[clave] = p; });
    hojaShow(clave);
  },
  'guardar-show-notas'(el) {
    const clave = el.dataset.clave;
    const notas = $('#show-notas').value;
    mutar((e) => { const p = e.showsPrep[clave] || {}; p.notas = notas; p.u = ahoraMs(); e.showsPrep[clave] = p; });
    cerrarHoja();
  },
  async 'borrar-show'(el) {
    const clave = el.dataset.clave;
    const s = S.A.shows.find((x) => x.clave === clave);
    if (!confirm(`¿Sacar "${s.titulo}"? También se borra de tu Google Calendar.`)) return;
    mutar((e) => {
      if (clave.startsWith('m:')) { const x = e.shows.find((y) => y.id === clave.slice(2)); if (x) { x.borrado = true; x.u = ahoraMs(); } }
      const p = e.showsPrep[clave] || {}; p.borrar = true; if (s.evento) { p.eventoId = s.evento.id; p.cal = s.evento.cal; } p.u = ahoraMs(); e.showsPrep[clave] = p;
    }, 'Show sacado');
    cerrarHoja();
    try {
      await postCalendario({ shows: { borrar: clave.startsWith('m:') ? [{ sid: clave.slice(2), fecha: s.dia }] : [], borrarIds: s.evento && !s.evento.sid ? [{ id: s.evento.id, cal: s.evento.cal }] : [] } });
    } catch {}
  },
  'nueva-cuota'(el) { hojaCuotaNueva(el.dataset.area); },
  flyer(el) {
    const f = (S.fechas[el.dataset.area] || []).find((x) => x.id === el.dataset.id);
    if (!f) return;
    const hoy = N.diaStr(new Date());
    let fecha = N.diaStr(N.sumarDias(N.parseDia(f.fecha), -7));
    if (fecha < hoy) fecha = hoy;
    mutar((e) => e.tareas.push({ id: N.nuevoId('t'), area: el.dataset.area, titulo: `Flyer · ${f.titulo || f.show} (${fechaCorta(f.fecha)})`, fecha, horas: 1, ref: `flyer:${el.dataset.area}:${f.id}`, hecha: false, creada: ahoraMs(), u: ahoraMs() }), `Tarea creada para el ${fechaCorta(fecha)}`);
  },
  'nuevo-mov': hojaMov,
  'borrar-mov'(el) { if (!confirm('¿Borrar el movimiento?')) return; mutar((e) => { const x = e.dinero.movimientos.find((y) => y.id === el.dataset.id); x.borrado = true; x.u = ahoraMs(); }); },
  pomo() { P.modo = P.modo === 'pomo' ? 'reloj' : 'pomo'; guardarP(); pintarReloj(true); },
  reloj() { P.modo = 'reloj'; guardarP(); pintarReloj(true); },
  'pomo-play'() {
    if (P.corriendo) { P.restante = P.fin - Date.now(); P.corriendo = false; }
    else { P.fin = Date.now() + (P.restante ?? durFase() * 60000); P.corriendo = true; pedirNotif(); }
    guardarP(); pintarReloj(true);
  },
  'pomo-reset'() { P.corriendo = false; P.restante = null; P.fin = null; guardarP(); pintarReloj(true); },
  'pomo-saltar'() { terminarFase(false); },
  ruido: toggleRuido,
};

// formularios
const FORM = {
  tarea(f, fd) {
    const titulo = fd.get('titulo').trim();
    if (!titulo) return;
    const horas = fd.get('horas');
    mutar((e) => e.tareas.push({ id: N.nuevoId('t'), area: f.dataset.area, titulo, fecha: fd.get('fecha') || null, horas: horas ? Number(horas) : undefined, hecha: false, creada: ahoraMs(), u: ahoraMs() }), 'Tarea agregada');
  },
  'editar-tarea'(f, fd) {
    const id = f.dataset.id;
    const datos = {
      titulo: fd.get('titulo').trim(), area: fd.get('area'), fecha: fd.get('fecha') || null,
      horas: fd.get('horas') ? Number(fd.get('horas')) : undefined, total: fd.get('total') ? Number(fd.get('total')) : undefined,
      prioridad: Number(fd.get('prioridad')) || 0, notas: fd.get('notas').trim(), u: ahoraMs(),
    };
    mutar((e) => {
      const x = e.tareas.find((y) => y.id === id);
      if (x) Object.assign(x, datos);
      else e.tareas.push({ id, ...datos, hecha: false, creada: ahoraMs(), actual: datos.total ? 0 : undefined });
    });
    cerrarHoja();
  },
  'editar-meta'(f, fd) {
    const id = f.dataset.id;
    mutar((e) => {
      const x = e.metas.find((y) => y.id === id);
      const datos = { titulo: fd.get('titulo').trim(), area: fd.get('area'), objetivo: fd.get('objetivo').trim(), u: ahoraMs() };
      if (x) Object.assign(x, datos, { hecha: !!fd.get('hecha') });
      else e.metas.push({ id, ...datos, hecha: false, pasos: (fd.get('pasos') || '').split('\n').map((t) => t.trim()).filter(Boolean).map((t) => ({ id: N.nuevoId('p'), t, hecho: false })) });
    });
    cerrarHoja();
  },
  paso(f, fd) {
    const t = fd.get('t').trim();
    if (!t) return;
    mutar((e) => { const m = e.metas.find((y) => y.id === f.dataset.meta); m.pasos = [...(m.pasos || []), { id: N.nuevoId('p'), t, hecho: false }]; m.u = ahoraMs(); });
    setTimeout(() => { const d = document.querySelector(`form[data-meta="${CSS.escape(f.dataset.meta)}"]`); d?.closest('details')?.setAttribute('open', ''); d?.querySelector('input')?.focus(); }, 0);
  },
  'editar-vida'(f, fd) {
    const id = f.dataset.id;
    const datos = { titulo: fd.get('titulo').trim(), tipo: fd.get('tipo'), desde: fd.get('desde'), hasta: fd.get('hasta') || fd.get('desde'), capacidad: Number(fd.get('capacidad')), pausarCuotas: !!fd.get('pausarCuotas'), notas: fd.get('notas').trim(), u: ahoraMs() };
    mutar((e) => { const x = e.eventosVida.find((y) => y.id === id); if (x) Object.assign(x, datos); else e.eventosVida.push({ id, ...datos }); }, 'Guardado');
    cerrarHoja();
  },
  async 'nuevo-show'(f, fd) {
    const s = { id: N.nuevoId('s'), titulo: fd.get('titulo').trim(), fecha: fd.get('fecha'), hora: fd.get('hora'), lugar: fd.get('lugar').trim(), notas: fd.get('notas').trim(), u: ahoraMs() };
    mutar((e) => e.shows.push(s), 'Show agregado');
    cerrarHoja();
    try {
      const r = await postCalendario({ shows: { crear: [s] } });
      if (r?.ok) { toast('También está en tu Google Calendar'); calendarioEnVivo(); }
    } catch {}
  },
  prep(f, fd) {
    const clave = f.dataset.clave;
    const t = fd.get('t').trim();
    const s = S.A.shows.find((x) => x.clave === clave);
    mutar((e) => { const p = e.showsPrep[clave] || {}; p.items = [...(p.items || prepItems(s)), { id: N.nuevoId('i'), t, hecho: false }]; p.u = ahoraMs(); e.showsPrep[clave] = p; });
    hojaShow(clave);
  },
  'nueva-cuota'(f, fd) {
    mutar((e) => e.cuotas.push({ id: N.nuevoId('q'), area: f.dataset.area, nombre: fd.get('nombre').trim(), cantidad: Number(fd.get('cantidad')) || 1, horas: Number(fd.get('horas')) || 0, simple: true, desde: N.diaStr(N.lunes(new Date())), u: ahoraMs() }), 'Meta semanal activada');
    cerrarHoja();
  },
  'nuevo-mov'(f, fd) {
    mutar((e) => e.dinero.movimientos.push({ id: N.nuevoId('d'), tipo: fd.get('tipo'), area: fd.get('area'), monto: Number(fd.get('monto')), fecha: fd.get('fecha'), concepto: fd.get('concepto').trim(), u: ahoraMs() }), 'Guardado');
    cerrarHoja();
  },
  tarifas(f, fd) {
    mutar((e) => {
      e.dinero.moneda = fd.get('moneda').trim() || '$';
      for (const [k, v] of fd.entries()) if (k.startsWith('t:')) { if (v === '') delete e.dinero.tarifas[k.slice(2)]; else e.dinero.tarifas[k.slice(2)] = Number(v); }
      e.dinero.u = ahoraMs();
    }, 'Tarifas guardadas');
  },
  ajustes(f, fd) {
    let reglas;
    try { reglas = JSON.parse(fd.get('reglas')); } catch { return toast('Las reglas no son JSON válido'); }
    const lun = N.diaStr(N.lunes(new Date()));
    mutar((e) => {
      const c = e.config;
      for (const k of ['horasMin', 'horasMax', 'inicioJornada', 'horasFinde', 'horasTarea', 'horasGrabacionMin']) c[k] = Number(fd.get(k));
      c.pomodoro = { foco: Number(fd.get('pFoco')), descanso: Number(fd.get('pDescanso')), largo: Number(fd.get('pLargo')), cada: Number(fd.get('pCada')) };
      c.calendario = { url: fd.get('calUrl').trim(), clave: fd.get('calClave').trim() };
      c.reglas = reglas;
      c.u = ahoraMs();
      for (const q of e.cuotas) {
        if (q.borrado || !fd.has(`q:${q.id}:nombre`)) continue;
        const cant = Number(fd.get(`q:${q.id}:cantidad`));
        if (cant !== N.cantidadEn(q, N.lunes(new Date()))) q.cambios = [...(q.cambios || []).filter((x) => x.desde !== lun), { desde: lun, cantidad: cant }];
        q.nombre = fd.get(`q:${q.id}:nombre`).trim() || q.nombre;
        q.horas = Number(fd.get(`q:${q.id}:horas`));
        q.activa = !!fd.get(`q:${q.id}:activa`);
        q.u = ahoraMs();
      }
    }, 'Ajustes guardados');
    cerrarHoja();
    calendarioEnVivo();
  },
};

document.addEventListener('click', (ev) => {
  if (ev.target.id === 'hoja') return cerrarHoja();
  const el = ev.target.closest('[data-a]');
  if (!el) return;
  if (el.tagName === 'INPUT' && el.type === 'checkbox') { ACC[el.dataset.a]?.(el, ev); return; }
  ev.preventDefault();
  ACC[el.dataset.a]?.(el, ev);
});
document.addEventListener('submit', (ev) => {
  const f = ev.target.closest('form[data-form]');
  if (!f) return;
  ev.preventDefault();
  FORM[f.dataset.form]?.(f, new FormData(f));
});
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !$('#hoja').hidden) cerrarHoja(); });

// ───────────────────────── reloj + pomodoro ─────────────────────────
const P = Object.assign({ modo: 'reloj', fase: 'foco', corriendo: false, fin: null, restante: null, ciclos: 0 }, ls.json('sec.pomo', {}));
const guardarP = () => ls.set('sec.pomo', JSON.stringify(P));
const cfgP = () => S.estado?.config?.pomodoro || { foco: 25, descanso: 5, largo: 15, cada: 4 };
const durFase = () => ({ foco: cfgP().foco, descanso: cfgP().descanso, largo: cfgP().largo }[P.fase]);
const NOMBRE_FASE = { foco: 'Foco', descanso: 'Descanso', largo: 'Descanso largo' };

function htmlReloj() {
  const pomo = P.modo === 'pomo';
  return `<div class="modos"><button class="${!pomo ? 'on' : ''}" data-a="reloj">Reloj</button><button class="${pomo ? 'on' : ''}" data-a="pomo">Pomodoro</button></div>
    <button class="icono ruido ${ruido ? 'on' : ''}" data-a="ruido" title="Ruido suave para concentrarte">${I.ola}</button>
    <div class="anillo-reloj ${P.fase !== 'foco' ? 'descanso' : ''}">
      <svg width="220" height="220" viewBox="0 0 220 220"><circle class="pista" cx="110" cy="110" r="104" fill="none" stroke-width="5"/>
        <circle class="prog" id="pomo-prog" cx="110" cy="110" r="104" fill="none" stroke-width="5" stroke-linecap="round" stroke-dasharray="653.5" stroke-dashoffset="${pomo ? 653.5 : 653.5}"/></svg>
      <div><div class="hora" id="hora"></div><div class="hora-sub" id="hora-sub"></div></div>
    </div>
    ${pomo ? `<div class="pomo-ctrl">
      <button class="icono" data-a="pomo-reset" title="Reiniciar">${I.reset}</button>
      <button class="icono principal" data-a="pomo-play" title="${P.corriendo ? 'Pausar' : 'Empezar'}">${P.corriendo ? I.pausa : I.play}</button>
      <button class="icono" data-a="pomo-saltar" title="Saltar fase">${I.saltar}</button></div>` : ''}`;
}

function pintarReloj(rehacer = false) {
  const cont = $('#reloj');
  if (!cont) return;
  if (rehacer || !cont.querySelector('#hora')) cont.innerHTML = htmlReloj();
  const ahora = new Date();
  const hora = $('#hora'), sub = $('#hora-sub'), prog = $('#pomo-prog');
  const C = 653.5;
  if (P.modo === 'pomo') {
    const total = durFase() * 60000;
    const resta = P.corriendo ? Math.max(0, P.fin - Date.now()) : P.restante ?? total;
    if (P.corriendo && resta <= 0) return terminarFase(true);
    const m = Math.floor(resta / 60000), s = Math.floor((resta % 60000) / 1000);
    hora.innerHTML = `${N.pad(m)}:${N.pad(s)}`;
    sub.textContent = `${NOMBRE_FASE[P.fase]} · ciclo ${(P.ciclos % cfgP().cada) + 1}/${cfgP().cada} · ${N.pad(ahora.getHours())}:${N.pad(ahora.getMinutes())}`;
    prog.style.strokeDashoffset = C * (resta / total);
    document.title = P.corriendo ? `${N.pad(m)}:${N.pad(s)} · ${NOMBRE_FASE[P.fase]}` : 'Secretario';
  } else {
    hora.innerHTML = `${N.pad(ahora.getHours())}:${N.pad(ahora.getMinutes())}<small>${N.pad(ahora.getSeconds())}</small>`;
    sub.textContent = fechaLarga(ahora);
    const seg = ahora.getSeconds() + ahora.getMilliseconds() / 1000;
    prog.style.transition = seg < 1 ? 'none' : '';
    prog.style.strokeDashoffset = C * (1 - seg / 60);
    document.title = 'Secretario';
  }
}

function terminarFase(sonar) {
  if (sonar) campana();
  if (P.fase === 'foco') {
    P.ciclos++;
    P.fase = P.ciclos % cfgP().cada === 0 ? 'largo' : 'descanso';
    if (sonar) { toast('¡Tiempo! Tomate un descanso.'); notificar('Terminó el foco', 'Tomate un descanso 🌿'); }
  } else {
    P.fase = 'foco';
    if (sonar) { toast('Volvemos al foco.'); notificar('Terminó el descanso', 'Volvemos al foco'); }
  }
  P.corriendo = false; P.restante = null; P.fin = null;
  guardarP(); pintarReloj(true);
}

function campana() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[660, 0], [880, 0.35], [990, 0.7]].forEach(([f, t]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      g.gain.setValueAtTime(0, ctx.currentTime + t);
      g.gain.linearRampToValueAtTime(0.22, ctx.currentTime + t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 1.6);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 1.7);
    });
    setTimeout(() => ctx.close(), 3000);
  } catch {}
}
function pedirNotif() { try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch {} }
function notificar(t, b) { try { if (document.hidden && Notification.permission === 'granted') new Notification(t, { body: b }); } catch {} }

let ruido = null;
function toggleRuido() {
  if (ruido) {
    const r = ruido; ruido = null;
    r.g.gain.linearRampToValueAtTime(0, r.ctx.currentTime + 0.8);
    setTimeout(() => r.ctx.close(), 900);
  } else {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const len = ctx.sampleRate * 6, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 800;
    const g = ctx.createGain(); g.gain.value = 0; g.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 2.5);
    src.connect(f).connect(g).connect(ctx.destination); src.start();
    ruido = { ctx, g };
  }
  pintarReloj(true);
}

// ───────────────────────── login ─────────────────────────
function vistaLogin(error = '') {
  $('#app').innerHTML = `<div class="login"><div class="card">
    <h1>Secretario</h1>
    <p class="suave">Esta página es privada. Para entrar, pegá tu llave de GitHub (solo la primera vez en cada dispositivo).</p>
    <form id="login" class="campos" style="margin-top:16px">
      <label class="campo"><span>Llave (token de GitHub)</span><input type="password" name="token" required autocomplete="current-password" placeholder="github_pat_…"></label>
      <label class="campo"><span>Repo de datos</span><input type="text" name="repo" value="${esc(GH.repo)}"></label>
      ${error ? `<div class="error">${esc(error)}</div>` : ''}
      <button class="btn primario" type="submit">Entrar</button>
    </form>
    <details><summary>¿Cómo saco la llave?</summary><ol>
      <li>Entrá a <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">github.com → Fine-grained token</a>.</li>
      <li>Nombre: <i>Secretario</i>. Vencimiento: el más largo que te deje.</li>
      <li>Repository access → <b>Only select repositories</b> → <b>Secretario-datos</b>.</li>
      <li>Permissions → Repository → <b>Contents: Read and write</b>.</li>
      <li>Generá el token, copialo y pegalo acá. Queda guardado solo en este navegador.</li>
    </ol></details>
  </div></div>`;
  $('#login').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    ls.set('sec.token', fd.get('token').trim());
    ls.set('sec.repo', fd.get('repo').trim() || REPO_DEF);
    $('#app').innerHTML = '<div class="cargando"><div class="punto"></div></div>';
    cargar(true);
  });
}

// ───────────────────────── arranque ─────────────────────────
function iniciar() {
  if (!GH.token) return vistaLogin();
  const cache = ls.json('sec.cache');
  if (cache?.estado) {
    S.estado = N.asegurarEstado(cache.estado); S.sha = cache.sha; S.cal = cache.cal; S.briefing = cache.briefing; S.corrida = cache.corrida; S.sucio = !!cache.sucio;
    render();
  }
  cargar(true);
  setInterval(() => pintarReloj(), 1000);
  setInterval(() => { if (!document.hidden) cargar(); }, 5 * 60000);
  let ultimoDia = N.diaStr(new Date());
  setInterval(() => { const d = N.diaStr(new Date()); if (d !== ultimoDia) { ultimoDia = d; render(); } }, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) cargar(); });
}
iniciar();
