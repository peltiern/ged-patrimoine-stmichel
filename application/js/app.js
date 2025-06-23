let data = [];
let currentPage = 1;
const itemsPerPage = 20;
let map, mapBoth, markersLayer, markersBothLayer;

// Chargement JSON
fetch('data/photos_saint_michel.json')
  .then(res => res.json())
  .then(json => {
    data = json;
    initFilters();
    initMaps();
    applyFilters();
  });

function initFilters() {
  const allThemes = new Set();
  const allLieux = new Set();

  data.forEach(photo => {
    photo.themes?.forEach(t => allThemes.add(t));
    photo.lieu?.forEach(l => allLieux.add(l));
  });

  const allThemesTries = Array.from(allThemes).sort();
  const allLieuxTries = Array.from(allLieux).sort();

  const themeSelect = document.getElementById('filter-themes');
  allThemesTries.forEach(t => {
    const option = document.createElement('option');
    option.value = t;
    option.textContent = t;
    themeSelect.appendChild(option);
  });

  const lieuSelect = document.getElementById('filter-lieux');
  allLieuxTries.forEach(l => {
    const option = document.createElement('option');
    option.value = l;
    option.textContent = l;
    lieuSelect.appendChild(option);
  });

  document.querySelectorAll('select, input[type="date"]').forEach(el => {
    el.addEventListener('change', () => {
      currentPage = 1;
      applyFilters();
    });
  });
}

function applyFilters() {
  const selectedThemes = [...document.getElementById('filter-themes').selectedOptions].map(o => o.value);
  const selectedLieux = [...document.getElementById('filter-lieux').selectedOptions].map(o => o.value);
  const dateStart = document.getElementById('filter-date-start').value;
  const dateEnd = document.getElementById('filter-date-end').value;

  let filtered = data.filter(photo => {
    const themeMatch = selectedThemes.length === 0 || photo.themes?.some(t => selectedThemes.includes(t));
    const lieuMatch = selectedLieux.length === 0 || photo.lieu?.some(l => selectedLieux.includes(l));
    return themeMatch && lieuMatch;
  });

  renderList(filtered, "results-list");
  renderList(filtered, "results-list-both");
  updateMap(filtered, markersLayer);
  updateMap(filtered, markersBothLayer);
}

function renderList(filtered, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  const pageItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  pageItems.forEach((photo, index) => {
    const div = document.createElement('div');
    div.className = 'thumbnail';
    const img = document.createElement('img');
    //img.src = '/resized/large/' + photo.chemin;
    img.src = 'resized/large/' + ((index % 2 === 0) ? '1.jpg' : '2.jpg');
    img.alt = photo.numero;
    div.appendChild(img);
    container.appendChild(div);
  });

  if (containerId === "results-list") {
    renderPagination(filtered.length);
  }
}

function renderPagination(totalItems) {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === currentPage) btn.disabled = true;
    btn.onclick = () => {
      currentPage = i;
      applyFilters();
    };
    pagination.appendChild(btn);
  }
}

function initMaps() {
  map = L.map('map').setView([45.6406, 0.1096], 14);
  mapBoth = L.map('map-both').setView([45.6406, 0.1096], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapBoth);

  // Fix Leaflet's default icon path when using CDN
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'img/marker-icon-2x.png',
    iconUrl:       'img/marker-icon.png',
    shadowUrl:     'img/marker-shadow.png',
  });


  markersLayer = L.layerGroup().addTo(map);
  markersBothLayer = L.layerGroup().addTo(mapBoth);

  map.on('moveend', applyFilters);
  mapBoth.on('moveend', applyFilters);
}

function updateMap(filtered, layer) {
  layer.clearLayers();
  filtered.forEach((photo, index) => {
    if (photo.latitude && photo.longitude) {
      //img.src = '/resized/large/' + photo.chemin;
      const path = 'resized/large/' + ((index % 2 === 0) ? '1.jpg' : '2.jpg');
      const marker = L.marker([photo.latitude, photo.longitude])
        .bindPopup(`<strong>${photo.numero}</strong><br><img src="${path}" width="100">`);
      layer.addLayer(marker);
    }
  });
}

function showTab(id) {
  document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
  document.getElementById(`${id}-tab`).style.display = 'block';
}

showTab('list');

