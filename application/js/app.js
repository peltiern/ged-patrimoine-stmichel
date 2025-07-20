let data = [];
let pageCourante = 1;
const nbPhotosParPage = 12;
let carte;
let themesSelectionnes = [];
let lieuxSelectionnes = [];
let anneeDebut = 1900;
let anneeFin = 2025;
let inclurePhotosSansDate = true;
let markerMap = new Map();
let markerClusters;
let currentLightboxIndex = 0;
let listeFiltreeCourante = [];

const cordonneesCentre = [45.6406, 0.1096];
const zoomInitial = 14;

// Lecture du fichier des photos + initialisation des filtres et de la carte
fetch('data/photos_saint_michel.json')
    .then(res => res.json())
    .then(json => {
      data = json;
      initialiserFiltres();
      initialiserCartes();
      filtrerPhotos();
    });

function initialiserFiltres() {
  const themes = new Set();
  const lieux = new Set();

  data.forEach(photo => {
    photo.themes?.forEach(t => themes.add(t));
    photo.lieu?.forEach(l => lieux.add(l));
  });

  // Création des deux menus déroulants
  creerMultiselect('filtre-themes', Array.from(themes).sort(), themesSelectionnes, filtrerPhotos);
  creerMultiselect('filtre-lieux', Array.from(lieux).sort(), lieuxSelectionnes, filtrerPhotos);

  const cbSansDate = document.getElementById('filtre-sans-date-cb');
  cbSansDate.onchange = () => {
    inclurePhotosSansDate = cbSansDate.checked;
    filtrerPhotos();
  };

}

function creerMultiselect(containerId, valeurs, tableauSelection, onChange) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'custom-multiselect';

  const button = document.createElement('div');
  button.className = 'custom-multiselect-button';
  button.textContent = 'Sélectionner...';
  button.onclick = () => wrapper.classList.toggle('open');

  const options = document.createElement('div');
  options.className = 'custom-multiselect-options';

  valeurs.forEach(val => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = val;
    input.checked = tableauSelection.includes(val);

    input.onchange = () => {
      if (input.checked) {
        tableauSelection.push(val);
      } else {
        const idx = tableauSelection.indexOf(val);
        if (idx !== -1) tableauSelection.splice(idx, 1);
      }
      mettreAJourLabel(button, tableauSelection);
      onChange();
    };

    label.appendChild(input);
    label.appendChild(document.createTextNode(val));
    options.appendChild(label);
  });

  wrapper.appendChild(button);
  wrapper.appendChild(options);
  container.appendChild(wrapper);
  mettreAJourLabel(button, tableauSelection);
}

// Met à jour le texte du bouton selon le nombre de valeurs sélectionnées
function mettreAJourLabel(button, selection) {
  if (selection.length === 0) {
    button.textContent = 'Sélectionner...';
  } else if (selection.length === 1) {
    button.textContent = selection[0];
  } else {
    button.textContent = `${selection.length} sélectionnés`;
  }
  button.title = selection.join(', ');
}

// Fermer les menus ouverts quand on clique ailleurs
document.addEventListener('click', (e) => {
  document.querySelectorAll('.custom-multiselect').forEach(ms => {
    if (!ms.contains(e.target)) {
      ms.classList.remove('open');
    }
  });
});


function trierListe(filtered) {
  filtered.sort((a, b) => {
    const parseDate = (str) => {
      if (!str) return null;
      const m = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (!m) return null;
      return new Date(`${m[3]}-${m[2]}-${m[1]}`); // yyyy-MM-dd
    };

    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);

    // Si les deux ont une date : trier par date, puis par nom
    if (dateA && dateB) {
      const cmpDate = dateA - dateB;
      if (cmpDate !== 0) return cmpDate;
      return a.numero.localeCompare(b.numero);
    }

    // Si un seul a une date → celui avec date vient avant
    if (dateA && !dateB) return -1;
    if (!dateA && dateB) return 1;

    // Les deux n'ont pas de date → trier par nom uniquement
    return a.numero.localeCompare(b.numero);
  });
}

