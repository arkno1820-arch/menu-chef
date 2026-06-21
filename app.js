// CONFIGURACIÓN CENTRAL ENLAZADA DE FORMA TRANSPARENTE
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxE7Mcj3mRKbzYuft89yr2E6VAj-OA9VdUyl2XmMOax8VItxh7nZM6bO2hFhc129TE-/exec"; 
const CONTRASEÑA_ADMIN = "canela2014"; 

let votoSeleccionado = null;
let currentMenuId = null;
let yaVotoEnEsteTurno = false;

const vistaComensal = document.getElementById('vistaComensal');
const vistaAdmin = document.getElementById('vistaAdmin');
const btnLike = document.getElementById('btnLike');
const btnDislike = document.getElementById('btnDislike');
const btnOmitir = document.getElementById('btnOmitir');
const lblSeleccion = document.getElementById('lblSeleccion');
let btnGuardar = document.getElementById('btnGuardar');
const lnkAccesoAdmin = document.getElementById('lnkAccesoAdmin');
const btnVolver = document.getElementById('btnVolver');
const btnLimpiar = document.getElementById('btnLimpiar');
const btnBorrarTodo = document.getElementById('btnBorrarTodo');
const listaHistorial = document.getElementById('listaHistorial');

let comentarioBox = document.getElementById('comentarioBox');
let txtComentario = document.getElementById('txtComentario');
let contadorPalabras = document.getElementById('contadorPalabras');
const MAX_PALABRAS_COMENTARIO = 120;

const cargandoInicial = document.getElementById('cargandoInicial');
let contenidoVotacion = document.getElementById('contenidoVotacion');

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

let menuIdConocido = localStorage.getItem('menuIdConocido') || null;

if (btnGuardar) {
    btnGuardar.disabled = true;
    btnGuardar.textContent = "Cargando...";
}

function escapeHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

// FUNCIÓN PARA DESHABILITAR COMPLETAMENTE LA VOTACIÓN
function deshabilitarVotacion() {
    if (cargandoInicial) cargandoInicial.style.display = 'none';
    if (contenidoVotacion) contenidoVotacion.style.display = 'none';
    
    const botones = [btnLike, btnDislike, btnOmitir];
    botones.forEach(btn => {
        if (btn) {
            btn.style.display = 'none';
            btn.disabled = true;
        }
    });
    
    if (btnGuardar) {
        btnGuardar.disabled = true;
        btnGuardar.textContent = "Voto ya registrado";
        btnGuardar.style.opacity = '0.5';
        btnGuardar.style.cursor = 'not-allowed';
    }
    
    if (comentarioBox) {
        comentarioBox.style.display = 'none';
    }
}

// FUNCIÓN PARA MOSTRAR AGRADECIMIENTO (PRIMERA VEZ QUE VOTA)
function mostrarAgradecimiento() {
    const tarjetaVotacion = document.querySelector('#vistaComensal .card');
    if (!tarjetaVotacion) return;
    
    deshabilitarVotacion();
    
    tarjetaVotacion.innerHTML = `
        <div style="padding: 30px 0; text-align: center;">
            <h2 style="color: #fef08a; font-size: 1.5rem; font-weight: 700;">🎉 ¡Gracias por tu participación!</h2>
            <p style="color: #94a3b8; margin-top: 16px; font-size: 1rem; line-height: 1.6;">
                Tu opinión sobre el menú de hoy ya ha sido registrada correctamente.
            </p>
            <p style="color: #64748b; margin-top: 20px; font-size: 0.85rem;">
                Puedes cerrar esta ventana o recargar la página para continuar.
            </p>
        </div>
    `;
}

// FUNCIÓN PARA MOSTRAR ADVERTENCIA DE REINTENTO
function mostrarAdvertenciaReintento(intentos) {
    const tarjetaVotacion = document.querySelector('#vistaComensal .card');
    if (!tarjetaVotacion) return;
    
    deshabilitarVotacion();
    
    let mensaje = '';
    let emoji = '';
    let color = '';
    let subtexto = '';
    
    if (intentos === 1) {
        mensaje = '¡Oye, ya votaste una vez!';
        emoji = '👀';
        color = '#fb923c';
        subtexto = 'No se permiten votos múltiples en el mismo turno. ¡Sé honesto! 🍽️';
    } else if (intentos === 2) {
        mensaje = '¡Ya van DOS veces que intentas votar!';
        emoji = '😤';
        color = '#f87171';
        subtexto = 'El sistema ya registró tu voto. Por favor, no insistas.';
    } else if (intentos === 3) {
        mensaje = '¡TRES VECES INTENTANDO VOTAR!';
        emoji = '🚨';
        color = '#ef4444';
        subtexto = 'Estás abusando del sistema. Tu voto ya fue contado.';
    } else if (intentos >= 4) {
        mensaje = '¡ACCESO BLOQUEADO!';
        emoji = '🔒';
        color = '#991b1b';
        subtexto = 'Has intentado votar demasiadas veces. Espera al próximo turno.';
    }
    
    tarjetaVotacion.innerHTML = `
        <div style="padding: 30px 0; text-align: center;">
            <h2 style="color: ${color}; font-size: 1.5rem; font-weight: 700;">${emoji} ${mensaje}</h2>
            <p style="color: #94a3b8; margin-top: 16px; font-size: 1rem; line-height: 1.6;">
                ${subtexto}
            </p>
            <div style="margin-top: 20px; padding: 12px; background: rgba(239, 68, 68, 0.1); border-radius: 12px; border: 1px solid rgba(239, 68, 68, 0.2);">
                <span style="color: #fca5a5; font-size: 0.9rem;">
                    ⚠️ Intento de voto múltiple #${intentos}
                </span>
            </div>
            <p style="color: #64748b; margin-top: 20px; font-size: 0.85rem;">
                Puedes cerrar esta ventana o recargar la página para continuar.
            </p>
        </div>
    `;
}

