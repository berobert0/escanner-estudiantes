const API="https://script.google.com/macros/s/AKfycbwZKYugFQQjO6sb9MLSkMhETq4v-nHqgYzs45J4tRdYWW3AGIThbmW2TAPl1xv7X8z-SQ/exec";

let bloqueado=false;
let sonido;

// 🔊 ACTIVAR SONIDO (corregido con enlace directo)
document.body.addEventListener("click", ()=>{
  if(!sonido){
    sonido = new Audio("https://drive.google.com/uc?export=download&id=1ech4VhO76WcQtg_yJH8zU-PIUCbQSqiv");
  }
});

// ⏰ FUNCIÓN PARA VALIDAR HORARIO
function obtenerEstadoPorHora(){

  let ahora = new Date();
  let horas = ahora.getHours();
  let minutos = ahora.getMinutes();

  let horaActual = horas * 60 + minutos;

  const inicio = 7 * 60 + 40;   // 7:40
  const asistencia = 7 * 60 + 59; // 7:59
  const tardanza = 8 * 60 + 30; // 8:30
  const salida = 12 * 60 + 40; // 12:40

  if(horaActual < inicio){
    return "FUERA DE HORARIO";
  }
  else if(horaActual <= asistencia){
    return "ASISTENCIA";
  }
  else if(horaActual <= tardanza){
    return "TARDANZA";
  }
  else if(horaActual <= salida){
    return "FALTA";
  }
  else{
    return "FUERA DE HORARIO";
  }
}

// 📷 ESCÁNER QR
const qr = new Html5Qrcode("reader");

qr.start(
{ facingMode:"environment" },
{ fps:10, qrbox:200 },

(texto)=>{

  if(bloqueado) return;
  bloqueado = true;

  // 🔊 sonido
  if(sonido){
    sonido.currentTime = 0;
    sonido.play().catch(()=>{});
  }

  // 📳 vibración
  if(navigator.vibrate){
    navigator.vibrate(200);
  }

  // 🔍 consulta API
  fetch(API + "?codigo=" + encodeURIComponent(texto))
  .then(r => {
    if(!r.ok) throw new Error("Error servidor");
    return r.json();
  })
  .then(d => {

    document.getElementById("nombre").innerHTML = d.nombre || "Sin nombre";
    document.getElementById("mensaje").innerHTML = d.mensaje || "";

    let estadoHTML = document.getElementById("estado");

    // ⏰ Estado según hora
    let estadoHora = obtenerEstadoPorHora();

    // ⚠️ Si API dice duplicado, respetar
    let estadoFinal = d.estado === "DUPLICADO" ? "DUPLICADO" : estadoHora;

    switch(estadoFinal){

      case "ASISTENCIA":
        estadoHTML.innerHTML="🟢 ASISTENCIA";
        estadoHTML.style.color="#22c55e";
        break;

      case "TARDANZA":
        estadoHTML.innerHTML="🟡 TARDANZA";
        estadoHTML.style.color="#facc15";
        break;

      case "FALTA":
        estadoHTML.innerHTML="🔴 FALTA";
        estadoHTML.style.color="#ef4444";
        break;

      case "DUPLICADO":
        estadoHTML.innerHTML="⚠️ DUPLICADO";
        estadoHTML.style.color="#f97316";
        break;

      default:
        estadoHTML.innerHTML="⏰ FUERA DE HORARIO";
        estadoHTML.style.color="#6b7280";
    }

    // 🧑 FOTO
    let foto = document.getElementById("foto");

    if(d.foto && d.foto.startsWith("http")){
      foto.src = d.foto;
      foto.style.display = "block";
    }else{
      foto.style.display = "none";
    }

    // 🔓 desbloqueo
    setTimeout(()=> bloqueado = false, 3000);

  })
  .catch(err=>{
    console.error(err);
    document.getElementById("mensaje").innerHTML = "❌ Error de conexión";
    bloqueado = false;
  });

}
);
