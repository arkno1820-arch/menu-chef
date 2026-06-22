// ============================================================
// CONFIGURACIÓN CENTRAL
// ============================================================
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwbDzAeJ0bmpw3_kRrSC-HK_m_wDOFXHlVw4W1-TckRKRAhAyqLiYqJ_UpdUMQuznLjEA/exec";
const CONTRASEÑA_ADMIN = "canela2014";

let votoSeleccionado = null;
let currentMenuId = null;
let huellaDispositivo = '';

// ============================================================
// REFERENCIAS AL DOM
// ============================================================
const vistaComensal      = document.getElementById('vistaComensal');
const vistaAdmin         = document.getElementById('vistaAdmin');
const btnLike            = document.getElementById('btnLike');
const btnDislike         = document.getElementById('btnDislike');
const btnOmitir          = document.getElementById('btnOmitir');
const lblSeleccion       = document.getElementById('lblSeleccion');
const btnGuardar         = document.getElementById('btnGuardar');
const lnkAccesoAdmin     = document.getElementById('lnkAccesoAdmin');
const btnVolver          = document.getElementById('btnVolver');
const btnLimpiar         = document.getElementById('btnLimpiar');
const btnBorrarTodo      = document.getElementById('btnBorrarTodo');
const listaHistorial     = document.getElementById('listaHistorial');
const contenidoVotacion  = document.getElementById('contenidoVotacion');
const comentarioBox      = document.getElementById('comentarioBox');
const txtComentario      = document.getElementById('txtComentario');
const contadorPalabras   = document.getElementById('contadorPalabras');
const cajaSugerencias    = document.getElementById('cajaSugerencias');
const listaSugerencias   = document.getElementById('listaSugerencias');
const tortaNativa        = document.getElementById('tortaNativa');
const pctLike            = document.getElementById('pctLike');
const pctDislike         = document.getElementById('pctDislike');
const pctSkip            = document.getElementById('pctSkip');
const cantLike           = document.getElementById('cantLike');
const cantDislike        = document.getElementById('cantDislike');
const cantSkip           = document.getElementById('cantSkip');
const totalVotosTxt      = document.getElementById('totalVotos');
const MAX_PALABRAS       = 120;

const botones = [
  { elemento: btnLike,    valor: 'Me gustó' },
  { elemento: btnDislike, valor: 'No me gustó' },
  { elemento: btnOmitir,  valor: 'Omito comentario' }
];

function escapeHtml(t) {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}

// ============================================================
// DETECCIÓN DE NAVEGADOR INTERNO — EJECUCIÓN SÍNCRONA INMEDIATA
// Se ejecuta antes que cualquier cosa async para evitar flash
// de la UI de votación en WebViews.
// ============================================================
function esNavegadorInterno() {
  const ua = navigator.userAgent || '';

  // Apps conocidas con navegador embebido
  if (/(Instagram|FBAN|FBIOS|FBAV|Messenger|WhatsApp|Telegram|Twitter|TikTok|Line|Snapchat)/i.test(ua)) return true;

  // Android WebView explícito
  if (/Android/i.test(ua) && (/wv\b/i.test(ua) || /WebView/i.test(ua))) return true;

  // iOS — la clave: Safari nativo tiene navigator.standalone definido (true/false).
  // SFSafariViewController y cualquier WebView de app de escaneo QR lo tienen como undefined.
  // Esto detecta correctamente lectores QR, apps de mensajería, etc., aunque su UA parezca Safari.
  if (/iPhone|iPad|iPod/i.test(ua)) {
    // Chrome/Firefox/Edge en iOS tienen su propio identificador → son navegadores nativos
    if (/CriOS|FxiOS|EdgiOS/i.test(ua)) return false;
    // Si standalone es undefined → WebView o SFSafariViewController → mostrar overlay
    if (typeof window.navigator.standalone === 'undefined') return true;
  }

  return false;
}

