let data = [];
let pageCourante = 1;
const nbPhotosParPage = 12;
let carte;
let themesSelectionnes = [];
let lieuxSelectionnes = [];
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
      pageCourante = 1;
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


function filtrerPhotos() {
  // const dateStart = document.getElementById('filter-date-start').value;
  // const dateEnd = document.getElementById('filter-date-end').value;

  let filtered = data.filter(photo => {
    const themeMatch = themesSelectionnes.length === 0 || photo.themes?.some(t => themesSelectionnes.includes(t));
    const lieuMatch = lieuxSelectionnes.length === 0 || photo.lieu?.some(l => lieuxSelectionnes.includes(l));
    return themeMatch && lieuMatch;
  });

  listeFiltreeCourante = filtered;

  genererListe(filtered, "resultats-liste");
  majCarte(filtered, markerClusters, markerMap);

  if (document.querySelector('.contenu-onglet.active')?.id.includes('carte')) {
    carte.invalidateSize();
  }
}

function genererListe(filtered, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const pageItems = filtered.slice((pageCourante - 1) * nbPhotosParPage, pageCourante * nbPhotosParPage);

  pageItems.forEach((photo, index) => {
    const item = document.createElement('div');
    item.className = 'photo-item';

    const img = document.createElement('img');
    img.src = 'resized/large/' + photo.chemin;
    img.alt = photo.numero;

    const info = document.createElement('div');
    info.className = 'photo-info';
    info.innerHTML = `
    <strong>${photo.numero}</strong><br>
    ${photo.date || ''}<br>
    ${(photo.themes || []).join(', ')}
  `;

    item.appendChild(img);
    item.appendChild(info);
    container.appendChild(item);

    item.addEventListener('click', () => {
      openLightbox(index + (pageCourante - 1) * nbPhotosParPage);
    });
  });


  if (containerId === "resultats-liste") {
    genererPagination(filtered.length);
  }
}

function genererPagination(totalItems) {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  const nbTotalPages = Math.ceil(totalItems / nbPhotosParPage);
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
      // Champ de saisie direct
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
  clusterGroup.clearLayers();

  photosFiltrees.forEach((photo, index) => {
    if (photo.latitude && photo.longitude) {
      const path = 'resized/large/' + photo.chemin;

      const marker = L.marker([photo.latitude, photo.longitude])
          .bindPopup(`<strong>${photo.numero}</strong><br><img src="${path}" width="100">`);
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
