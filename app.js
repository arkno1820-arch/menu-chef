// CONFIGURACIÓN CENTRAL ENLAZADA DE FORMA TRANSPARENTE
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxE7Mcj3mRKbzYuft89yr2E6VAj-OA9VdUyl2XmMOax8VItxh7nZM6bO2hFhc129TE-/exec"; 
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

// Elemento de carga inicial en HTML
const cargandoInicial = document.getElementById('cargandoInicial');

// Elementos del espacio de comentario/sugerencia del comensal
const comentarioBox = document.getElementById('comentarioBox');
const txtComentario = document.getElementById('txtComentario');
const contadorPalabras = document.getElementById('contadorPalabras');
const MAX_PALABRAS_COMENTARIO = 120;

// Contenedor de votación (para ocultarlo cuando ya votó)
const contenidoVotacion = document.getElementById('contenidoVotacion');

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
// BLOQUEO DE VOTO MÚLTIPLE
// ======================

// Función para mostrar agradecimiento y OCULTAR TODO el contenido de votación
function mostrarAgradecimiento() {
 const tarjetaVotacion = document.querySelector('#vistaComensal .card');
 if (!tarjetaVotacion) return;
 
 // Ocultar el mensaje de carga si sigue visible
 if (cargandoInicial) cargandoInicial.style.display = 'none';
 // Ocultar completamente el contenedor de votación
 if (contenidoVotacion) contenidoVotacion.style.display = 'none';
 if (btnGuardar) btnGuardar.style.display = 'none';
 
 // Mostrar mensaje de agradecimiento
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
   
   // Ocultar indicador de carga siempre que termine el fetch exitosamente
   if (cargandoInicial) cargandoInicial.style.display = 'none';

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
   
   // SEGURIDAD: Ocultamos el indicador de carga pase lo que pase
   if (cargandoInicial) cargandoInicial.style.display = 'none';
   
   // VALIDACIÓN LOCAL ANTI-FRAUDE (Si falla el servidor de Google por red)
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
   // Re-chequeo justo antes de enviar: bloquea doble click, doble pestaña, etc.
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
         comentario: comentarioTexto 
       })
     });

     // Si el backend responde con JSON indicando error explícito, no marcamos el voto como hecho
     let resultado = null;
     try { resultado = await respuestaGuardar.json(); } catch (_) { /* backend puede no devolver JSON */ }
     if (resultado && resultado.success === false) {
       throw new Error(resultado.error || 'El servidor rechazó el voto.');
     }
     
     // Solo al confirmar el envío marcamos este turno como votado
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

   // Porcentajes y gráfico de torta (CSS conic-gradient, sin librerías)
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

   // Caja de sugerencias destacadas (comentarios del turno actual)
   if (cajaSugerencias && listaSugerencias) {
     if (sugerenciasTurno.length > 0) {
       cajaSugerencias.style.display = 'block';
       listaSugerencias.innerHTML = sugerenciasTurno.map(s => `
         <div class="suggestion-item">
           <span class="suggestion-tag ${s.opcion === 'No me gustó' ? 'dislike' : 'skip'}">
             ${s.opcion === 'No me gustó' ? '👎' : '💬'}
           </span>
           <p class="suggestion-text">${escapeHtml(s.comentario || '(sin comentario)')}</p>
         </div>
       `).join('');
     } else {
       cajaSugerencias.style.display = 'none';
       listaSugerencias.innerHTML = '';
     }
   }

   // Historial completo
   if (listaHistorial) {
     if (sugerenciasTurno.length > 0) {
       listaHistorial.innerHTML = sugerenciasTurno.map(s => `
         <div class="suggestion-item">
           <span class="suggestion-tag ${s.opcion === 'No me gustó' ? 'dislike' : 'skip'}">
             ${s.opcion === 'No me gustó' ? '👎' : '💬'}
           </span>
           <p class="suggestion-text">${escapeHtml(s.comentario || '(sin comentario)')}</p>
           ${s.fecha ? `<span class="suggestion-date">${escapeHtml(String(s.fecha))}</span>` : ''}
         </div>
       `).join('');
     } else {
       listaHistorial.innerHTML = `<p style="color:#94a3b8; font-size:0.9rem; text-align:center;">Sin comentarios registrados en este turno.</p>`;
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
// LIMPIAR VISTA DE SUGERENCIAS (solo visual, no borra nada en el servidor)
// ======================
if (btnLimpiar) {
 btnLimpiar.addEventListener('click', () => {
   if (listaSugerencias) listaSugerencias.innerHTML = '';
   if (cajaSugerencias) cajaSugerencias.style.display = 'none';
 });
}

// ======================
// BORRAR TODO EL HISTORIAL (acción destructiva contra el backend)
// ======================
if (btnBorrarTodo) {
 btnBorrarTodo.addEventListener('click', async () => {
   const confirmar = confirm("¿Seguro que deseas borrar TODOS los votos y comentarios registrados? Esta acción no se puede deshacer.");
   if (!confirmar) return;

   const textoOriginal = btnBorrarTodo.textContent;
   btnBorrarTodo.disabled = true;
   btnBorrarTodo.textContent = "Borrando...";

   try {
     await fetch(WEB_APP_URL, {
       method: 'POST',
       headers: { 'Content-Type': 'text/plain;charset=utf-8' },
       body: JSON.stringify({ accion: 'borrarTodo' })
     });
     alert("Historial borrado correctamente.");
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