// Ejecutar la detección INMEDIATAMENTE (síncronamente) al cargar el script,
// antes de que cualquier función async pueda mostrar la UI de votación.
function mostrarOverlay(url, sistema) {
  const overlay        = document.getElementById('inAppBrowserOverlay');
  const mensajeDiv     = document.getElementById('mensajeSistema');
  const txtLink        = document.getElementById('txtLinkCopiar');
  const btnCopiar      = document.getElementById('btnCopiarLink');
  const btnAbrir       = document.getElementById('btnAbrirNavegador');

  if (!overlay) return;

  if (mensajeDiv) {
    const instruccion = sistema === 'ios'
      ? 'Abre la <strong style="color:#fef08a;">cámara nativa de tu iPhone</strong> y escanea el QR desde ahí.'
      : 'Escanea el QR con la <strong style="color:#fef08a;">cámara de tu teléfono</strong>, no con una app de lectura.';
    mensajeDiv.innerHTML = `
      <p style="color:#fca5a5; font-size:0.95rem; font-weight:600;">⚠️ Estás usando un lector QR interno.</p>
      <p style="color:#94a3b8; font-size:0.9rem; margin-top:8px;">${instruccion}</p>`;
  }

  if (txtLink) txtLink.value = url;

  if (btnCopiar) {
    btnCopiar.onclick = () => {
      navigator.clipboard.writeText(url).then(() => {
        btnCopiar.textContent = '¡Copiado! ✓';
        setTimeout(() => { btnCopiar.textContent = '📋 Copiar'; }, 2500);
      }).catch(() => {
        if (txtLink) { txtLink.select(); document.execCommand('copy'); }
        btnCopiar.textContent = '¡Copiado! ✓';
        setTimeout(() => { btnCopiar.textContent = '📋 Copiar'; }, 2500);
      });
    };
  }

  if (btnAbrir) {
    btnAbrir.onclick = () => { window.open(url, '_blank'); };
  }

  overlay.style.display = 'flex';
  document.body.classList.add('no-scroll');
}


(function chequeoInmediato() {
  if (!esNavegadorInterno()) return;

  // Ocultar votación de inmediato para evitar cualquier flash
  const cv = document.getElementById('contenidoVotacion');
  const bg = document.getElementById('btnGuardar');
  if (cv) cv.style.display = 'none';
  if (bg) bg.style.display = 'none';

  const url       = window.location.href;
  const esAndroid = /Android/i.test(navigator.userAgent);
  const esIOS     = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (esAndroid) {
    const urlSinProtocolo = url.replace(/^https?:\/\//, '');
    window.location.href = `intent://${urlSinProtocolo}#Intent;scheme=https;action=android.intent.action.VIEW;end`;
    setTimeout(() => mostrarOverlay(url, 'android'), 1500);
  } else if (esIOS) {
    // DOMContentLoaded para asegurarnos de que el overlay ya existe en el DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => mostrarOverlay(url, 'ios'));
    } else {
      mostrarOverlay(url, 'ios');
    }
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => mostrarOverlay(url, 'otro'));
    } else {
      mostrarOverlay(url, 'otro');
    }
  }
})();

function manejarNavegadorInterno() {
  // Solo se usa en verificarEstadoVoto() como segunda barrera; el trabajo real
  // ya lo hizo chequeoInmediato() de forma síncrona arriba.
  return esNavegadorInterno();
}

// ============================================================
// HUELLA DE DISPOSITIVO (canvas + WebGL + hardware)
// No depende de localStorage: produce el mismo hash en cada
// carga del mismo teléfono físico, incluso en pestañas efímeras.
// ============================================================
async function calcularHuella() {
  try {
    const partes = [];

    // Canvas fingerprint
    try {
      const cv  = document.createElement('canvas');
      cv.width  = 240; cv.height = 50;
      const ctx = cv.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '15px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(0, 0, 240, 50);
      ctx.fillStyle = '#039';
      ctx.fillText('Rancho Naval 🍽️ 2026', 2, 4);
      ctx.strokeStyle = 'rgba(0,200,100,0.6)';
      ctx.beginPath(); ctx.arc(120, 25, 20, 0, Math.PI * 2); ctx.stroke();
      partes.push(cv.toDataURL());
    } catch (_) {}

    // WebGL renderer / vendor (identifica la GPU)
    try {
      const cv2 = document.createElement('canvas');
      const gl  = cv2.getContext('webgl') || cv2.getContext('experimental-webgl');
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          partes.push(gl.getParameter(ext.UNMASKED_VENDOR_WEBGL));
          partes.push(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL));
        }
      }
    } catch (_) {}

    partes.push(`${screen.width}x${screen.height}`);
    partes.push(String(window.devicePixelRatio || 1));
    partes.push(String(navigator.hardwareConcurrency || ''));
    partes.push(navigator.language || '');
    try { partes.push(Intl.DateTimeFormat().resolvedOptions().timeZone || ''); } catch (_) {}
    partes.push(navigator.platform || '');
    // NO incluimos userAgent completo porque cambia entre apps en el mismo teléfono

    const texto = partes.join('|||');

    if (crypto && crypto.subtle) {
      const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Fallback si SubtleCrypto no está (HTTP puro, muy raro)
    let h = 0;
    for (let i = 0; i < texto.length; i++) h = (Math.imul(31, h) + texto.charCodeAt(i)) | 0;
    return 'fb_' + Math.abs(h).toString(16);

  } catch (e) {
    return 'err_' + Date.now();
  }
}

