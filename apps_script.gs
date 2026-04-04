function doGet(e){

  if(e.parameter.tipo === "panel"){
    return obtenerPanel();
  }

  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ASISTENCIA");

  const codigo = e.parameter.codigo;

  const ahora = new Date();
  const fecha = Utilities.formatDate(ahora, "America/Lima", "yyyy-MM-dd");
  const hora = Utilities.formatDate(ahora, "HH:mm:ss");

  const estado = obtenerEstado(ahora);

  const datos = hoja.getDataRange().getValues();

  let duplicado = datos.find(f => f[0]==codigo && f[2]==fecha);

  if(duplicado){
    return json({
      nombre: duplicado[1],
      estado:"DUPLICADO",
      mensaje:"Ya registrado"
    });
  }

  const nombre = "Alumno " + codigo;

  hoja.appendRow([codigo,nombre,fecha,hora,estado]);

  return json({
    nombre:nombre,
    estado:estado,
    mensaje:"OK"
  });
}

// 📊 PANEL
function obtenerPanel(){

  const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("ASISTENCIA");
  const datos = hoja.getDataRange().getValues();

  let lista = [];

  for(let i=1;i<datos.length;i++){
    lista.push({
      nombre: datos[i][1],
      hora: datos[i][3],
      estado: datos[i][4]
    });
  }

  return json(lista);
}

// ⏰ HORARIO
function obtenerEstado(now){

  let m = now.getHours()*60 + now.getMinutes();

  if(m <= 479) return "ASISTENCIA"; // 7:59
  if(m <= 510) return "TARDANZA";   // 8:30
  return "FALTA";
}

function json(obj){
  return ContentService
  .createTextOutput(JSON.stringify(obj))
  .setMimeType(ContentService.MimeType.JSON);
}
