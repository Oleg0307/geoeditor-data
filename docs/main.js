// Añade un evento al desplegable que se activa cuando cambia la selección
document.getElementById('pueblo-select').addEventListener('change', async (e) => {
  const pueblo = e.target.value; // Obtiene el nombre del pueblo seleccionado

  // Si no se ha seleccionado ningún pueblo, no hace nada
  if (!pueblo) return;

  try {
    // Construye la ruta al archivo JSON dentro de la misma carpeta
    const url = `${pueblo}.json`;

    // Realiza la petición para obtener el archivo JSON local
    const response = await fetch(url);
    if (!response.ok) throw new Error('No se pudo obtener el archivo JSON');

    // Parsea el contenido del JSON y llama a la función para mostrar el mapa
    const data = await response.json();
    cargarMapa(data);
  } catch (error) {
    console.error("Error:", error); // Muestra el error en la consola
    alert("No se pudo cargar el pueblo seleccionado."); // Alerta al usuario
  }
});

// Variable global para la instancia del mapa
let mapa = null;

// Función que genera el mapa a partir de los datos JSON
function cargarMapa(data) {
  const divMapa = document.getElementById('map');

  // Si ya existe un mapa anterior, lo elimina para no duplicar
  if (mapa) {
    mapa.remove();
    divMapa.innerHTML = "<div id='map' style='height: 400px;'></div>";
  }

  // Usa la primera coordenada para centrar el mapa
  const primerPunto = data.puntos[0];
  mapa = L.map('map').setView(primerPunto.coordenadas, 15);

  // Añade los tiles de OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(mapa);

  // Añade los marcadores con ventanas emergentes
  data.puntos.forEach(punto => {
    const marcador = L.marker(punto.coordenadas).addTo(mapa);

    // Construye el contenido del popup con preguntas
    let contenido = `<b>${punto.titulo}</b><br>${punto.descripcion}<br><br>`;
    if (punto.preguntas && punto.preguntas.length > 0) {
      punto.preguntas.forEach(pregunta => {
        contenido += `<i>${pregunta.enunciado}</i><br>`;
        pregunta.opciones.forEach(opcion => {
          contenido += `- ${opcion}<br>`;
        });
        contenido += `<strong>Respuesta correcta:</strong> ${pregunta.correcta}<br><br>`;
      });
    }

    marcador.bindPopup(contenido);
  });
}