function filtrerPhotos() {

  let filtered = data.filter(photo => {

    // Exclure les photos sans date si la checkbox n'est pas coché
    if (!inclurePhotosSansDate && (!photo.date || typeof photo.date !== 'string')) return false;

    let dateOk = true;
    if (photo.date && typeof photo.date === 'string') {
      // Extraire l'année à partir de 'dd/MM/yyyy'
      const match = photo.date.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (!match) return false;

      const anneePhoto = parseInt(match[3]);
      if (isNaN(anneePhoto)) return false;

      // Appliquer le filtre année
      dateOk = (!isNaN(anneeDebut) ? anneePhoto >= anneeDebut : true)
          && (!isNaN(anneeFin) ? anneePhoto <= anneeFin : true);
      if (!dateOk) return false;
    }

    const themeMatch = themesSelectionnes.length === 0 || photo.themes?.some(t => themesSelectionnes.includes(t));
    if (!themeMatch) return false;

    const lieuMatch = lieuxSelectionnes.length === 0 || photo.lieu?.some(l => lieuxSelectionnes.includes(l));
    if (!lieuMatch) return false;

    return dateOk && themeMatch && lieuMatch;
  });
  trierListe(filtered);

  listeFiltreeCourante = filtered;

  genererListe(filtered, "resultats-liste");
  afficherHeatmap();
  majCarte(filtered, markerClusters, markerMap);

  if (document.querySelector('.contenu-onglet.active')?.id.includes('carte')) {
    carte.invalidateSize();
  }
}

function calculerIntensiteParAnnee() {
  const intensite = {};
  listeFiltreeCourante.forEach(photo => {
    if (photo.date) {
      const match = photo.date.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (match) {
        const annee = parseInt(match[3]);
        intensite[annee] = (intensite[annee] || 0) + 1;
      }
    }
  });
  return intensite;
}

function afficherHeatmap() {
  const intensite = calculerIntensiteParAnnee();
  const max = Math.max(...Object.values(intensite));
  const heatmap = document.getElementById('timeline-heatmap');
  heatmap.innerHTML = '';

  for (let an = anneeMin; an <= anneeMax; an++) {
    const val = intensite[an] || 0;
    const ratio = val / max;
    const couleur = `rgba(255, 0, 0, ${ratio})`; // plus rouge s'il y a plus de photos

    const segment = document.createElement('div');
    segment.style.flex = '1';
    segment.style.backgroundColor = couleur;
    heatmap.appendChild(segment);
  }
}


function genererListe(filtered, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  if (filtered && filtered.length > 0) {
    const pageItems = filtered.slice((pageCourante - 1) * nbPhotosParPage, pageCourante * nbPhotosParPage);

    pageItems.forEach((photo, index) => {
      const item = document.createElement('div');
      item.className = 'photo-item';

      const img = document.createElement('img');
      img.src = 'resized/large/' + photo.chemin;
      img.alt = photo.numero;

      item.appendChild(img);
      container.appendChild(item);

      item.addEventListener('click', () => {
        openLightbox(index + (pageCourante - 1) * nbPhotosParPage);
      });
    });
  }


  if (containerId === "resultats-liste") {
    genererPagination(filtered.length);
  }
}

