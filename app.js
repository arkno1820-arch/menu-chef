// CONFIGURACIÓN CENTRAL ENLAZADA DE FORMA TRANSPARENTE
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwfX9YLv3UwcR4ZmIHxyL2Oh1fkqH_z6mNrvBlfI5ZWxBa9teYjwEwJgTH31FI2fBrJsg/exec"; 
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

    // Ocultar completamente el contenedor de votación
    if (contenidoVotacion) contenidoVotacion.style.display = 'none';
    if (btnGuardar) btnGuardar.style.display = 'none';

    // Mostrar mensaje de agradecimiento
    tarjetaVotacion.innerHTML = `
        <div style="padding: 20px 0; text-align: center;">
            <h2 style="color: #fef08a; font-size: 1.4rem; font-weight: 700;">🎉 ¡Gracias por tu participación!</h2>
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
            // YA VOTÓ → ocultar votación y mostrar agradecimiento
            mostrarAgradecimiento();
        } else {
            // NO HA VOTADO → mostrar votación
            if (contenidoVotacion) contenidoVotacion.style.display = 'block';
            if (btnGuardar) btnGuardar.style.display = 'block';
            // Restablecer selección
            votoSeleccionado = null;
            lblSeleccion.textContent = 'Ninguna';
            botones.forEach(b => b.elemento.classList.remove('active'));
            comentarioBox.style.display = 'none';
            if (txtComentario) txtComentario.value = '';
            if (contadorPalabras) contadorPalabras.textContent = '0';
        }
    } catch (e) {
        console.error("Error al verificar estado del voto:", e);
        // En caso de error, mostrar votación por defecto
        if (contenidoVotacion) contenidoVotacion.style.display = 'block';
        if (btnGuardar) btnGuardar.style.display = 'block';
    }
}

// ======================
// EVENTOS DE LOS BOTONES DE VOTO (con verificación de voto previo)
// ======================
botones.forEach(item => {
    if (item.elemento) {
        item.elemento.addEventListener('click', () => {
            // Verificar si ya votó en este turno
            const ultimoMenuVotado = localStorage.getItem('ultimoMenuVotado');
            if (ultimoMenuVotado === currentMenuId) {
                alert("Ya has votado en este turno. No puedes cambiar tu voto.");
                return;
            }

            votoSeleccionado = item.valor;
            lblSeleccion.textContent = item.valor;
            botones.forEach(b => b.elemento.classList.remove('active'));
            item.elemento.classList.add('active');

            // Mostrar/ocultar comentario según opción
            if (item.valor === 'Me gustó') {
                comentarioBox.style.display = 'none';
                if (txtComentario) txtComentario.value = '';
                if (contadorPalabras) contadorPalabras.textContent = '0';
            } else {
                comentarioBox.style.display = 'block';
            }
        });
    }
});

// ======================
// CONTADOR DE PALABRAS (para el comentario)
// ======================
if (txtComentario) {
    txtComentario.addEventListener('input', () => {
        let palabras = txtComentario.value.trim().split(/\s+/).filter(Boolean);
        if (palabras.length > MAX_PALABRAS_COMENTARIO) {
            txtComentario.value = palabras.slice(0, MAX_PALABRAS_COMENTARIO).join(' ');
            palabras = palabras.slice(0, MAX_PALABRAS_COMENTARIO);
        }
        contadorPalabras.textContent = palabras.length;
        contadorPalabras.parentElement.classList.toggle('limite', palabras.length >= MAX_PALABRAS_COMENTARIO);
    });
}

// ======================
// BOTÓN GUARDAR (con verificación de voto previo)
// ======================
btnGuardar.addEventListener('click', async () => {
    // Verificar si ya votó
    const ultimoMenuVotado = localStorage.getItem('ultimoMenuVotado');
    if (ultimoMenuVotado === currentMenuId) {
        alert("Ya has votado en este turno. No se permiten votos múltiples.");
        return;
    }

    if (!votoSeleccionado) {
        alert("Por favor, selecciona una opción.");
        return;
    }

    // El comentario solo se envía si NO es "Me gustó"
    const comentarioTexto = (votoSeleccionado !== 'Me gustó' && txtComentario) ? txtComentario.value.trim() : '';

    btnGuardar.disabled = true;
    btnGuardar.textContent = "Enviando...";
    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ 
                accion: 'votar', 
                opcion: votoSeleccionado, 
                comentario: comentarioTexto 
            })
        });
        localStorage.setItem('ultimoMenuVotado', currentMenuId);
        alert("🎉 ¡Tu opinión ha sido registrada!");
        // Recargar para mostrar el agradecimiento
        window.location.reload();
    } catch (error) {
        alert("Error de envío. Por favor, intenta nuevamente.");
        btnGuardar.disabled = false;
        btnGuardar.textContent = "Enviar Voto";
    }
});

// ======================
// ACCESO ADMINISTRADOR
// ======================
lnkAccesoAdmin.addEventListener('click', () => {
    const clave = prompt("Introduce la contraseña:");
    if (clave === CONTRASEÑA_ADMIN) {
        vistaComensal.style.display = 'none';
        vistaAdmin.style.display = 'block';
        obtenerResultadosServidor();
    } else if (clave !== null) {
        alert("Incorrecta.");
    }
});

btnVolver.addEventListener('click', () => {
    window.location.reload();
});

// ======================
// OBTENER RESULTADOS (Panel Admin)
// ======================
async function obtenerResultadosServidor() {
    try {
        listaHistorial.innerHTML = `<p style="color:#94a3b8; font-size:0.9rem; text-align:center;">Cargando historial...</p>`;

        const respuesta = await fetch(`${WEB_APP_URL}?accion=leer`);
        const datos = await respuesta.json();

        const vLike = datos['Me gustó'] || 0;
        const vDislike = datos['No me gustó'] || 0;
        const vSkip = datos['Omito comentario'] || 0;
        const total = vLike + vDislike + vSkip;

        cantLike.textContent = vLike;
        cantDislike.textContent = vDislike;
        cantSkip.textContent = vSkip;
        totalVotosTxt.textContent = total;

        // Sugerencias del turno actual
        const sugerenciasTurno = datos.sugerencias || [];
        if (sugerenciasTurno.length > 0) {
            cajaSugerencias.style.display = 'block';
            listaSugerencias.innerHTML = sugerenciasTurno.map(s => `
                <div class="suggestion-item">
                    <span class="suggestion-tag ${s.opcion === 'No me gustó' ? 'dislike' : 'skip'}">${s.opcion === 'No me gustó' ? '👎' : '🤫'}</span>
                    ${escapeHtml(s.texto)}
                </div>
            `).join('');
        } else {
            cajaSugerencias.style.display = 'none';
            listaSugerencias.innerHTML = '';
        }

        // Gráfico de torta
        if (total === 0) {
            tortaNativa.style.background = '#475569';
            pctLike.textContent = '0%';
            pctDislike.textContent = '0%';
            pctSkip.textContent = '0%';
        } else {
            const pLike = Math.round((vLike / total) * 100);
            const pDislike = Math.round((vDislike / total) * 100);
            const pSkip = Math.round((vSkip / total) * 100);
            pctLike.textContent = `${pLike}%`;
            pctDislike.textContent = `${pDislike}%`;
            pctSkip.textContent = `${pSkip}%`;
            tortaNativa.style.background = `conic-gradient(#10b981 0% ${pLike}%, #e11d48 ${pLike}% ${pLike+pDislike}%, #475569 ${pLike+pDislike}% 100%)`;
        }

        // Historial de turnos
        listaHistorial.innerHTML = "";
        const historial = datos.historial || [];

        if (historial.length === 0) {
            listaHistorial.innerHTML = `<p style="color:#94a3b8; font-size:0.9rem; text-align:center; padding: 10px 0;">No hay turnos archivados aún.</p>`;
            return;
        }

        historial.forEach((turno, index) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.style.marginBottom = "15px";
            div.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
            div.style.paddingBottom = "10px";

            const sugerenciasDelTurno = turno.sugerencias || [];
            const sugerenciasHtml = sugerenciasDelTurno.length > 0 ? `
                <div class="suggestion-item" style="margin-top:8px; padding-top:8px; border-top:1px dashed rgba(255,255,255,0.08);">
                    <strong style="color:#fef08a; font-size:0.8rem;">💡 Sugerencias:</strong>
                    ${sugerenciasDelTurno.map(s => `<div style="margin-top:4px;">${s.opcion === 'No me gustó' ? '👎' : '🤫'} ${escapeHtml(s.texto)}</div>`).join('')}
                </div>
            ` : '';

            div.innerHTML = `
                <div class="history-date" style="color:#cbd5e1; font-size:0.88rem; font-weight:600; margin-bottom:4px;">Turno #${historial.length - index} — ${turno.fecha}</div>
                <div class="history-stats" style="display:flex; gap:12px; color:#94a3b8; font-size:0.85rem;">
                    <span>👍 ${turno['Me gustó']}</span>
                    <span>👎 ${turno['No me gustó']}</span>
                    <span>🤫 ${turno['Omito comentario']}</span>
                    <span style="font-weight:bold; color:#fef08a; margin-left:auto;">Total: ${turno.total}</span>
                </div>
                ${sugerenciasHtml}
            `;
            listaHistorial.appendChild(div);
        });

    } catch (e) {
        console.error(e);
        listaHistorial.innerHTML = `<p style="color:#f87171; font-size:0.9rem; text-align:center;">Error de conexión con la base de datos.</p>`;
    }
}

