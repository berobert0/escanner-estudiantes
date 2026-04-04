const API = "TU_API_AQUI";

let bloqueado = false;

// 🎯 ESCÁNER
const qr = new Html5Qrcode("reader");

qr.start(
{ facingMode:"environment" },
{ fps:10, qrbox:200 },

(texto)=>{

if(bloqueado) return;
bloqueado = true;

fetch(API + "?codigo=" + encodeURIComponent(texto))
.then(r=>r.json())
.then(d=>{

document.getElementById("nombre").innerHTML = d.nombre || "";
document.getElementById("mensaje").innerHTML = d.mensaje || "";

let estado = document.getElementById("estado");

let color = "#fff";

if(d.estado==="ASISTENCIA") color="#22c55e";
else if(d.estado==="TARDANZA") color="#facc15";
else if(d.estado==="FALTA") color="#ef4444";
else color="#f97316";

estado.innerHTML = d.estado;
estado.style.color = color;

let foto = document.getElementById("foto");

if(d.foto){
  foto.src = d.foto;
  foto.style.display = "block";
}else{
  foto.style.display = "none";
}

setTimeout(()=>bloqueado=false,3000);

})
.catch(()=>{
document.getElementById("mensaje").innerHTML="Error conexión";
bloqueado=false;
});

}
);
