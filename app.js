const API = "https://script.google.com/macros/s/AKfycbzk4qk30eq65JoCO8vtTEIJit6sHPMHBEVItWmP-2BAwmw4MS_9MTNnkNC7um9dTfqP/exec";

let bloqueado = false;
let sonido;

// La cámara se conserva tal como funcionaba en el lector original.
document.body.addEventListener("click", () => {
  if (!sonido) {
    sonido = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
  }
});

const parametros = new URLSearchParams(window.location.search);
const ticket = parametros.get("ticket") || "";
const apiPanel = parametros.get("api") || API;

function mostrarResultado(mensaje, estado, color, alumno) {
  const nombreEl = document.getElementById("nombre");
  const mensajeEl = document.getElementById("mensaje");
  const estadoEl = document.getElementById("estado");
  const fotoEl = document.getElementById("foto");

  if (nombreEl) nombreEl.textContent = alumno?.APELLIDOS_Y_NOMBRES || "";
  if (mensajeEl) mensajeEl.textContent = mensaje;
  if (estadoEl) {
    estadoEl.textContent = estado;
    estadoEl.style.color = color;
  }
  if (fotoEl) {
    const url = alumno?.FOTO_URL || "";
    if (/^https:\/\//i.test(url)) {
      fotoEl.src = url;
      fotoEl.style.display = "block";
    } else {
      fotoEl.removeAttribute("src");
      fotoEl.style.display = "none";
    }
  }
}

// Apps Script responde con JSONP, no con JSON de fetch().
function enviarQR(codigo) {
  return new Promise((resolve, reject) => {
    if (!ticket) {
      reject(new Error("Falta autorización. Ingresa al panel institucional y abre el escáner desde su botón Escáner QR."));
      return;
    }

    const callback = "qr5074_" + Date.now() + "_" + Math.floor(Math.random() * 1000000);
    const script = document.createElement("script");
    let terminado = false;
    let temporizador;

    function finalizar(error, resultado) {
      if (terminado) return;
      terminado = true;
      clearTimeout(temporizador);
      script.remove();
      delete window[callback];
      if (error) reject(error);
      else resolve(resultado);
    }

    window[callback] = resultado => finalizar(null, resultado);
    script.onerror = () => finalizar(new Error("No se pudo contactar con Google Apps Script."));
    temporizador = setTimeout(() => finalizar(new Error("Tiempo de espera agotado al registrar.")), 15000);

    const url = new URL(apiPanel);
    if (url.protocol !== "https:" || url.hostname !== "script.google.com" || !url.pathname.endsWith("/exec")) {
      finalizar(new Error("La dirección de Apps Script no es válida."));
      return;
    }
    url.searchParams.set("accion", "registrarQR");
    url.searchParams.set("codigo", codigo);
    url.searchParams.set("ticket", ticket);
    url.searchParams.set("callback", callback);
    script.src = url.toString();
    document.head.appendChild(script);
  });
}

const qr = new Html5Qrcode("reader");
qr.start(
  { facingMode: "environment" },
  { fps: 10, qrbox: 200 },
  (texto) => {
    if (bloqueado) return;
    bloqueado = true;

    if (sonido) {
      sonido.currentTime = 0;
      sonido.play().catch(() => {});
    }
    if (navigator.vibrate) navigator.vibrate(200);

    mostrarResultado("Consultando registro en Google Sheets...", "VERIFICANDO", "#64748b");

    enviarQR(texto)
      .then(d => {
        if (d && d.ok === true && d.saved === true) {
          mostrarResultado(d.message || "Asistencia guardada.", "🟢 PRESENTE", "#22c55e", d.alumno);
        } else if (d && d.duplicate) {
          mostrarResultado(d.message || "El alumno ya fue registrado hoy.", "⚠️ DUPLICADO", "#f97316", d.alumno);
        } else {
          mostrarResultado(d?.message || "Google Sheets no confirmó el registro.", "❌ NO REGISTRADO", "#ef4444", d?.alumno);
        }
      })
      .catch(error => {
        console.error("Registro QR:", error);
        mostrarResultado(error.message || "Error de conexión.", "❌ NO REGISTRADO", "#ef4444");
      })
      .finally(() => {
        setTimeout(() => { bloqueado = false; }, 3000);
      });
  }
).catch(error => {
  console.error("Cámara:", error);
  mostrarResultado("No se pudo iniciar la cámara. Verifica los permisos del navegador.", "CÁMARA NO DISPONIBLE", "#ef4444");
});

if (!ticket) {
  mostrarResultado("Para registrar asistencia, abre el escáner desde el panel institucional.", "SIN AUTORIZACIÓN", "#f97316");
}


// Información visual proporcionada por el panel que ya autenticó al usuario.
// Estos parámetros NO conceden permisos: el servidor valida el ticket y la sesión.
(function mostrarDocenteDelPanel() {
  const p = new URLSearchParams(window.location.search);
  const nombre = (p.get('docente') || '').trim().slice(0, 120);
  const rol = (p.get('rol') || '').trim().toUpperCase();
  const seccion = (p.get('seccion') || '').trim().toUpperCase().slice(0, 12);
  const n = document.getElementById('docenteNombre');
  const s = document.getElementById('docenteSeccion');
  const a = document.getElementById('autorizacion');
  if (n) n.textContent = nombre || 'Usuario no identificado';
  if (s) s.textContent = rol === 'ADMIN' ? 'Administrador · Toda la institución' : (seccion ? 'Grado y sección: ' + seccion : 'Grado y sección no recibidos');
  if (a) {
    a.textContent = ticket ? '● Autorización de escáner recibida' : '⚠ Abre este lector desde el panel institucional';
    if (ticket) a.classList.add('ok');
  }
})();