// ======================
// CERRAR TURNO (ADMIN)
// ======================
btnLimpiar.addEventListener('click', async () => {
    if (confirm("¿Cerrar el turno actual? Los votos pasarán al historial histórico.")) {
        btnLimpiar.disabled = true;
        btnLimpiar.textContent = "Archivando turno...";
        try {
            await fetch(WEB_APP_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({ accion: 'limpiar' })
            });
            alert("Turno archivado con éxito.");
            localStorage.removeItem('ultimoMenuVotado');
            setTimeout(obtenerResultadosServidor, 1000);
        } catch (e) {
            alert("Error al intentar limpiar el turno.");
        } finally {
            btnLimpiar.disabled = false;
            btnLimpiar.textContent = "Cerrar Rancho y Reiniciar 🗑️";
        }
    }
});

// ======================
// BORRAR HISTORIAL COMPLETO
// ======================
btnBorrarTodo.addEventListener('click', async () => {
    if (confirm("⚠️ ¿Estás COMPLETAMENTE seguro de eliminar TODO el historial y reiniciar el turno actual?")) {
        if (confirm("🚨 ¡ADVERTENCIA CRÍTICA! Esta acción es irreversible y borrará todos los turnos guardados para siempre. ¿Deseas continuar realmente?")) {
            const confirmacionTexto = prompt("Para confirmar el borrado absoluto, escribe la palabra BORRAR en mayúsculas:");
            if (confirmacionTexto === "BORRAR") {
                btnBorrarTodo.disabled = true;
                btnBorrarTodo.textContent = "Destruyendo base de datos...";
                try {
                    await fetch(WEB_APP_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify({ accion: 'borrar_todo_sistema' })
                    });
                    alert("💥 La base de datos histórica ha sido borrada por completo.");
                    localStorage.removeItem('ultimoMenuVotado');
                    localStorage.removeItem('menuIdConocido');
                    setTimeout(obtenerResultadosServidor, 1000);
                } catch (e) {
                    alert("Error en el proceso de borrado completo.");
                } finally {
                    btnBorrarTodo.disabled = false;
                    btnBorrarTodo.textContent = "Eliminar Historial Completo 🚨";
                }
            } else {
                alert("❌ Operación cancelada. La palabra clave no coincide.");
            }
        }
    }
});

// ======================
// INICIAR APLICACIÓN
// ======================
verificarEstadoVoto();
