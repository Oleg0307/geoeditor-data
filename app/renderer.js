// app/renderer.js

//  ────────────────────────────────────────────────
//  Единственная регистрация DOMContentLoaded
//  ────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const { ipcRenderer } = require('electron');
  // Leaflet уже подключён в index.html, глобальная L 
  
  
  
  // 1. Инициализация карты
  const map = L.map('map', { doubleClickZoom: false }).setView([38.7895, 0.1669], 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // 2. Ссылки на DOM
  const formEl    = document.getElementById('marker-form');
  const titleEl   = document.getElementById('title');
  const descEl    = document.getElementById('description');
  const latEl     = document.getElementById('lat');
  const lngEl     = document.getElementById('lng');
  const qc        = document.getElementById('questions-container');
  const addBtn    = document.getElementById('add-marker');
  const saveBtn   = document.getElementById('save-marker');
  const centerBtn = document.getElementById('center-marker');
  const delBtn    = document.getElementById('delete-marker');
  const updateBtn = document.getElementById('update-coords');

  // 3. Глобальные переменные
  let currentMarker   = null;
  let markerIdCounter = 1;
  let markers         = [];
  let currentProject  = { pueblo:'', zona:'', autor:'', fecha_creacion:'', puntos:[] };

  // 4. Утилиты
  function clearForm() {
    titleEl.value = '';
    descEl.value  = '';
    latEl.value   = '';
    lngEl.value   = '';
    qc.innerHTML  = '';
    document.getElementById('add-question')?.remove();
  }

  function createQuestionBlock(data = null) {
    const div = document.createElement('div');
    div.className = 'question-item';

    const inp = document.createElement('input');
    inp.type        = 'text';
    inp.className   = 'question form-control';
    inp.placeholder = 'Texto de la pregunta';
    if (data) inp.value = data.enunciado;
    div.appendChild(inp);

    const opts = document.createElement('div');
    opts.className = 'options';
    for (let i = 0; i < 4; i++) {
      const o = document.createElement('input');
      o.type        = 'text';
      o.className   = 'option form-control';
      o.placeholder = `Opción ${i+1}`;
      if (data?.opciones?.[i]) o.value = data.opciones[i];
      opts.appendChild(o);
    }
    div.appendChild(opts);

    const sel = document.createElement('select');
    sel.className = 'correct-answer form-control';
    for (let i = 0; i < 4; i++) {
      const op = document.createElement('option');
      op.value = i;
      op.textContent = `Opción ${i+1} correcta`;
      sel.appendChild(op);
    }
    if (data) sel.value = data.correcta;
    div.appendChild(sel);

    const rem = document.createElement('button');
    rem.className = 'btn btn-danger';
    rem.textContent = 'Eliminar pregunta';
    rem.onclick = () => div.remove();
    div.appendChild(rem);

    return div;
  }

  function renderQuestions(arr) {
    qc.innerHTML = '';
    arr.forEach(q => qc.appendChild(createQuestionBlock(q)));
  }

  function añadirPregunta() {
    qc.appendChild(createQuestionBlock());
  }

  // 5. Заполнение формы
  function fillForm(marker) {
    console.log('fillForm ►', marker.data.id);
    const d = marker.data;
    titleEl.value = d.titulo;
    descEl.value  = d.descripcion;
    const [la, lo] = marker.getLatLng();
    latEl.value = la.toFixed(6);
    lngEl.value = lo.toFixed(6);
    renderQuestions(d.preguntas);

    if (!document.getElementById('add-question')) {
      const btn = document.createElement('button');
      btn.id        = 'add-question';
      btn.className = 'btn btn-secondary';
      btn.textContent = 'Añadir pregunta';
      btn.onclick   = añadirPregunta;
      qc.after(btn);
    }

    setTimeout(() => { titleEl.focus(); titleEl.select(); }, 10);
  }

  // 6. Выбор маркера
  function selectMarker(m) {
    console.log('Marker clicked ►', m.data.id);
    currentMarker = m;
    clearForm();
    fillForm(m);
    formEl.style.display = 'block';
  }

  // 7. Создание нового маркера
  function crearNuevoMarcador(latlng) {
    const id = markerIdCounter++;
    const icon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="circle-icon">${id}</div>`,
      iconSize: [28,28], iconAnchor: [14,28]
    });
    const m = L.marker(latlng, { draggable: true, icon }).addTo(map);
    m.data = { id, titulo:'', descripcion:'', coordenadas:[latlng.lat,latlng.lng], preguntas:[] };

    m.on('click', () => selectMarker(m));
    m.on('dragend', () => {
      if (m === currentMarker) {
        const p = m.getLatLng();
        latEl.value = p.lat.toFixed(6);
        lngEl.value = p.lng.toFixed(6);
      }
    });

    markers.push(m);
    currentProject.puntos.push(m.data);
    map.panTo(latlng);
    selectMarker(m);
  }

  addBtn.onclick = () => crearNuevoMarcador(map.getCenter());

  // 8. Сохранение изменений
  saveBtn.onclick = () => {
    if (!currentMarker) return;
    console.log('Saving marker ►', currentMarker.data.id);

    const t = titleEl.value.trim();
    const d = descEl.value.trim();
    if (!t || !d) { alert('Título и descripción requeridos'); return; }

    const ps = [];
    document.querySelectorAll('.question-item').forEach(b => {
      const en = b.querySelector('.question').value.trim();
      const os = Array.from(b.querySelectorAll('.option')).map(x=>x.value.trim());
      const co = parseInt(b.querySelector('.correct-answer').value);
      if (en && os.every(o=>o)) ps.push({ enunciado: en, opciones: os, correcta: co });
    });

    const nd = { id: currentMarker.data.id, titulo: t, descripcion: d,
                 coordenadas: [parseFloat(latEl.value), parseFloat(lngEl.value)],
                 preguntas: ps };

    currentMarker.data = nd;
    const i = currentProject.puntos.findIndex(x=>x.id===nd.id);
    if (i >= 0) currentProject.puntos[i] = nd;

    alert('Punto guardado');
    currentMarker = null;
    clearForm();
    formEl.style.display = 'none';
  };

  // 9. Центрирование, удаление, обновление координат
  centerBtn.onclick = () => currentMarker && map.panTo(currentMarker.getLatLng());
  delBtn.onclick    = () => {
    if (!currentMarker) return;
    map.removeLayer(currentMarker);
    markers = markers.filter(x=>x!==currentMarker);
    currentProject.puntos = currentProject.puntos.filter(x=>x.id!==currentMarker.data.id);
    currentMarker = null;
    clearForm();
    formEl.style.display = 'none';
  };
  updateBtn.onclick = () => {
    if (!currentMarker) return;
    const la = parseFloat(latEl.value), lo = parseFloat(lngEl.value);
    if (isNaN(la)||isNaN(lo)) { alert('Coordenadas inválidas'); return; }
    currentMarker.setLatLng([la,lo]);
    map.panTo([la,lo]);
  };

  // 10. Загрузка/сохранение проекта
  ipcRenderer.on('project-loaded', (e, project) => {
    // очистка
    markers.forEach(m=>map.removeLayer(m));
    markers = []; currentMarker = null;
    clearForm(); formEl.style.display='none';
    // загрузка
    currentProject = project;
    document.getElementById('project-ciudad').value = project.pueblo||'';
    document.getElementById('project-zona').value   = project.zona||'';
    document.getElementById('project-autor').value  = project.autor||'';

    project.puntos.forEach(p => {
      const icon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="circle-icon">${p.id}</div>`,
        iconSize: [28,28], iconAnchor:[14,28]
      });
      const m = L.marker(p.coordenadas, { draggable:true, icon }).addTo(map);
      m.data = p;
      m.on('click',()=> selectMarker(m));
      m.on('dragend',()=>{
        if (m===currentMarker){
          const pos=m.getLatLng();
          latEl.value = pos.lat.toFixed(6);
          lngEl.value = pos.lng.toFixed(6);
        }
      });
      markers.push(m);
      if (p.id>=markerIdCounter) markerIdCounter = p.id+1;
    });
    console.log('Project loaded:', project);
  });

  document.getElementById('load-project').onclick = () => {
    ipcRenderer.send('load-project');
  };

  ipcRenderer.on('project-saved', (e, fp) => {
    document.getElementById('project-status').textContent = 'Proyecto guardado';
    console.log('Project saved to', fp);
  });
});
});