// ============================================================
// MOSTRAR AGRADECIMIENTO (pantalla post-voto)
// ============================================================
function mostrarAgradecimiento() {
  const card = document.querySelector('#vistaComensal .card');
  if (!card) return;
  if (contenidoVotacion) contenidoVotacion.style.display = 'none';
  if (btnGuardar)        btnGuardar.style.display = 'none';
  card.innerHTML = `
    <div style="padding:20px 0; text-align:center;">
      <h2 style="color:#fef08a; font-size:1.4rem; font-weight:700;">¡Gracias por tu participación!</h2>
      <p style="color:#94a3b8; margin-top:12px; font-size:0.95rem;">
        Tu opinión sobre el menú de hoy ya ha sido registrada correctamente.
      </p>
      <p style="color:#64748b; margin-top:16px; font-size:0.85rem;">
        Tu participación ha quedado registrada para este turno.
      </p>
    </div>`;
}

// ============================================================
// VERIFICAR ESTADO DE VOTO AL CARGAR
// ============================================================
async function verificarEstadoVoto() {
  // Paso 1: detectar WebView antes de hacer nada
  if (manejarNavegadorInterno()) return;

  // Paso 2: calcular huella en paralelo con la llamada al servidor
  const [datos, huella] = await Promise.all([
    fetch(`${WEB_APP_URL}?accion=leer`).then(r => r.json()).catch(() => null),
    calcularHuella()
  ]);

  huellaDispositivo = huella;
  currentMenuId     = datos ? (datos.menuId || '1') : null;

  // Bloqueo por localStorage (rápido, primer check)
  const ultimoMenuLocal = localStorage.getItem('ultimoMenuVotado');
  if (currentMenuId && ultimoMenuLocal === currentMenuId) {
    mostrarAgradecimiento();
    return;
  }

  // Si no hay respuesta del servidor, mostrar votación de todas formas
  if (contenidoVotacion) contenidoVotacion.style.display = 'block';
  if (btnGuardar)        btnGuardar.style.display = 'block';

  // Resetear UI de votación
  votoSeleccionado = null;
  if (lblSeleccion)    lblSeleccion.textContent = 'Ninguna';
  botones.forEach(b => b.elemento && b.elemento.classList.remove('active'));
  if (comentarioBox)   comentarioBox.style.display = 'none';
  if (txtComentario)   txtComentario.value = '';
  if (contadorPalabras) contadorPalabras.textContent = '0';
}

// ============================================================
// BOTONES DE VOTO
// ============================================================
botones.forEach(item => {
  if (!item.elemento) return;
  item.elemento.addEventListener('click', () => {
    if (localStorage.getItem('ultimoMenuVotado') === currentMenuId && currentMenuId) {
      alert('Ya has votado en este turno.');
      return;
    }
    votoSeleccionado = item.valor;
    if (lblSeleccion) lblSeleccion.textContent = item.valor;
    botones.forEach(b => b.elemento && b.elemento.classList.remove('active'));
    item.elemento.classList.add('active');

    if (item.valor === 'Me gustó') {
      if (comentarioBox)   comentarioBox.style.display = 'none';
      if (txtComentario)   txtComentario.value = '';
      if (contadorPalabras) contadorPalabras.textContent = '0';
    } else {
      if (comentarioBox) comentarioBox.style.display = 'block';
    }
  });
});

