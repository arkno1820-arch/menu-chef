// CONFIGURACIÓN CENTRAL ENLAZADA DE FORMA TRANSPARENTE
const WEB_APP_URL = "https://script.google.com/macros/library/d/1xBUgrAIXkqtWHWowAQHXfrMpLPuQgAZPgV7r55Q5vL0ealSWtxKcw3Xf/13"; 
const CONTRASEÑA_ADMIN = "canela2014"; 

let votoSeleccionado = null;
let currentMenuId = null;

// Elementos de la interfaz (Acoplados exactamente a tu HTML original)
const vistaComensal = document.getElementById('vistaComensal');
const vistaAdmin = document.getElementById('vistaAdmin');
const cargandoInicial = document.getElementById('cargandoInicial');
const contenidoVotacion = document.getElementById('contenidoVotacion');

const btnLike = document.getElementById('btnLike');
const btnDislike = document.getElementById('btnDislike');
const btnOmitir = document.getElementById('btnOmitir');
const lblSeleccion = document.getElementById('lblSeleccion');
const btnGuardar = document.getElementById('btnGuardar');

const comentarioBox = document.getElementById('comentarioBox');
const txtComentario = document.getElementById('txtComentario');
const contadorPalabras = document.getElementById('contadorPalabras');
const MAX_PALABRAS_COMENTARIO = 120;

const lnkAccesoAdmin = document.getElementById('lnkAccesoAdmin');
const btnVolver = document.getElementById('btnVolver');
const btnLimpiar = document.getElementById('btnLimpiar');
const btnBorrarTodo = document.getElementById('btnBorrarTodo');
const listaHistorial = document.getElementById('listaHistorial');
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

// Mapeo estricto con los valores de tus botones HTML
const botones = [
 { elemento: btnLike, valor: '👍 Me gustó' },
 { elemento: btnDislike, valor: '👎 No me gustó' },
 { elemento: btnOmitir, valor: '🤫 Omito comentario' }
];

function escapeHtml(texto) {
 const div = document.createElement('div');
 div.textContent = texto;
 return div.innerHTML;
}

// Bloquea la pantalla mostrando el mensaje de agradecimiento
function mostrarAgradecimiento() {
 const tarjetaVotacion = document.querySelector('#vistaComensal .card');
 if (!tarjetaVotacion) return;
 
 if (cargandoInicial) cargandoInicial.style.display = 'none';
 if (contenidoVotacion) contenidoVotacion.style.display = 'none';
 
 tarjetaVotacion.innerHTML = `
 <div style="padding: 20px 0; text-align: center;">
 <h2 style="color: #fef08a; font-size: 1.4rem; font-weight: 700;">¡Gracias por tu participación!</h2>
 <p style="color: #94a3b8; margin-top: 12px; font-size: 0.95rem;">
 Tu opinión sobre el menú de hoy ya ha sido registrada correctamente.
 </p>
 <p style="color: #64748b; margin-top: 16px; font-size: 0.85rem;">
 Tu participación ha quedado registrada para este turno en este equipo.
 </p>
 </div>
 `;
}

// Verificar el estado local antes de pintar la pantalla
async function verificarEstadoVoto() {
 try {
   const respuesta = await fetch(`${WEB_APP_URL}?accion=leer`);
   const datos = await respuesta.json();
   currentMenuId = datos.menuId || "1";
   const ultimoMenuVotado = localStorage.getItem('ultimoMenuVotado');
   
   if (cargandoInicial) cargandoInicial.style.display = 'none';

   // Si el ID del turno guardado en el navegador coincide con el del servidor, bloquea
   if (ultimoMenuVotado === currentMenuId) {
     mostrarAgradecimiento();
   } else {
     if (contenidoVotacion) contenidoVotacion.style.display = 'block';
     
     votoSeleccionado = null;
     if (lblSeleccion) lblSeleccion.textContent = 'Ninguna';
     botones.forEach(b => { if (b.elemento) b.elemento.classList.remove('active'); });
     if (comentarioBox) comentarioBox.style.display = 'none';
     if (txtComentario) txtComentario.value = '';
     if (contadorPalabras) contadorPalabras.textContent = '0';
   }
 } catch (e) {
   console.error("Error de red:", e);
   if (cargandoInicial) cargandoInicial.style.display = 'none';
   
   // Si falla internet, el localStorage manda preventivamente
   const ultimoMenuVotado = localStorage.getItem('ultimoMenuVotado');
   if (ultimoMenuVotado) {
     mostrarAgradecimiento();
   } else {
     if (contenidoVotacion) contenidoVotacion.style.display = 'block';
   }
 }
}

