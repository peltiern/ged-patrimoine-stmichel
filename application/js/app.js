let data = [];
let currentPage = 1;
const itemsPerPage = 20;
let map, mapBoth, markersLayer, markersBothLayer;
let selectedThemes = [];
let selectedLieux = [];
let markerMap = new Map();
let markerBothMap = new Map();
let markerClusters, markerBothClusters;
let currentLightboxIndex = 0;
let currentFilteredList = [];

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

  const themeContainer = document.getElementById('filter-themes');
  Array.from(allThemes).sort().forEach(t => {
    const btn = document.createElement('button');
    btn.className = 'filter-button';
    btn.textContent = t;
    btn.onclick = () => {
      if (selectedThemes.includes(t)) {
        selectedThemes = selectedThemes.filter(item => item !== t);
        btn.classList.remove('selected');
      } else {
        selectedThemes.push(t);
        btn.classList.add('selected');
      }
      currentPage = 1;
      applyFilters();
    };
    themeContainer.appendChild(btn);
  });

  const lieuContainer = document.getElementById('filter-lieux');
  Array.from(allLieux).sort().forEach(l => {
    const btn = document.createElement('button');
    btn.className = 'filter-button';
    btn.textContent = l;
    btn.onclick = () => {
      if (selectedLieux.includes(l)) {
        selectedLieux = selectedLieux.filter(item => item !== l);
        btn.classList.remove('selected');
      } else {
        selectedLieux.push(l);
        btn.classList.add('selected');
      }
      currentPage = 1;
      applyFilters();
    };
    lieuContainer.appendChild(btn);
  });

  document.querySelectorAll('input[type="date"]').forEach(el => {
    el.addEventListener('change', () => {
      currentPage = 1;
      applyFilters();
    });
  });
}

function applyFilters() {
  const dateStart = document.getElementById('filter-date-start').value;
  const dateEnd = document.getElementById('filter-date-end').value;

  let filtered = data.filter(photo => {
    const themeMatch = selectedThemes.length === 0 || photo.themes?.some(t => selectedThemes.includes(t));
    const lieuMatch = selectedLieux.length === 0 || photo.lieu?.some(l => selectedLieux.includes(l));
    return themeMatch && lieuMatch;
  });

  currentFilteredList = filtered; // Sauvegarder la liste filtrée

  renderList(filtered, "results-list", markerMap, map);
  renderList(filtered, "results-list-both", markerBothMap, mapBoth);
  updateMap(filtered, markerClusters, markerMap);
  updateMap(filtered, markerBothClusters, markerBothMap);

  if (document.querySelector('.tab-content.active')?.id.includes('map')) {
    map.invalidateSize();
    mapBoth.invalidateSize();
  }
}

function renderList(filtered, containerId, markerMapping, leafletMap) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  markerMapping.clear();

  const pageItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  pageItems.forEach((photo, index) => {
    const row = document.createElement('div');
    row.className = 'photo-row';

    const img = document.createElement('img');
    img.src = 'resized/large/' + ((index % 2 === 0) ? '1.jpg' : '2.jpg');
    img.alt = photo.numero;

    const info = document.createElement('div');
    info.className = 'photo-info';
    info.innerHTML = `<strong>${photo.numero}</strong><br>${photo.date || ''}<br>${(photo.themes || []).join(', ')}`;

    row.appendChild(img);
    row.appendChild(info);
    container.appendChild(row);

    row.addEventListener('click', () => {
      openLightbox(index + (currentPage - 1) * itemsPerPage);
    });

    row.addEventListener('mouseenter', () => {
      const marker = markerMapping.get(photo.numero);
      if (marker) markerBounce(marker);
    });
  });

  if (containerId === "results-list") {
    renderPagination(filtered.length);
  }
}

