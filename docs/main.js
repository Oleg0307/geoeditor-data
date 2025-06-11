// Espera a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('pueblo-select');

  // Maneja el cambio de selección del usuario
  selector.addEventListener('change', async (e) => {
    const pueblo = e.target.value.trim();
    if (!pueblo) return;

    const url = `https://raw.githubusercontent.com/Oleg0307/geoeditor-data/main/geodata/${pueblo}/${pueblo}.json`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("No se pudo cargar el archivo JSON.");
      const data = await response.json();

      // Llama a la función que carga y muestra el mapa
      cargarMapa(data);
    } catch (err) {
      console.error("Error al cargar los datos del pueblo:", err);
      alert("No se pudo cargar el archivo del pueblo seleccionado.");
    }
  });
});

// Función que crea y muestra el mapa con marcadores
function cargarMapa(data) {
  // Verifica si hay puntos válidos
  if (!data.puntos || data.puntos.length === 0) {
    alert("Este pueblo no tiene puntos para mostrar.");
    return;
  }

  // Inicializa el mapa centrado en la primera coordenada
  const map = L.map('map').setView(data.puntos[0].coordenadas, 14);

  // Añade el fondo del mapa de OpenStreetMap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Recorre todos los puntos y los coloca como marcadores
  data.puntos.forEach(p => {
    if (p.coordenadas && p.coordenadas.length === 2) {
      L.marker(p.coordenadas).addTo(map)
        .bindPopup(`<b>${p.titulo}</b><br>${p.descripcion || ''}`);
    }
  });
}