// FUNCIÓN PARA HABILITAR LA VOTACIÓN (CUANDO NO HA VOTADO)
function habilitarVotacion() {
    if (cargandoInicial) cargandoInicial.style.display = 'none';
    if (contenidoVotacion) contenidoVotacion.style.display = 'block';
    
    const botones = [btnLike, btnDislike, btnOmitir];
    botones.forEach(btn => {
        if (btn) {
            btn.style.display = 'flex';
            btn.disabled = false;
        }
    });
    
    if (btnGuardar) {
        btnGuardar.disabled = false;
        btnGuardar.textContent = "Enviar Voto";
        btnGuardar.style.opacity = '1';
        btnGuardar.style.cursor = 'pointer';
    }
    
    if (comentarioBox) {
        comentarioBox.style.display = 'none';
    }
    
    votoSeleccionado = null;
    if (lblSeleccion) lblSeleccion.textContent = 'Ninguna';
    
    const botonesActivos = [btnLike, btnDislike, btnOmitir];
    botonesActivos.forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
}

async function verificarEstadoVoto() {
    let verificacionCompletada = false;

    const timeoutRespaldo = setTimeout(() => {
        if (!verificacionCompletada) {
            currentMenuId = menuIdConocido || "1";
            habilitarVotacion();
        }
    }, 3000);

    try {
        const respuesta = await fetch(`${WEB_APP_URL}?accion=leer`);
        const datos = await respuesta.json();
        verificacionCompletada = true;
        clearTimeout(timeoutRespaldo);

        currentMenuId = datos.menuId || "1";
        menuIdConocido = currentMenuId;
        localStorage.setItem('menuIdConocido', currentMenuId);

        const ultimoMenuVotado = localStorage.getItem('ultimoMenuVotado');
        
        console.log("=== DEBUG ===");
        console.log("Current Menu ID:", currentMenuId);
        console.log("Último menú votado:", ultimoMenuVotado);
        console.log("¿Ya votó en este turno?", ultimoMenuVotado === currentMenuId);
        
        if (ultimoMenuVotado === currentMenuId) {
            // EL USUARIO YA VOTÓ - Deshabilitar y mostrar agradecimiento
            yaVotoEnEsteTurno = true;
            
            // Obtener contador de intentos
            const intentosKey = `intentos_${currentMenuId}`;
            const intentos = parseInt(localStorage.getItem(intentosKey) || '0');
            
            // Deshabilitar todo
            deshabilitarVotacion();
            
            // Si es la primera vez que carga después de votar (intentos === 0)
            // o si ya ha intentado votar nuevamente (intentos > 0)
            if (intentos === 0) {
                // Mostrar agradecimiento
                mostrarAgradecimiento();
            } else {
                // Mostrar advertencia de reintento
                mostrarAdvertenciaReintento(intentos);
            }
            
        } else {
            // EL USUARIO NO HA VOTADO - Habilitar votación
            yaVotoEnEsteTurno = false;
            
            // Limpiar contador de intentos
            const intentosKey = `intentos_${currentMenuId}`;
            if (localStorage.getItem(intentosKey)) {
                localStorage.removeItem(intentosKey);
            }
            
            habilitarVotacion();
        }
    } catch (e) {
        console.error("Error al verificar estado del voto:", e);
        verificacionCompletada = true;
        clearTimeout(timeoutRespaldo);
        currentMenuId = menuIdConocido || "1";
        habilitarVotacion();
    }
}

// FUNCIÓN PARA INCREMENTAR CONTADOR DE INTENTOS
function incrementarIntentos() {
    const intentosKey = `intentos_${currentMenuId}`;
    let intentos = parseInt(localStorage.getItem(intentosKey) || '0');
    intentos++;
    localStorage.setItem(intentosKey, intentos.toString());
    return intentos;
}

