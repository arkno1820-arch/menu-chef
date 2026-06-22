// CONFIGURACIÓN CENTRAL ENLAZADA DE FORMA TRANSPARENTE
const WEB_APP_URL = "https://script.google.com/macros/library/d/1xBUgrAIXkqtWHWowAQHXfrMpLPuQgAZPgV7r55Q5vL0ealSWtxKcw3Xf/13"; 
const CONTRASEÑA_ADMIN = "canela2014"; 

let votoSeleccionado = null;
let currentMenuId = null;

const vistaComensal = document.getElementById('vistaComensal');
const vistaAdmin = document.getElementById('vistaAdmin');
const btnLike = document.getElementById('btnLike');
const btnDislike = document.getElementById('btnDislike');
const btnOmitir = document.getElementById('btnOmitir');
const lblSeleccion = document.getElementById('lblSeleccion');
const btnGuardar = document.getElementById('btnGuardar');
const lnkAccesoAdmin = document.getElementById('lnkAccesoAdmin');
const btnVolver = document.getElementById('btnVolver');
const btnLimpiar = document.getElementById('btnLimpiar');
const btnBorrarTodo = document.getElementById('btnBorrarTodo');
const listaHistorial = document.getElementById('listaHistorial');

// Elementos del espacio de comentario/sugerencia del comensal
const comentarioBox = document.getElementById('comentarioBox');
const txtComentario = document.getElementById('txtComentario');
const contadorPalabras = document.getElementById('contadorPalabras');
const MAX_PALABRAS_COMENTARIO = 120;

// Contenedor de votación (para ocultarlo cuando ya votó)
const contenidoVotacion = document.getElementById('contenidoVotacion');

// Si localmente ya sabemos que votó por algún menú, ocultamos la votación preventivamente para evitar parpadeos
if (localStorage.getItem('ultimoMenuVotado') && contenidoVotacion && btnGuardar) {
  contenidoVotacion.style.display = 'none';
  btnGuardar.style.display = 'none';
}

// Elementos del panel de administrador
const cajaSugerencias = document.getElementById('cajaSugerencias');
const listaSugerencias = document.getElementById('listaSugerencias');
const tortaNativa = document.getElementById('tortaNativa');
const pctLike = document.getElementById('pctLike');
const pctDislike = document.getElementById('pctDislike');
const pctSkip = document.getElementById('pctSkip');
const cantLike = document.getElementById('cantLike');
const cantDislike = document.getElementById('cantDislike');
const cantSkip = document.getElementById('cantSkip');
const totalVotosTxt = document.getElementById('totalVotos');

const botones = [
 { elemento: btnLike, valor: 'Me gustó' },
 { elemento: btnDislike, valor: 'No me gustó' },
 { elemento: btnOmitir, valor: 'Omito comentario' }
];

// Evita inyección HTML en el panel admin
function escapeHtml(texto) {
 const div = document.createElement('div');
 div.textContent = texto;
 return div.innerHTML;
}

// ======================
// CONTROL DE NAVEGADORES INTERNOS (WhatsApp, Instagram, Lectores QR, etc.)
// ======================
function detectarNavegadorInterno() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  
  // 1. Detección por firmas de aplicaciones conocidas
  const appRegex = /(Instagram|FBAN|FBIOS|FBAV|Messenger|WhatsApp|Telegram|Twitter|TikTok|Line|Snapchat)/i;
  if (appRegex.test(ua)) return true;
  
  // 2. Detección en Android: Todos los WebViews contienen "wv" o "WebView"
  const isAndroid = /Android/i.test(ua);
  if (isAndroid && (/wv/i.test(ua) || /WebView/i.test(ua))) {
    return true;
  }
  
  // 3. Detección en iOS: Si no es el navegador nativo (Safari) ni Chrome/Firefox/Edge de iOS,
  // y se abre desde un visor interno (no tiene "Safari" en el UA o no es standalone)
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  if (isIOS) {
    const isSafari = /Safari/i.test(ua) && !/CriOS/i.test(ua) && !/FxiOS/i.test(ua) && !/EdgiOS/i.test(ua);
    const isCommonIOSBrowser = /CriOS|FxiOS|EdgiOS|OptiOS/i.test(ua);
    
    if (!isSafari && !isCommonIOSBrowser) {
      return true;
    }
  }
  
  return false;
}