function genererPagination(totalItems) {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  const nbTotalPages = Math.ceil(totalItems / nbPhotosParPage);

  // ⚠️ Cas spécial : aucune photo => page 0/0 et boutons désactivés
  if (nbTotalPages === 0) {
    const boutons = ['«', '<', '>', '»'];
    boutons.forEach(texte => {
      const btn = document.createElement('button');
      btn.textContent = texte;
      btn.disabled = true;
      pagination.appendChild(btn);
    });

    const pageInfo = document.createElement('span');
    pageInfo.style.marginLeft = '10px';
    pageInfo.textContent = `Page 0 / 0`;
    pagination.appendChild(pageInfo);

    return;
  }

  // ⚠️ Sécurise la page courante si elle est hors limites
  if (pageCourante > nbTotalPages) pageCourante = nbTotalPages;

  const nbMaxPagesAffichees = 5;

  // Bouton "Première page"
  const boutonPremierePage = document.createElement('button');
  boutonPremierePage.textContent = '«';
  boutonPremierePage.disabled = pageCourante === 1;
  boutonPremierePage.onclick = () => {
    pageCourante = 1;
    filtrerPhotos();
  };
  pagination.appendChild(boutonPremierePage);

  // Bouton "Précédent"
  const boutonPrecedent = document.createElement('button');
  boutonPrecedent.textContent = '<';
  boutonPrecedent.disabled = pageCourante === 1;
  boutonPrecedent.onclick = () => {
    if (pageCourante > 1) {
      pageCourante--;
      filtrerPhotos();
    }
  };
  pagination.appendChild(boutonPrecedent);

  // Calcul des pages à afficher
  let premierePageAffichee = Math.max(1, pageCourante - Math.floor(nbMaxPagesAffichees / 2));
  let dernierePageAffichee = Math.min(nbTotalPages, premierePageAffichee + nbMaxPagesAffichees - 1);
  if (dernierePageAffichee - premierePageAffichee < nbMaxPagesAffichees - 1) {
    premierePageAffichee = Math.max(1, dernierePageAffichee - nbMaxPagesAffichees + 1);
  }

  // Boutons de pages
  for (let i = premierePageAffichee; i <= dernierePageAffichee; i++) {
    if (i === pageCourante) {
      const pageInput = document.createElement('input');
      pageInput.type = 'number';
      pageInput.min = 1;
      pageInput.max = nbTotalPages;
      pageInput.value = pageCourante;
      pageInput.style.width = '50px';
      pageInput.onchange = () => {
        const page = parseInt(pageInput.value);
        if (page >= 1 && page <= nbTotalPages) {
          pageCourante = page;
          filtrerPhotos();
        }
      };
      pagination.appendChild(pageInput);
    } else {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.onclick = () => {
        pageCourante = i;
        filtrerPhotos();
      };
      pagination.appendChild(btn);
    }
  }

  // Bouton "Suivant"
  const boutonSuivant = document.createElement('button');
  boutonSuivant.textContent = '>';
  boutonSuivant.disabled = pageCourante === nbTotalPages;
  boutonSuivant.onclick = () => {
    if (pageCourante < nbTotalPages) {
      pageCourante++;
      filtrerPhotos();
    }
  };
  pagination.appendChild(boutonSuivant);

  // Bouton "Dernière page"
  const boutonDernierePage = document.createElement('button');
  boutonDernierePage.textContent = '»';
  boutonDernierePage.disabled = pageCourante === nbTotalPages;
  boutonDernierePage.onclick = () => {
    pageCourante = nbTotalPages;
    filtrerPhotos();
  };
  pagination.appendChild(boutonDernierePage);

  // Affichage "Page X sur Y"
  const pageInfo = document.createElement('span');
  pageInfo.style.marginLeft = '10px';
  pageInfo.textContent = `Page ${pageCourante} / ${nbTotalPages}`;
  pagination.appendChild(pageInfo);
}

function initialiserCartes() {
  carte = L.map('carte').setView(cordonneesCentre, zoomInitial);

  L.tileLayer('img/tuiles/osm/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(carte);

  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'img/marker-icon-2x.png',
    iconUrl: 'img/marker-icon.png',
    shadowUrl: 'img/marker-shadow.png',
  });

  markerClusters = L.markerClusterGroup();
  carte.addLayer(markerClusters);
}

function majCarte(photosFiltrees, clusterGroup) {
  if (!clusterGroup) return;

  clusterGroup.clearLayers();

  photosFiltrees.forEach((photo, index) => {

    currentLightboxIndex = listeFiltreeCourante.indexOf(photo);

    if (photo.latitude && photo.longitude) {
      const path = 'resized/large/' + photo.chemin;

      const marker = L.marker([photo.latitude, photo.longitude])
          .bindPopup(`<strong>${photo.numero}</strong><br><img src="${path}" width="150" onclick="openLightbox(${currentLightboxIndex})">`);

      marker.on('dblclick', () => {
        if (currentLightboxIndex !== -1) {
          openLightbox(currentLightboxIndex);
        }
      });

      clusterGroup.addLayer(marker);
    }
  });
}

function openLightbox(index) {
  currentLightboxIndex = index;
  displayLightbox();

  document.getElementById('lightbox').classList.remove('hidden');
}

function displayLightbox() {
  const photo = listeFiltreeCourante[currentLightboxIndex];
  const path = 'resized/large/' + photo.chemin;

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
  if (currentLightboxIndex < listeFiltreeCourante.length - 1) {
    currentLightboxIndex++;
    displayLightbox();
  }
});