// ============================================================
// CONTADOR DE PALABRAS
// ============================================================
if (txtComentario) {
  txtComentario.addEventListener('input', () => {
    let palabras = txtComentario.value.trim().split(/\s+/).filter(Boolean);
    if (palabras.length > MAX_PALABRAS) {
      txtComentario.value = palabras.slice(0, MAX_PALABRAS).join(' ');
      palabras = palabras.slice(0, MAX_PALABRAS);
    }
    if (contadorPalabras) {
      contadorPalabras.textContent = palabras.length;
      contadorPalabras.parentElement.classList.toggle('limite', palabras.length >= MAX_PALABRAS);
    }
  });
}

// ============================================================
// BOTÓN GUARDAR VOTO
// ============================================================
if (btnGuardar) {
  btnGuardar.addEventListener('click', async () => {
    // Check local rápido
    if (localStorage.getItem('ultimoMenuVotado') === currentMenuId && currentMenuId) {
      mostrarAgradecimiento();
      return;
    }

    if (!votoSeleccionado) {
      alert('Por favor, selecciona una opción.');
      return;
    }

    const comentario = votoSeleccionado !== 'Me gustó' && txtComentario
      ? txtComentario.value.trim() : '';

    btnGuardar.disabled = true;
    btnGuardar.textContent = 'Enviando...';
    botones.forEach(b => { if (b.elemento) b.elemento.style.pointerEvents = 'none'; });

    try {
      const resp = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          accion:       'votar',
          opcion:       votoSeleccionado,
          comentario:   comentario,
          huella:       huellaDispositivo     // bloqueo real en el servidor
        })
      });

      let resultado = null;
      try { resultado = await resp.json(); } catch (_) {}

      if (resultado && resultado.success === false) {
        // El servidor confirma que esta huella ya votó en este turno
        localStorage.setItem('ultimoMenuVotado', currentMenuId || '1');
        alert(resultado.error || 'Ya has votado en este turno.');
        mostrarAgradecimiento();
        return;
      }

      // Voto registrado exitosamente
      localStorage.setItem('ultimoMenuVotado', currentMenuId || '1');
      alert('¡Tu opinión ha sido registrada!');
      window.location.reload();

    } catch (error) {
      console.error('Error al guardar voto:', error);
      alert('Error de envío. Por favor, intenta nuevamente.');
      btnGuardar.disabled = false;
      btnGuardar.textContent = 'Enviar Voto';
      botones.forEach(b => { if (b.elemento) b.elemento.style.pointerEvents = 'auto'; });
    }
  });
}

// ============================================================
// ACCESO ADMINISTRADOR
// ============================================================
if (lnkAccesoAdmin) {
  lnkAccesoAdmin.addEventListener('click', () => {
    const clave = prompt('Introduce la contraseña:');
    if (clave === CONTRASEÑA_ADMIN) {
      if (vistaComensal) vistaComensal.style.display = 'none';
      if (vistaAdmin)    vistaAdmin.style.display = 'block';
      obtenerResultadosServidor();
    } else if (clave !== null) {
      alert('Contraseña incorrecta.');
    }
  });
}

if (btnVolver) {
  btnVolver.addEventListener('click', () => window.location.reload());
}