function manejarNavegadorInterno() {
  if (!detectarNavegadorInterno()) return;

  const currentUrl = window.location.href;
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isAndroid) {
    // Redirigir al navegador nativo usando intent://
    const urlWithoutProtocol = currentUrl.replace(/^https?:\/\//, '');
    const intentUrl = `intent://${urlWithoutProtocol}#Intent;scheme=https;action=android.intent.action.VIEW;end`;
    window.location.href = intentUrl;
  } else if (isIOS) {
    // Mostrar overlay en el DOM cuando esté listo
    document.addEventListener("DOMContentLoaded", () => {
      const overlay = document.getElementById('inAppBrowserOverlay');
      const txtLink = document.getElementById('txtLinkCopiar');
      const btnCopiar = document.getElementById('btnCopiarLink');

      if (overlay) overlay.style.display = 'flex';
      if (txtLink) txtLink.value = currentUrl;

      if (btnCopiar && txtLink) {
        btnCopiar.addEventListener('click', () => {
          txtLink.select();
          txtLink.setSelectionRange(0, 99999);
          try {
            navigator.clipboard.writeText(currentUrl).then(() => {
              btnCopiar.textContent = "¡Copiado! ✓";
              btnCopiar.style.background = "#10b981";
              setTimeout(() => {
                btnCopiar.textContent = "Copiar Enlace";
                btnCopiar.style.background = "";
              }, 2000);
            }).catch(() => {
              document.execCommand('copy');
              btnCopiar.textContent = "¡Copiado! ✓";
              btnCopiar.style.background = "#10b981";
              setTimeout(() => {
                btnCopiar.textContent = "Copiar Enlace";
                btnCopiar.style.background = "";
              }, 2000);
            });
          } catch (err) {
            console.error("Error al copiar enlace", err);
          }
        });
      }
    });
  }
}

// Ejecutar inmediatamente
manejarNavegadorInterno();

// ======================
// UTILS DE COOKIES Y DOBLE PERSISTENCIA DE ID DE DISPOSITIVO
// ======================
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
}

