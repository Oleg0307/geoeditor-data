const { ipcRenderer } = require('electron');

let map;
let markers = [];
let currentMarker = null;
let addMode = false;

// Inicializa el mapa
map = L.map('map').setView([38.7939, 0.1662], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Maneja clic para añadir marcador
map.on('click', (e) => {
  if (!addMode) return;

  const marker = {
    id: Date.now(),
    titulo: '',
    descripcion: '',
    coordenadas: [e.latlng.lat, e.latlng.lng],
    preguntas: []
  };

  const leafletMarker = L.marker(e.latlng, { draggable: true }).addTo(map);
  leafletMarker.on('click', () => selectMarker(marker, leafletMarker));
  leafletMarker.on('dragend', (event) => {
    const latlng = event.target.getLatLng();
    marker.coordenadas = [latlng.lat, latlng.lng];
    if (currentMarker === marker) updateFormFields(marker);
  });

  marker._leaflet = leafletMarker;
  markers.push(marker);
  selectMarker(marker, leafletMarker);
  addMode = false;
});

// Activa modo de añadir marcador
document.getElementById('add-marker').addEventListener('click', () => {
  addMode = true;
});

// Selecciona un marcador y llena el formulario
function selectMarker(marker, leafletMarker) {
  currentMarker = marker;
  document.getElementById('marker-form').style.display = 'block';
  updateFormFields(marker);
}

// Llena los campos del formulario con los datos del marcador
function updateFormFields(marker) {
  document.getElementById('title').value = marker.titulo;
  document.getElementById('description').value = marker.descripcion;
  document.getElementById('lat').value = marker.coordenadas[0];
  document.getElementById('lng').value = marker.coordenadas[1];

  // Cargar preguntas[] en el formulario
  document.getElementById('preguntas-container').innerHTML = '';
  (marker.preguntas || []).forEach(p => createPreguntaElement(p));
}

// Actualiza las coordenadas manualmente
document.getElementById('update-coords').addEventListener('click', () => {
  if (!currentMarker) return;
  const lat = parseFloat(document.getElementById('lat').value);
  const lng = parseFloat(document.getElementById('lng').value);
  currentMarker.coordenadas = [lat, lng];
  currentMarker._leaflet.setLatLng([lat, lng]);
});

// Guarda los cambios del marcador
document.getElementById('save-marker').addEventListener('click', () => {
  if (!currentMarker) return;
  currentMarker.titulo = document.getElementById('title').value;
  currentMarker.descripcion = document.getElementById('description').value;

  // Procesar preguntas[] desde el DOM
  const preguntaDivs = document.querySelectorAll('#preguntas-container .pregunta-item');
  const preguntas = Array.from(preguntaDivs).map(div => {
    const inputs = div.querySelectorAll('input.form-control');
    const select = div.querySelector('select');
    return {
      enunciado: inputs[0].value.trim(),
      opciones: [
        inputs[1].value.trim(),
        inputs[2].value.trim(),
        inputs[3].value.trim(),
        inputs[4].value.trim()
      ],
      correcta: parseInt(select.value)
    };
  });
  currentMarker.preguntas = preguntas;

  document.getElementById('marker-form').style.display = 'none';
  currentMarker = null;
});

// Elimina el marcador actual
document.getElementById('delete-marker').addEventListener('click', () => {
  if (!currentMarker) return;
  map.removeLayer(currentMarker._leaflet);
  markers = markers.filter(m => m !== currentMarker);
  currentMarker = null;
  document.getElementById('marker-form').style.display = 'none';
});

// Cancela la edición del marcador
document.getElementById('cancel-marker').addEventListener('click', () => {
  currentMarker = null;
  document.getElementById('marker-form').style.display = 'none';
});

// Crear nuevo proyecto
document.getElementById('new-project').addEventListener('click', () => {
  document.getElementById('project-status').textContent = 'Nuevo proyecto';
  markers.forEach(m => map.removeLayer(m._leaflet));
  markers = [];
  currentMarker = null;
  document.getElementById('marker-form').style.display = 'none';
  clearFormFields();
});

// Guardar proyecto en disco
document.getElementById('save-project').addEventListener('click', () => {
  const pueblo = document.getElementById('project-ciudad').value.trim();
  const zona = document.getElementById('project-zona').value.trim();
  const autor = document.getElementById('project-autor').value.trim();
  const fecha = new Date().toISOString().split('T')[0];

  if (!pueblo || !zona || !autor) {
    alert('Faltan datos del proyecto.');
    return;
  }

  const project = {
    pueblo,
    zona,
    autor,
    fecha_creacion: fecha,
    puntos: markers.map(m => ({
      id: m.id,
      titulo: m.titulo,
      descripcion: m.descripcion,
      coordenadas: m.coordenadas,
      preguntas: m.preguntas
    }))
  };

  ipcRenderer.send('auto-save-project', { project });
});

// Cargar proyecto desde disco
document.getElementById('load-project').addEventListener('click', () => {
  ipcRenderer.send('load-project');
});

// Recibir proyecto cargado
ipcRenderer.on('project-loaded', (event, project) => {
  document.getElementById('project-ciudad').value = project.pueblo || '';
  document.getElementById('project-zona').value = project.zona || '';
  document.getElementById('project-autor').value = project.autor || '';
  document.getElementById('project-status').textContent = 'Proyecto cargado';

  // Limpiar mapa y datos previos
  markers.forEach(m => map.removeLayer(m._leaflet));
  markers = [];
  currentMarker = null;

  project.puntos.forEach(p => {
    const leafletMarker = L.marker(p.coordenadas, { draggable: true }).addTo(map);
    p._leaflet = leafletMarker;

    leafletMarker.on('click', () => selectMarker(p, leafletMarker));
    leafletMarker.on('dragend', (event) => {
      const latlng = event.target.getLatLng();
      p.coordenadas = [latlng.lat, latlng.lng];
      if (currentMarker === p) updateFormFields(p);
    });

    markers.push(p);
  });
});

// Confirmación de guardado
ipcRenderer.on('project-saved', (event, filePath) => {
  document.getElementById('project-status').textContent = `Guardado en ${filePath}`;
});

// Limpia todos los campos del formulario
function clearFormFields() {
  document.getElementById('project-ciudad').value = '';
  document.getElementById('project-zona').value = '';
  document.getElementById('project-autor').value = '';
  document.getElementById('title').value = '';
  document.getElementById('description').value = '';
  document.getElementById('lat').value = '';
  document.getElementById('lng').value = '';
  document.getElementById('preguntas-container').innerHTML = '';
}

// Añadir nueva pregunta
document.getElementById('add-pregunta').addEventListener('click', () => {
  createPreguntaElement();
});

// Genera un bloque de UI para una pregunta
function createPreguntaElement(pregunta = null) {
  const preguntaDiv = document.createElement('div');
  preguntaDiv.className = 'pregunta-item';

  const enunciado = document.createElement('input');
  enunciado.type = 'text';
  enunciado.placeholder = 'Enunciado';
  enunciado.className = 'form-control';
  if (pregunta) enunciado.value = pregunta.enunciado;

  const opciones = [];
  const opcionesContainer = document.createElement('div');
  opcionesContainer.className = 'options';
  for (let i = 0; i < 4; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = `Opción ${i + 1}`;
    input.className = 'form-control';
    if (pregunta && pregunta.opciones[i]) input.value = pregunta.opciones[i];
    opciones.push(input);
    opcionesContainer.appendChild(input);
  }

  const correcta = document.createElement('select');
  correcta.className = 'form-control';
  for (let i = 0; i < 4; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Correcta: opción ${i + 1}`;
    correcta.appendChild(opt);
  }
  if (pregunta) correcta.value = pregunta.correcta;

  const eliminarBtn = document.createElement('button');
  eliminarBtn.type = 'button';
  eliminarBtn.textContent = 'Eliminar';
  eliminarBtn.className = 'btn btn-danger';
  eliminarBtn.onclick = () => preguntaDiv.remove();

  preguntaDiv.appendChild(enunciado);
  preguntaDiv.appendChild(opcionesContainer);
  preguntaDiv.appendChild(correcta);
  preguntaDiv.appendChild(eliminarBtn);

  document.getElementById('preguntas-container').appendChild(preguntaDiv);
}