// EVENTOS DE LOS BOTONES DE VOTO
function configurarEventListeners() {
    const botonesVoto = [
        { elemento: btnLike, valor: 'Me gustó' },
        { elemento: btnDislike, valor: 'No me gustó' },
        { elemento: btnOmitir, valor: 'Omito comentario' }
    ];
    
    botonesVoto.forEach(item => {
        if (item.elemento) {
            item.elemento.addEventListener('click', function() {
                // Si ya votó, incrementar contador y mostrar advertencia
                if (yaVotoEnEsteTurno) {
                    const intentos = incrementarIntentos();
                    deshabilitarVotacion();
                    mostrarAdvertenciaReintento(intentos);
                    return;
                }
                
                // Si no ha votado, seleccionar normalmente
                votoSeleccionado = item.valor;
                if (lblSeleccion) lblSeleccion.textContent = item.valor;
                
                botonesVoto.forEach(b => {
                    if (b.elemento) b.elemento.classList.remove('active');
                });
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
    
    if (txtComentario) {
        txtComentario.addEventListener('input', function() {
            let palabras = this.value.trim().split(/\s+/).filter(Boolean);
            if (palabras.length > MAX_PALABRAS_COMENTARIO) {
                this.value = palabras.slice(0, MAX_PALABRAS_COMENTARIO).join(' ');
                palabras = palabras.slice(0, MAX_PALABRAS_COMENTARIO);
            }
            if (contadorPalabras) {
                contadorPalabras.textContent = palabras.length;
                contadorPalabras.parentElement.classList.toggle('limite', palabras.length >= MAX_PALABRAS_COMENTARIO);
            }
        });
    }
    
    if (btnGuardar) {
        btnGuardar.addEventListener('click', async function() {
            // Si ya votó, incrementar contador y mostrar advertencia
            if (yaVotoEnEsteTurno) {
                const intentos = incrementarIntentos();
                deshabilitarVotacion();
                mostrarAdvertenciaReintento(intentos);
                return;
            }
            
            if (!votoSeleccionado) { 
                alert("Por favor, selecciona una opción."); 
                return; 
            }
            
            if (!currentMenuId) { 
                currentMenuId = menuIdConocido || "1"; 
            }

            const comentarioTexto = (votoSeleccionado !== 'Me gustó' && txtComentario) ? txtComentario.value.trim() : '';

            this.disabled = true;
            this.textContent = "Enviando...";
            
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
                
                // Guardar que ya votó
                localStorage.setItem('ultimoMenuVotado', currentMenuId);
                yaVotoEnEsteTurno = true;
                
                // INICIALIZAR CONTADOR DE INTENTOS EN 0
                // Esto asegura que al recargar la página muestre agradecimiento
                const intentosKey = `intentos_${currentMenuId}`;
                localStorage.setItem(intentosKey, '0');
                
                alert("¡Tu opinión ha sido registrada!");
                
                // Deshabilitar todo y mostrar agradecimiento
                deshabilitarVotacion();
                mostrarAgradecimiento();
                
            } catch (error) {
                console.error("Error al enviar voto:", error);
                alert("Error de envío. Por favor, intenta nuevamente.");
                this.disabled = false;
                this.textContent = "Enviar Voto";
            }
        });
    }
}

// ACCESO ADMIN
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

// BOTÓN VOLVER DEL ADMIN
btnVolver.addEventListener('click', () => {
    vistaAdmin.style.display = 'none';
    vistaComensal.style.display = 'block';
    verificarEstadoVoto();
});

// OBTENER RESULTADOS
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

        if (total === 0) {
            tortaNativa.style.background = '#475569';
            pctLike.textContent = '0%'; pctDislike.textContent = '0%'; pctSkip.textContent = '0%';
        } else {
            const pLike = Math.round((vLike / total) * 100);
            const pDislike = Math.round((vDislike / total) * 100);
            const pSkip = Math.round((vSkip / total) * 100);
            pctLike.textContent = `${pLike}%`; pctDislike.textContent = `${pDislike}%`; pctSkip.textContent = `${pSkip}%`;
            tortaNativa.style.background = `conic-gradient(#10b981 0% ${pLike}%, #e11d48 ${pLike}% ${pLike+pDislike}%, #475569 ${pLike+pDislike}% 100%)`;
        }

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

// LIMPIAR TURNO
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
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('intentos_')) {
                    localStorage.removeItem(key);
                }
            });
            setTimeout(obtenerResultadosServidor, 1000);
        } catch (e) { 
            alert("Error al intentar limpiar el turno."); 
        }
        finally { 
            btnLimpiar.disabled = false; 
            btnLimpiar.textContent = "Cerrar Rancho y Reiniciar 🗑️"; 
        }
    }
});

// BORRAR TODO
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
                    const keys = Object.keys(localStorage);
                    keys.forEach(key => {
                        if (key.startsWith('intentos_')) {
                            localStorage.removeItem(key);
                        }
                    });
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

// CONFIGURAR EVENT LISTENERS Y INICIAR
configurarEventListeners();
verificarEstadoVoto();