function renderPagination(totalItems) {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const maxPageButtons = 5; // nombre maximum de pages visibles autour de la page courante

  // Bouton "Première page"
  const firstBtn = document.createElement('button');
  firstBtn.textContent = '«';
  firstBtn.disabled = currentPage === 1;
  firstBtn.onclick = () => {
    currentPage = 1;
    applyFilters();
  };
  pagination.appendChild(firstBtn);

  // Bouton "Précédent"
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '<';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      applyFilters();
    }
  };
  pagination.appendChild(prevBtn);

  // Calcul des pages à afficher
  let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
  if (endPage - startPage < maxPageButtons - 1) {
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }

  // Boutons de pages
  for (let i = startPage; i <= endPage; i++) {

    if (i === currentPage) {
      // Champ de saisie direct
      const pageInput = document.createElement('input');
      pageInput.type = 'number';
      pageInput.min = 1;
      pageInput.max = totalPages;
      pageInput.value = currentPage;
      pageInput.style.width = '50px';
      pageInput.onchange = () => {
        const page = parseInt(pageInput.value);
        if (page >= 1 && page <= totalPages) {
          currentPage = page;
          applyFilters();
        }
      };
      pagination.appendChild(pageInput);
    } else {
      const btn = document.createElement('button');
      btn.textContent = i;

      btn.onclick = () => {
        currentPage = i;
        applyFilters();
      };

      pagination.appendChild(btn);
    }
  }

  // Bouton "Suivant"
  const nextBtn = document.createElement('button');
  nextBtn.textContent = '>';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      applyFilters();
    }
  };
  pagination.appendChild(nextBtn);

  // Bouton "Dernière page"
  const lastBtn = document.createElement('button');
  lastBtn.textContent = '»';
  lastBtn.disabled = currentPage === totalPages;
  lastBtn.onclick = () => {
    currentPage = totalPages;
    applyFilters();
  };
  pagination.appendChild(lastBtn);

  // Affichage "Page X sur Y"
  const pageInfo = document.createElement('span');
  pageInfo.style.marginLeft = '10px';
  pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
  pagination.appendChild(pageInfo);
}

function initMaps() {
  map = L.map('map').setView([45.6406, 0.1096], 14);
  mapBoth = L.map('map-both').setView([45.6406, 0.1096], 14);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapBoth);

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'img/marker-icon-2x.png',
    iconUrl: 'img/marker-icon.png',
    shadowUrl: 'img/marker-shadow.png',
  });

  markerClusters = L.markerClusterGroup();
  markerBothClusters = L.markerClusterGroup();
  map.addLayer(markerClusters);
  mapBoth.addLayer(markerBothClusters);
}

function updateMap(filtered, clusterGroup, markerMapping) {
  clusterGroup.clearLayers();
  markerMapping.clear();

  filtered.forEach((photo, index) => {
    if (photo.latitude && photo.longitude) {
      const path = 'resized/large/' + ((index % 2 === 0) ? '1.jpg' : '2.jpg');

      const marker = L.marker([photo.latitude, photo.longitude])
          .bindPopup(`<strong>${photo.numero}</strong><br><img src="${path}" width="100">`);

      markerMapping.set(photo.numero, marker);
      clusterGroup.addLayer(marker);
    }
  });
}

function markerBounce(marker) {
  const originalIcon = marker.getIcon();
  const bounceIcon = L.divIcon({
    html: '<div style="width: 25px; height: 41px; background: red; border-radius: 50%;"></div>',
    iconSize: [25, 41],
    className: ''
  });

  marker.setIcon(bounceIcon);
  setTimeout(() => {
    marker.setIcon(originalIcon);
  }, 600);
}

function openLightbox(index) {
  currentLightboxIndex = index;
  displayLightbox();

  document.getElementById('lightbox').classList.remove('hidden');
}

function displayLightbox() {
  const photo = currentFilteredList[currentLightboxIndex];
  const path = 'resized/large/' + ((currentLightboxIndex % 2 === 0) ? '1.jpg' : '2.jpg');

  document.getElementById('lightbox-body').innerHTML = `
  <div class="lightbox-image-container">
    <img src="${path}" alt="${photo.numero}">
  </div>
  <div class="lightbox-text">
    <div><strong>${photo.numero}</strong></div>
    <div>Date: ${photo.date || ''}</div>
    <div>Themes: ${(photo.themes || []).join(', ')}</div>
    <div>Lieux: ${(photo.lieu || []).join(', ')}</div>
  </div>
`;

}

document.getElementById('lightbox-close').addEventListener('click', () => {
  document.getElementById('lightbox').classList.add('hidden');
});

document.getElementById('lightbox-prev').addEventListener('click', () => {
  if (currentLightboxIndex > 0) {
    currentLightboxIndex--;
    displayLightbox();
  }
});

document.getElementById('lightbox-next').addEventListener('click', () => {
  if (currentLightboxIndex < currentFilteredList.length - 1) {
    currentLightboxIndex++;
    displayLightbox();
  }
});

document.getElementById('lightbox').addEventListener('click', (e) => {
  if (e.target.id === 'lightbox') {
    document.getElementById('lightbox').classList.add('hidden');
  }
});


function showTab(id) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.getElementById(`${id}-tab`).classList.add('active');

  if (id === 'map' || id === 'both') {
    setTimeout(() => {
      map.invalidateSize();
      mapBoth.invalidateSize();
    }, 300);
  }
}

showTab('list');
