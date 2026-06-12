// CONFIGURACIÓN CENTRAL
// 🚨 IMPORTANTE: Reemplaza las comillas de abajo con tu enlace azul de Google Apps Script que copiaste en el paso anterior
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwkZTjC4Rz-me1efoy0l-aDe6wzJYFjtOgP7uKjErh01DZqbU3Xshu6IlPQvssE6ql-qg/exec"; 
const CONTRASEÑA_ADMIN = "1234"; 

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
const listaHistorial = document.getElementById('listaHistorial');

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

async function verificarEstadoVoto() {
    try {
        const respuesta = await fetch(`${WEB_APP_URL}?accion=leer`);
        const datos = await respuesta.json();
        currentMenuId = datos.menuId || "1";
        const ultimoMenuVotado = localStorage.getItem('ultimoMenuVotado');

        if (ultimoMenuVotado === currentMenuId) {
            const tarjetaVotacion = document.querySelector('#vistaComensal .card');
            tarjetaVotacion.innerHTML = `
                <div style="padding: 20px 0;">
                    <h2 style="color: #2563eb; font-size: 1.4rem;">¡Gracias por tu participación! 🎉</h2>
                    <p style="color: #718096; margin-top: 10px; font-size: 0.95rem;">
                        Tu opinión sobre el menú de hoy ya ha sido registrada correctamente.
                    </p>
                </div>
            `;
            if(btnGuardar) btnGuardar.style.display = 'none';
        }
    } catch (e) { console.error(e); }
}

botones.forEach(item => {
    item.elemento.addEventListener('click', () => {
        votoSeleccionado = item.valor;
        lblSeleccion.textContent = item.valor;
        botones.forEach(b => b.elemento.classList.remove('active'));
        item.elemento.classList.add('active');
    });
});

btnGuardar.addEventListener('click', async () => {
    if (!votoSeleccionado) { alert("Por favor, selecciona una opción."); return; }
    btnGuardar.disabled = true;
    btnGuardar.textContent = "Enviando...";
    try {
        await fetch(WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: 'votar', opcion: votoSeleccionado })
        });
        localStorage.setItem('ultimoMenuVotado', currentMenuId);
        alert("¡Tu opinión ha sido registrada!");
        window.location.reload();
    } catch (error) {
        alert("Error de envío.");
        btnGuardar.disabled = false;
        btnGuardar.textContent = "Enviar Voto";
    }
});

lnkAccesoAdmin.addEventListener('click', () => {
    const clave = prompt("Introduce la contraseña:");
    if (clave === CONTRASEÑA_ADMIN) {
        vistaComensal.style.display = 'none';
        vistaAdmin.style.display = 'block';
        obtenerResultadosServidor();
    } else if (clave !== null) { alert("Incorrecta."); }
});

btnVolver.addEventListener('click', () => { window.location.reload(); });

async function obtenerResultadosServidor() {
    try {
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

        if (total === 0) {
            tortaNativa.style.background = '#e2e8f0';
            pctLike.textContent = '0%'; pctDislike.textContent = '0%'; pctSkip.textContent = '0%';
        } else {
            const pLike = Math.round((vLike / total) * 100);
            const pDislike = Math.round((vDislike / total) * 100);
            const pSkip = Math.round((vSkip / total) * 100);
            pctLike.textContent = `${pLike}%`; pctDislike.textContent = `${pDislike}%`; pctSkip.textContent = `${pSkip}%`;
            tortaNativa.style.background = `conic-gradient(#2563eb 0% ${pLike}%, #dc2626 ${pLike}% ${pLike+pDislike}%, #475569 ${pLike+pDislike}% 100%)`;
        }

        listaHistorial.innerHTML = "";
        const historial = datos.historial || [];
        
        if (historial.length === 0) {
            listaHistorial.innerHTML = `<p style="color:#94a3b8; font-size:0.9rem; text-align:center;">No hay turnos archivados aún.</p>`;
            return;
        }

        historial.forEach((turno, index) => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="history-date">Turno #${historial.length - index} — ${turno.fecha}</div>
                <div class="history-stats">
                    <span>👍 ${turno['Me gustó']}</span>
                    <span>👎 ${turno['No me gustó']}</span>
                    <span>🤫 ${turno['Omito comentario']}</span>
                    <span style="font-weight:bold; color:#1e293b;">Total: ${turno.total}</span>
                </div>
            `;
            listaHistorial.appendChild(div);
        });

    } catch (e) { console.error(e); }
}

btnLimpiar.addEventListener('click', async () => {
    if (confirm("¿Cerrar el turno actual? Los votos pasarán al historial histórico.")) {
        btnLimpiar.disabled = true;
        btnLimpiar.textContent = "Archivando turno...";
        try {
            await fetch(WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion: 'limpiar' })
            });
            alert("Turno archivado con éxito.");
            setTimeout(obtenerResultadosServidor, 1500);
        } catch (e) { alert("Error."); }
        finally { btnLimpiar.disabled = false; btnLimpiar.textContent = "Cerrar Turno y Reiniciar 🗑️"; }
    }
});

verificarEstadoVoto();
