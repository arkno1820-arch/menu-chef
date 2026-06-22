// CONFIGURACIÓN CENTRAL ENLAZADA DE FORMA TRANSPARENTE
const WEB_APP_URL = "https://script.google.com/macros/library/d/1xBUgrAIXkqtWHWowAQHXfrMpLPuQgAZPgV7r55Q5vL0ealSWtxKcw3Xf/13"; 
const CLAVE_ADMIN = "canela2014"; // Corregido: Sin letra Ñ para evitar caídas de script

let votoSeleccionado = null;
let currentMenuId = null;

// Captura de elementos con validación segura
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

function escapeHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

// Bloquea la pantalla mostrando el mensaje de agradecimiento original
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

// Verificar estado inicial liberando siempre la pantalla de carga
async function verificarEstadoVoto() {
    try {
        const respuesta = await fetch(`${WEB_APP_URL}?accion=leer`);
        const datos = await respuesta.json();
        currentMenuId = datos.menuId || "1";
        const ultimoMenuVotado = localStorage.getItem('ultimoMenuVotado');
        
        // Apagamos la pantalla de carga obligatoriamente
        if (cargandoInicial) cargandoInicial.style.display = 'none';

        if (ultimoMenuVotado === currentMenuId) {
            mostrarAgradecimiento();
        } else {
            if (contenidoVotacion) contenidoVotacion.style.display = 'block';
            
            votoSeleccionado = null;
            if (lblSeleccion) lblSeleccion.textContent = 'Ninguna';
            if (btnLike) btnLike.classList.remove('active');
            if (btnDislike) btnDislike.classList.remove('active');
            if (btnOmitir) btnOmitir.classList.remove('active');
            if (comentarioBox) comentarioBox.style.display = 'none';
            if (txtComentario) txtComentario.value = '';
            if (contadorPalabras) contadorPalabras.textContent = '0';
        }
    } catch (e) {
        console.error("Error al cargar datos desde el servidor:", e);
        // Respaldo de seguridad en caso de fallo de red: Apagar carga y validar localmente
        if (cargandoInicial) cargandoInicial.style.display = 'none';
        
        const ultimoMenuVotado = localStorage.getItem('ultimoMenuVotado');
        if (ultimoMenuVotado) {
            mostrarAgradecimiento();
        } else {
            if (contenidoVotacion) contenidoVotacion.style.display = 'block';
        }
    }
}

// Inicializar eventos de clic de forma segura uno a uno
if (btnLike) {
    btnLike.addEventListener('click', () => {
        votoSeleccionado = '👍 Me gustó';
        if (lblSeleccion) lblSeleccion.textContent = votoSeleccionado;
        btnLike.classList.add('active');
        if (btnDislike) btnDislike.classList.remove('active');
        if (btnOmitir) btnOmitir.classList.remove('active');
        if (comentarioBox) comentarioBox.style.display = 'none';
        if (txtComentario) txtComentario.value = '';
        if (contadorPalabras) contadorPalabras.textContent = '0';
    });
}

if (btnDislike) {
    btnDislike.addEventListener('click', () => {
        votoSeleccionado = '👎 No me gustó';
        if (lblSeleccion) lblSeleccion.textContent = votoSeleccionado;
        btnDislike.classList.add('active');
        if (btnLike) btnLike.classList.remove('active');
        if (btnOmitir) btnOmitir.classList.remove('active');
        if (comentarioBox) comentarioBox.style.display = 'block';
    });
}

if (btnOmitir) {
    btnOmitir.addEventListener('click', () => {
        votoSeleccionado = '🤫 Omito comentario';
        if (lblSeleccion) lblSeleccion.textContent = votoSeleccionado;
        btnOmitir.classList.add('active');
        if (btnLike) btnLike.classList.remove('active');
        if (btnDislike) btnDislike.classList.remove('active');
        if (comentarioBox) comentarioBox.style.display = 'block';
    });
}

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
            let votoLimpio = 'Me gustó';
            if (votoSeleccionado === '👎 No me gustó') votoLimpio = 'No me gustó';
            if (votoSeleccionado === '🤫 Omito comentario') votoLimpio = 'Omito comentario';

            await fetch(WEB_APP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ accion: 'votar', opcion: votoLimpio, comentario: comentarioTexto })
            });
            
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

if (lnkAccesoAdmin) {
    lnkAccesoAdmin.addEventListener('click', () => {
        const clave = prompt("Introduce la contraseña:");
        if (clave === CLAVE_ADMIN) {
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