function obtenerIdDispositivo() {
  let idLocal = localStorage.getItem('idDispositivoRancho');
  let idCookie = getCookie('idDispositivoRancho');
  let id = idLocal || idCookie;

  if (!id) {
    id = (window.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : ('disp_' + Date.now() + '_' + Math.random().toString(36).slice(2));
  }

  // Sincronizar almacenamiento local y cookies
  if (localStorage.getItem('idDispositivoRancho') !== id) {
    localStorage.setItem('idDispositivoRancho', id);
  }
  if (getCookie('idDispositivoRancho') !== id) {
    setCookie('idDispositivoRancho', id, 365);
  }

  return id;
}
const idDispositivo = obtenerIdDispositivo();

// ======================
// BLOQUEO DE VOTO MÚLTIPLE
// ======================

// Función para mostrar agradecimiento y OCULTAR TODO el contenido de votación
function mostrarAgradecimiento() {
 const tarjetaVotacion = document.querySelector('#vistaComensal .card');
 if (!tarjetaVotacion) return;
 
 if (contenidoVotacion) contenidoVotacion.style.display = 'none';
 if (btnGuardar) btnGuardar.style.display = 'none';
 
 tarjetaVotacion.innerHTML = `
 <div style="padding: 20px 0; text-align: center;">
 <h2 style="color: #fef08a; font-size: 1.4rem; font-weight: 700;">¡Gracias por tu participación!</h2>
 <p style="color: #94a3b8; margin-top: 12px; font-size: 0.95rem;">
 Tu opinión sobre el menú de hoy ya ha sido registrada correctamente.
 </p>
 <p style="color: #64748b; margin-top: 16px; font-size: 0.85rem;">
 Tu participación ha quedado registrada para este turno.
 </p>
 </div>
 `;
}

// Verificar estado del voto al cargar la página
async function verificarEstadoVoto() {
 try {
   const respuesta = await fetch(`${WEB_APP_URL}?accion=leer`);
   const datos = await respuesta.json();
   currentMenuId = datos.menuId || "1";
   const ultimoMenuVotado = localStorage.getItem('ultimoMenuVotado');

   if (ultimoMenuVotado === currentMenuId) {
     mostrarAgradecimiento();
   } else {
     if (contenidoVotacion) contenidoVotacion.style.display = 'block';
     if (btnGuardar) btnGuardar.style.display = 'block';
     
     votoSeleccionado = null;
     if (lblSeleccion) lblSeleccion.textContent = 'Ninguna';
     botones.forEach(b => { if (b.elemento) b.elemento.classList.remove('active'); });
     if (comentarioBox) comentarioBox.style.display = 'none';
     if (txtComentario) txtComentario.value = '';
     if (contadorPalabras) contadorPalabras.textContent = '0';
   }
 } catch (e) {
   console.error("Error al verificar estado del voto:", e);
   
   const ultimoMenuVotado = localStorage.getItem('ultimoMenuVotado');
   if (ultimoMenuVotado) {
     mostrarAgradecimiento();
   } else {
     if (contenidoVotacion) contenidoVotacion.style.display = 'block';
     if (btnGuardar) btnGuardar.style.display = 'block';
   }
 }
}

// ======================
// EVENTOS DE LOS BOTONES DE VOTO
// ======================
botones.forEach(item => {
 if (item.elemento) {
   item.elemento.addEventListener('click', () => {
     const ultimoMenuVotado = localStorage.getItem('ultimoMenuVotado');
     if (ultimoMenuVotado === currentMenuId && currentMenuId !== null) {
       alert("Ya has votado en este turno. No puedes cambiar tu voto.");
       return;
     }
     
     votoSeleccionado = item.valor;
     if (lblSeleccion) lblSeleccion.textContent = item.valor;
     botones.forEach(b => { if (b.elemento) b.elemento.classList.remove('active'); });
     item.elemento.classList.add('active');
     
     if (item.valor === 'Me gustó') {
       if (comentarioBox) comentarioBox.style.display = 'none';
       if (txtComentario) txtComentario.value = '';
       if (contadorPalabras) contadorPalabras.textContent = '0';
     } else {
       if (comentarioBox) comentarioBox.style.display = 'block';
     }
   });
 }
});

// ======================
// CONTADOR DE PALABRAS
// ======================
if (txtComentario) {
 txtComentario.addEventListener('input', () => {
   let palabras = txtComentario.value.trim().split(/\s+/).filter(Boolean);
   if (palabras.length > MAX_PALABRAS_COMENTARIO) {
     txtComentario.value = palabras.slice(0, MAX_PALABRAS_COMENTARIO).join(' ');
     palabras = palabras.slice(0, MAX_PALABRAS_COMENTARIO);
   }
   if (contadorPalabras) {
     contadorPalabras.textContent = palabras.length;
     contadorPalabras.parentElement.classList.toggle('limite', palabras.length >= MAX_PALABRAS_COMENTARIO);
   }
 });
}

// ======================
// BOTÓN GUARDAR VOTO
// ======================
if (btnGuardar) {
 btnGuardar.addEventListener('click', async () => {
   const ultimoMenuVotado = localStorage.getItem('ultimoMenuVotado');
   if (ultimoMenuVotado === currentMenuId && currentMenuId !== null) {
     alert("Ya has votado en este turno. No se permiten votos múltiples.");
     mostrarAgradecimiento();
     return;
   }
   
   if (!votoSeleccionado) {
     alert("Por favor, selecciona una opción.");
     return;
   }
   
   const comentarioTexto = (votoSeleccionado !== 'Me gustó' && txtComentario) ? txtComentario.value.trim() : '';
   
   btnGuardar.disabled = true;
   btnGuardar.textContent = "Enviando...";
   botones.forEach(b => { if (b.elemento) b.elemento.style.pointerEvents = 'none'; });
   
   try {
     const respuestaGuardar = await fetch(WEB_APP_URL, {
       method: 'POST',
       headers: { 'Content-Type': 'text/plain;charset=utf-8' },
       body: JSON.stringify({ 
         accion: 'votar', 
         opcion: votoSeleccionado, 
         comentario: comentarioTexto,
         dispositivo: idDispositivo
       })
     });

     let resultado = null;
     try { resultado = await respuestaGuardar.json(); } catch (_) { /* backend puede no devolver JSON */ }

     if (resultado && resultado.success === false) {
       // El servidor dice que este dispositivo YA votó en este turno (bloqueo real, no solo local).
       // Sincronizamos el estado local para reflejar la realidad del servidor.
       localStorage.setItem('ultimoMenuVotado', currentMenuId || "1");
       alert(resultado.error || "Ya has votado en este turno.");
       mostrarAgradecimiento();
       return;
     }
     
     localStorage.setItem('ultimoMenuVotado', currentMenuId || "1");
     
     alert("¡Tu opinión ha sido registrada!");
     window.location.reload();
   } catch (error) {
     console.error("Error al guardar voto:", error);
     alert("Error de envío. Por favor, intenta nuevamente.");
     btnGuardar.disabled = false;
     btnGuardar.textContent = "Enviar Voto";
     botones.forEach(b => { if (b.elemento) b.elemento.style.pointerEvents = 'auto'; });
   }
 });
}

// ======================
// ACCESO ADMINISTRADOR
// ======================
if (lnkAccesoAdmin) {
 lnkAccesoAdmin.addEventListener('click', () => {
   const clave = prompt("Introduce la contraseña:");
   if (clave === CONTRASEÑA_ADMIN) {
     if (vistaComensal) vistaComensal.style.display = 'none';
     if (vistaAdmin) vistaAdmin.style.display = 'block';
     obtenerResultadosServidor();
   } else if (clave !== null) {
     alert("Incorrecta.");
   }
 });
}

if (btnVolver) {
 btnVolver.addEventListener('click', () => {
   window.location.reload();
 });
}

// ======================
// OBTENER RESULTADOS (Panel Admin)
// ======================
async function obtenerResultadosServidor() {
 try {
   if (listaHistorial) {
     listaHistorial.innerHTML = `<p style="color:#94a3b8; font-size:0.9rem; text-align:center;">Cargando historial...</p>`;
   }
   
   const respuesta = await fetch(`${WEB_APP_URL}?accion=leer`);
   const datos = await respuesta.json();
   
   const vLike = datos['Me gustó'] || 0;
   const vDislike = datos['No me gustó'] || 0;
   const vSkip = datos['Omito comentario'] || 0;
   const total = vLike + vDislike + vSkip;
   
   if (cantLike) cantLike.textContent = vLike;
   if (cantDislike) cantDislike.textContent = vDislike;
   if (cantSkip) cantSkip.textContent = vSkip;
   if (totalVotosTxt) totalVotosTxt.textContent = total;

   const pLike = total > 0 ? (vLike / total) * 100 : 0;
   const pDislike = total > 0 ? (vDislike / total) * 100 : 0;
   const pSkip = total > 0 ? (vSkip / total) * 100 : 0;

   if (pctLike) pctLike.textContent = `${pLike.toFixed(1)}%`;
   if (pctDislike) pctDislike.textContent = `${pDislike.toFixed(1)}%`;
   if (pctSkip) pctSkip.textContent = `${pSkip.toFixed(1)}%`;

   if (tortaNativa) {
     const colorLike = '#4ade80';
     const colorDislike = '#f87171';
     const colorSkip = '#94a3b8';
     tortaNativa.style.background = total > 0
       ? `conic-gradient(${colorLike} 0% ${pLike}%, ${colorDislike} ${pLike}% ${pLike + pDislike}%, ${colorSkip} ${pLike + pDislike}% 100%)`
       : '#334155';
   }
   
   const sugerenciasTurno = datos.sugerencias || [];

   // Sugerencias del turno ACTUAL (el backend guarda el texto en la propiedad "texto", no "comentario")
   if (cajaSugerencias && listaSugerencias) {
     if (sugerenciasTurno.length > 0) {
       cajaSugerencias.style.display = 'block';
       listaSugerencias.innerHTML = sugerenciasTurno.map(s => `
         <div class="suggestion-item">
           <span class="suggestion-tag ${s.opcion === 'No me gustó' ? 'dislike' : 'skip'}">
             ${s.opcion === 'No me gustó' ? '👎' : '💬'}
           </span>
           <p class="suggestion-text">${escapeHtml(s.texto || '(sin comentario)')}</p>
         </div>
       `).join('');
     } else {
       cajaSugerencias.style.display = 'none';
       listaSugerencias.innerHTML = '';
     }
   }

   // Historial de turnos PASADOS (no el turno actual)
   const historialTurnos = datos.historial || [];
   if (listaHistorial) {
     if (historialTurnos.length > 0) {
       listaHistorial.innerHTML = historialTurnos.map(turno => {
         const sugerenciasHtml = (turno.sugerencias || []).map(s => `
           <div class="suggestion-item">
             <span class="suggestion-tag ${s.opcion === 'No me gustó' ? 'dislike' : 'skip'}">
               ${s.opcion === 'No me gustó' ? '👎' : '💬'}
             </span>
             <p class="suggestion-text">${escapeHtml(s.texto || '(sin comentario)')}</p>
           </div>
         `).join('');

         return `
           <div class="suggestion-item" style="flex-direction:column; align-items:flex-start; gap:6px;">
             <strong style="color:#fef08a;">${escapeHtml(String(turno.fecha || ''))}</strong>
             <span style="color:#94a3b8; font-size:0.85rem;">
               👍 ${turno['Me gustó'] || 0} &nbsp; 👎 ${turno['No me gustó'] || 0} &nbsp; 🤫 ${turno['Omito comentario'] || 0} &nbsp; Total: ${turno.total || 0}
             </span>
             ${sugerenciasHtml}
           </div>
         `;
       }).join('');
     } else {
       listaHistorial.innerHTML = `<p style="color:#94a3b8; font-size:0.9rem; text-align:center;">Aún no hay turnos cerrados en el historial.</p>`;
     }
   }
 } catch (error) {
   console.error("Error al obtener resultados:", error);
   if (listaHistorial) {
     listaHistorial.innerHTML = `<p style="color:#f87171; font-size:0.9rem; text-align:center;">No se pudieron cargar los resultados. Intenta nuevamente.</p>`;
   }
 }
}

// ======================
// CERRAR RANCHO Y REINICIAR (archiva el turno actual y empieza uno nuevo)
// ======================
if (btnLimpiar) {
 btnLimpiar.addEventListener('click', async () => {
   const confirmar = confirm("¿Cerrar el rancho actual? Los votos y sugerencias de este turno se guardarán en el historial y comenzará un turno nuevo.");
   if (!confirmar) return;

   const textoOriginal = btnLimpiar.textContent;
   btnLimpiar.disabled = true;
   btnLimpiar.textContent = "Cerrando...";

   try {
     const resp = await fetch(WEB_APP_URL, {
       method: 'POST',
       headers: { 'Content-Type': 'text/plain;charset=utf-8' },
       body: JSON.stringify({ accion: 'limpiar' })
     });
     let resultado = null;
     try { resultado = await resp.json(); } catch (_) {}
     if (resultado && resultado.success === false) {
       throw new Error(resultado.error || 'El servidor rechazó la acción.');
     }
     alert("Rancho cerrado. Comenzó un nuevo turno.");
     obtenerResultadosServidor();
   } catch (error) {
     console.error("Error al cerrar rancho:", error);
     alert("No se pudo cerrar el rancho. Intenta nuevamente.");
   } finally {
     btnLimpiar.disabled = false;
     btnLimpiar.textContent = textoOriginal;
   }
 });
}

// ======================
// ELIMINAR HISTORIAL COMPLETO (acción destructiva e irreversible)
// ======================
if (btnBorrarTodo) {
 btnBorrarTodo.addEventListener('click', async () => {
   const confirmar = confirm("¿ELIMINAR PERMANENTEMENTE todo el historial y reiniciar el sistema? Esta acción no se puede deshacer.");
   if (!confirmar) return;

   const textoOriginal = btnBorrarTodo.textContent;
   btnBorrarTodo.disabled = true;
   btnBorrarTodo.textContent = "Borrando...";

   try {
     const resp = await fetch(WEB_APP_URL, {
       method: 'POST',
       headers: { 'Content-Type': 'text/plain;charset=utf-8' },
       body: JSON.stringify({ accion: 'borrar_todo_sistema' })
     });
     let resultado = null;
     try { resultado = await resp.json(); } catch (_) {}
     if (resultado && resultado.success === false) {
       throw new Error(resultado.error || 'El servidor rechazó la acción.');
     }
     alert("Historial eliminado correctamente.");
     obtenerResultadosServidor();
   } catch (error) {
     console.error("Error al borrar historial:", error);
     alert("No se pudo borrar el historial. Intenta nuevamente.");
   } finally {
     btnBorrarTodo.disabled = false;
     btnBorrarTodo.textContent = textoOriginal;
   }
 });
}

// ======================
// INICIO: se ejecuta al cargar el script
// ======================
verificarEstadoVoto();