document.getElementById('lightbox').addEventListener('click', (e) => {
  if (e.target.id === 'lightbox') {
    document.getElementById('lightbox').classList.add('hidden');
  }
});


function afficherOnglet(id) {
  document.querySelectorAll('.contenu-onglet').forEach(t => t.classList.remove('active'));
  document.getElementById(`onglet-${id}`).classList.add('active');

  if (id === 'carte') {
    setTimeout(() => {
      carte.invalidateSize();
    }, 300);
  }
}

afficherOnglet('liste');


/** Slider - Timeline */
const anneeMin = 1900;
const anneeMax = 2025;
const anneeExplore = 1985;

const timeline = document.getElementById('timeline');
const left = document.getElementById('handle-left');
const right = document.getElementById('handle-right');
const explore = document.getElementById('handle-explore');
const labelLeft = document.getElementById('label-left');
const labelRight = document.getElementById('label-right');
const labelExplore = document.getElementById('label-explore');
const highlight = document.getElementById('highlight');
const status = document.getElementById('status');

const getBarWidth = () => timeline.clientWidth;

const setPosition = (el, percent) => {
  el.style.left = `calc(${percent}% - 10px)`;
};

const percentToYear = (percent) => {
  return Math.round(anneeMin + (anneeMax - anneeMin) * (percent / 100));
};

const yearToPercent = (year) => ((year - anneeMin) / (anneeMax - anneeMin)) * 100;


const updateLabels = () => {
  const leftPct = parseFloat(left.dataset.percent);
  const rightPct = parseFloat(right.dataset.percent);
  const explorePct = parseFloat(explore.dataset.percent);

  labelLeft.innerText = percentToYear(leftPct);
  labelRight.innerText = percentToYear(rightPct);
  labelExplore.innerText = percentToYear(explorePct);
};

const updateHighlight = () => {
  const leftPct = parseFloat(left.dataset.percent);
  const rightPct = parseFloat(right.dataset.percent);
  const x = Math.min(leftPct, rightPct);
  const w = Math.abs(rightPct - leftPct);
  highlight.style.left = `${x}%`;
  highlight.style.width = `${w}%`;
};

const updateDatesRange = () => {
  anneeDebut = percentToYear(parseFloat(left.dataset.percent));
  anneeFin = percentToYear(parseFloat(right.dataset.percent));
  filtrerPhotos();
};

const updateDatesExplore = () => {
  anneeDebut = percentToYear(parseFloat(explore.dataset.percent));
  anneeFin = percentToYear(parseFloat(explore.dataset.percent));
  filtrerPhotos();
};

const initPosition = (el, percent) => {
  el.dataset.percent = percent;
  setPosition(el, percent);
};

const makeDraggable = (el, updateCallback, constraints = null) => {
  let dragging = false;

  el.addEventListener('mousedown', () => {
    dragging = true;
    document.body.style.userSelect = 'none';
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const rect = timeline.getBoundingClientRect();
    let percent = ((e.clientX - rect.left) / rect.width) * 100;
    percent = Math.max(0, Math.min(100, percent));

    if (constraints) {
      if (typeof constraints.min === 'function') percent = Math.max(percent, constraints.min());
      if (typeof constraints.max === 'function') percent = Math.min(percent, constraints.max());
    }

    el.dataset.percent = percent;
    setPosition(el, percent);
    updateLabels();
    updateHighlight();
  });

  window.addEventListener('mouseup', () => {
    if (dragging && (el === explore)) updateDatesExplore();
    if (dragging && (el === left || el === right)) updateDatesRange();
    dragging = false;
    document.body.style.userSelect = 'auto';
  });
};

// Initial positions
initPosition(left, yearToPercent(anneeMin));
initPosition(right, yearToPercent(anneeMax));
initPosition(explore, yearToPercent(anneeExplore));

// Drag logic
makeDraggable(left, updateHighlight, {
  max: () => parseFloat(right.dataset.percent) - 1
});
makeDraggable(right, updateHighlight, {
  min: () => parseFloat(left.dataset.percent) + 1
});
makeDraggable(explore, updateHighlight);

updateLabels();
updateHighlight();
updateDatesRange();
