// Añade un escuchador al selector que se activa al cambiar de opción
document.getElementById('pueblo-select').addEventListener('change', async (e) => {
  const pueblo = e.target.value; // Obtiene el nombre del pueblo seleccionado

  if (!pueblo) return; // Si no se seleccionó un valor, finaliza la función

  try {
    // Construye la URL del archivo JSON del pueblo desde GitHub
    const url = `https://raw.githubusercontent.com/Oleg0307/geoexplorers-data/main/geodata/${pueblo}/${pueblo}.json`;

    // Realiza la petición HTTP asincrónica usando Fetch API
    const response = await fetch(url);

    // Si la respuesta HTTP no es satisfactoria, lanza un error
    if (!response.ok) throw new Error('No se pudo obtener el archivo JSON');

    // Convierte el contenido de la respuesta a objeto JavaScript
    const data = await response.json();

    // Llama a una función definida en otro archivo (por implementar) para mostrar el mapa
    cargarMapa(data);

  } catch (error) {
    // Muestra un error en la consola para depuración
    console.error("Error:", error);

    // Informa al usuario sobre el fallo en la carga
    alert("No se pudo cargar el pueblo seleccionado.");
  }
});