// ============================================================
// OBTENER RESULTADOS — PANEL ADMIN
// ============================================================
async function obtenerResultadosServidor() {
  if (listaHistorial) {
    listaHistorial.innerHTML = '<p style="color:#94a3b8;font-size:0.9rem;text-align:center;">Cargando historial...</p>';
  }

  try {
    const datos = await fetch(`${WEB_APP_URL}?accion=leer`).then(r => r.json());

    const vL = datos['Me gustó']          || 0;
    const vD = datos['No me gustó']       || 0;
    const vS = datos['Omito comentario']  || 0;
    const total = vL + vD + vS;

    if (cantLike)     cantLike.textContent    = vL;
    if (cantDislike)  cantDislike.textContent = vD;
    if (cantSkip)     cantSkip.textContent    = vS;
    if (totalVotosTxt) totalVotosTxt.textContent = total;

    const pL = total > 0 ? (vL / total) * 100 : 0;
    const pD = total > 0 ? (vD / total) * 100 : 0;
    const pS = total > 0 ? (vS / total) * 100 : 0;

    if (pctLike)    pctLike.textContent    = `${pL.toFixed(1)}%`;
    if (pctDislike) pctDislike.textContent = `${pD.toFixed(1)}%`;
    if (pctSkip)    pctSkip.textContent    = `${pS.toFixed(1)}%`;

    if (tortaNativa) {
      tortaNativa.style.background = total > 0
        ? `conic-gradient(#4ade80 0% ${pL}%, #f87171 ${pL}% ${pL + pD}%, #94a3b8 ${pL + pD}% 100%)`
        : '#334155';
    }

    // Sugerencias turno actual
    const sugerencias = datos.sugerencias || [];
    if (cajaSugerencias && listaSugerencias) {
      if (sugerencias.length > 0) {
        cajaSugerencias.style.display = 'block';
        listaSugerencias.innerHTML = sugerencias.map(s => `
          <div class="suggestion-item">
            <span class="suggestion-tag ${s.opcion === 'No me gustó' ? 'dislike' : 'skip'}">
              ${s.opcion === 'No me gustó' ? '👎' : '💬'}
            </span>
            <p class="suggestion-text">${escapeHtml(s.texto || '(sin comentario)')}</p>
          </div>`).join('');
      } else {
        cajaSugerencias.style.display = 'none';
      }
    }

    // Historial de turnos pasados
    const historial = datos.historial || [];
    if (listaHistorial) {
      if (historial.length > 0) {
        listaHistorial.innerHTML = historial.map(turno => {
          const sugsHtml = (turno.sugerencias || []).map(s => `
            <div class="suggestion-item">
              <span class="suggestion-tag ${s.opcion === 'No me gustó' ? 'dislike' : 'skip'}">
                ${s.opcion === 'No me gustó' ? '👎' : '💬'}
              </span>
              <p class="suggestion-text">${escapeHtml(s.texto || '(sin comentario)')}</p>
            </div>`).join('');

          return `
            <div class="suggestion-item" style="flex-direction:column;align-items:flex-start;gap:6px;">
              <strong style="color:#fef08a;">${escapeHtml(String(turno.fecha || ''))}</strong>
              <span style="color:#94a3b8;font-size:0.85rem;">
                👍 ${turno['Me gustó'] || 0} &nbsp;
                👎 ${turno['No me gustó'] || 0} &nbsp;
                🤫 ${turno['Omito comentario'] || 0} &nbsp;
                Total: ${turno.total || 0}
              </span>
              ${sugsHtml}
            </div>`;
        }).join('');
      } else {
        listaHistorial.innerHTML = '<p style="color:#94a3b8;font-size:0.9rem;text-align:center;">Aún no hay turnos cerrados.</p>';
      }
    }

  } catch (error) {
    console.error('Error al obtener resultados:', error);
    if (listaHistorial) {
      listaHistorial.innerHTML = '<p style="color:#f87171;font-size:0.9rem;text-align:center;">No se pudieron cargar los resultados.</p>';
    }
  }
}

// ============================================================
// CERRAR RANCHO (archiva turno y genera menuId nuevo)
// ============================================================
if (btnLimpiar) {
  btnLimpiar.addEventListener('click', async () => {
    if (!confirm('¿Cerrar el rancho actual? Los votos se guardarán en el historial y comenzará un turno nuevo.')) return;

    const texto = btnLimpiar.textContent;
    btnLimpiar.disabled = true;
    btnLimpiar.textContent = 'Cerrando...';

    try {
      await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ accion: 'limpiar' })
      });
      alert('Rancho cerrado. Comenzó un nuevo turno.');
      obtenerResultadosServidor();
    } catch (e) {
      alert('No se pudo cerrar el rancho. Intenta nuevamente.');
    } finally {
      btnLimpiar.disabled = false;
      btnLimpiar.textContent = texto;
    }
  });
}

// ============================================================
// ELIMINAR HISTORIAL COMPLETO
// ============================================================
if (btnBorrarTodo) {
  btnBorrarTodo.addEventListener('click', async () => {
    if (!confirm('¿ELIMINAR PERMANENTEMENTE todo el historial? Esta acción no se puede deshacer.')) return;

    const texto = btnBorrarTodo.textContent;
    btnBorrarTodo.disabled = true;
    btnBorrarTodo.textContent = 'Borrando...';

    try {
      await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ accion: 'borrar_todo_sistema' })
      });
      alert('Historial eliminado correctamente.');
      obtenerResultadosServidor();
    } catch (e) {
      alert('No se pudo borrar el historial. Intenta nuevamente.');
    } finally {
      btnBorrarTodo.disabled = false;
      btnBorrarTodo.textContent = texto;
    }
  });
}

// ============================================================
// INICIO
// ============================================================
verificarEstadoVoto();