// Asignar eventos de clic a los botones de selección
botones.forEach(item => {
 if (item.elemento) {
   item.elemento.addEventListener('click', () => {
     const ultimoMenuVotado = localStorage.getItem('ultimoMenuVotado');
     if (ultimoMenuVotado === currentMenuId && currentMenuId !== null) {
       alert("Ya has votado en este turno.");
       return;
     }
     
     votoSeleccionado = item.valor;
     if (lblSeleccion) lblSeleccion.textContent = item.valor;
     botones.forEach(b => { if (b.elemento) b.elemento.classList.remove('active'); });
     item.elemento.classList.add('active');
     
     // Mostrar caja de comentarios solo si no es "Me gustó"
     if (item.valor === '👍 Me gustó') {
       if (comentarioBox) comentarioBox.style.display = 'none';
       if (txtComentario) txtComentario.value = '';
       if (contadorPalabras) contadorPalabras.textContent = '0';
     } else {
       if (comentarioBox) comentarioBox.style.display = 'block';
     }
   });
 }
});

// Contador de palabras del área de sugerencias
if (txtComentario) {
 txtComentario.addEventListener('input', () => {
   let palabras = txtComentario.value.trim().split(/\s+/).filter(Boolean);
   if (palabras.length > MAX_PALABRAS_COMENTARIO) {
     txtComentario.value = palabras.slice(0, MAX_PALABRAS_COMENTARIO).join(' ');
     palabras = palabras.slice(0, MAX_PALABRAS_COMENTARIO);
   }
   if (contadorPalabras) contadorPalabras.textContent = palabras.length;
 });
}

// Enviar y guardar el voto de forma persistente
if (btnGuardar) {
 btnGuardar.addEventListener('click', async () => {
   const ultimoMenuVotado = localStorage.getItem('ultimoMenuVotado');
   if (ultimoMenuVotado === currentMenuId && currentMenuId !== null) {
     alert("Ya has votado en este turno.");
     return;
   }
   
   if (!votoSeleccionado) {
     alert("Por favor, selecciona una opción.");
     return;
   }
   
   const comentarioTexto = (votoSeleccionado !== '👍 Me gustó' && txtComentario) ? txtComentario.value.trim() : '';
   btnGuardar.disabled = true;
   btnGuardar.textContent = "Enviando...";
   
   try {
     // Normalizamos el voto para que coincida con lo que espera tu Google Sheets original
     let votoLimpio = 'Me gustó';
     if (votoSeleccionado === '👎 No me gustó') votoLimpio = 'No me gustó';
     if (votoSeleccionado === '🤫 Omito comentario') votoLimpio = 'Omito comentario';

     await fetch(WEB_APP_URL, {
       method: 'POST',
       headers: { 'Content-Type': 'text/plain;charset=utf-8' },
       body: JSON.stringify({ accion: 'votar', opcion: votoLimpio, comentario: comentarioTexto })
     });
     
     // Marcamos el turno actual como completado en el disco duro del equipo
     localStorage.setItem('ultimoMenuVotado', currentMenuId || "1");
     alert("¡Tu opinión ha sido registrada!");
     window.location.reload();
   } catch (error) {
     alert("Error de envío. Intenta nuevamente.");
     btnGuardar.disabled = false;
     btnGuardar.textContent = "Enviar Voto";
   }
 });
}

// Acceso al Panel Administrativo
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
 btnVolver.addEventListener('click', () => { window.location.reload(); });
}

// Cargar reportes en el Panel del Chef
async function obtenerResultadosServidor() {
 try {
   if (listaHistorial) listaHistorial.innerHTML = `<p style="color:#94a3b8; text-align:center;">Cargando historial...</p>`;
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
   
   const sugerenciasTurno = datos.sugerencias || [];
   if (sugerenciasTurno.length > 0 && cajaSugerencias && listaSugerencias) {
     cajaSugerencias.style.display = 'block';
     listaSugerencias.innerHTML = sugerenciasTurno.map(s => `
       <div class="suggestion-item" style="margin-bottom:8px; background: rgba(0,0,0,0.2); padding:8px; border-radius:6px; color:#f8fafc;">
         <span>${s.opcion === 'No me gustó' ? '👎' : '🤫'}</span> ${escapeHtml(s.texto)}
       </div>
     `).join('');
   } else if (cajaSugerencias) {
     cajaSugerencias.style.display = 'none';
   }
   
   if (tortaNativa) {
     if (total === 0) {
       tortaNativa.style.background = '#475569';
       if (pctLike) pctLike.textContent = '0%';
       if (pctDislike) pctDislike.textContent = '0%';
       if (pctSkip) pctSkip.textContent = '0%';
     } else {
       const pLike = Math.round((vLike / total) * 100);
       const pDislike = Math.round((vDislike / total) * 100);
       const pSkip = Math.round((vSkip / total) * 100);
       if (pctLike) pctLike.textContent = `${pLike}%`;
