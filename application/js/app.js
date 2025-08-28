let data = [];
let pageCourante = 1;
const nbPhotosParPage = 12;
let carte;
let themesSelectionnes = [];
let lieuxSelectionnes = [];
let anneeDebut = 1851;
let anneeFin = 2025;
let inclurePhotosSansDate = true;
let markerMap = new Map();
let markerClusters;
let currentLightboxIndex = 0;
let listeFiltreeCourante = [];

/** Slider - Timeline */
const anneeMin = 1851;
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

/** Carte */
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

function reinitialiserFiltres() {
    themesSelectionnes.length = 0;
    lieuxSelectionnes.length = 0;
    inclurePhotosSansDate = true;
    anneeDebut = anneeMin;
    anneeFin = anneeMax;

    document.getElementById('filtre-sans-date-cb').checked = true;
    document.querySelectorAll('.custom-multiselect input[type=checkbox]').forEach(cb => cb.checked = false);
    document.querySelectorAll('.custom-multiselect-button').forEach(button => button.textContent = 'Sélectionner...');

    initPosition(left, 0);
    initPosition(right, 100);
    updateLabels();
    updateHighlight();
    updateDatesRange();

    filtrerPhotos();
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
    const intensite = {}; // pour la heatmap
    const filtered = [];

    data.forEach(photo => {
        // Appliquer uniquement les filtres thèmes, lieux, inclure/exclure sans-date pour la heatmap
        if (!inclurePhotosSansDate && (!photo.date || typeof photo.date !== 'string')) return;

        const themeMatch = themesSelectionnes.length === 0 || photo.themes?.some(t => themesSelectionnes.includes(t));
        if (!themeMatch) return;

        const lieuMatch = lieuxSelectionnes.length === 0 || photo.lieu?.some(l => lieuxSelectionnes.includes(l));
        if (!lieuMatch) return;

        // La photo passe les filtres non liés aux années → comptage heatmap
        if (photo.date) {
            const match = photo.date.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (match) {
                const annee = parseInt(match[3]);
                intensite[annee] = (intensite[annee] || 0) + 1;
            }
        }

        // Vérification filtre par année pour affichage
        let dateOk = true;
        if (photo.date && typeof photo.date === 'string') {
            const match = photo.date.match(/(\d{2})\/(\d{2})\/(\d{4})/);
            if (!match) return;

            const anneePhoto = parseInt(match[3]);
            if (isNaN(anneePhoto)) return;

            dateOk = (!isNaN(anneeDebut) ? anneePhoto >= anneeDebut : true)
                && (!isNaN(anneeFin) ? anneePhoto <= anneeFin : true);
        }

        if (dateOk) filtered.push(photo);
    });

    trierListe(filtered);
    listeFiltreeCourante = filtered;
    document.getElementById('compteur-photos').textContent = `${filtered.length} photo(s)`;

    genererListe(filtered, "resultats-liste");
    afficherHeatmap(intensite);
    majCarte(filtered, markerClusters, markerMap);

    if (document.querySelector('.contenu-onglet.active')?.id.includes('carte')) {
        carte.invalidateSize();
    }
}

function afficherHeatmap(intensite) {
    const max = Math.max(...Object.values(intensite), 1);
    const heatmap = document.getElementById('timeline-heatmap');
    heatmap.innerHTML = '';

    for (let an = anneeMin; an <= anneeMax; an++) {
        const val = intensite[an] || 0;
        const ratio = val / max;
        const couleur = `rgba(255, 193, 7, ${ratio})`;
        const segment = document.createElement('div');
        segment.style.flex = '1';
        segment.style.backgroundColor = couleur;
        if (val > 0) {
            segment.title = `${an} : ${val} photo(s)`;
        }
        heatmap.appendChild(segment);
    }
}

function genererListe(filtered, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    if (filtered && filtered.length > 0) {
        const pageItems = filtered.slice((pageCourante - 1) * nbPhotosParPage, pageCourante * nbPhotosParPage);

        pageItems.forEach((photo, index) => {

            const item = genererPhotoOverlay(photo, 'photo-item', '28px', 'photo-title-small');

            // Click pour ouvrir lightbox
            item.addEventListener('click', () => {
                openLightbox(index + (pageCourante - 1) * nbPhotosParPage);
            });

            container.appendChild(item);
        });
    }

    if (containerId === "resultats-liste") {
        genererPagination(filtered.length);
    }
}


function genererPagination(totalItems) {
    pageCourante = 1;

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
        pageInfo.textContent = `0 / 0`;
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

    // Affichage "X sur Y"
    const pageInfo = document.createElement('span');
    pageInfo.style.marginLeft = '10px';
    pageInfo.textContent = `${pageCourante} / ${nbTotalPages}`;
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

        const indexPhoto = listeFiltreeCourante.indexOf(photo);

        if (photo.latitude && photo.longitude) {
            const path = 'resized/large/' + photo.chemin;

            const marker = L.marker([photo.latitude, photo.longitude])
                .bindPopup(`<strong>${photo.numero}</strong><br><img src="${path}" width="150" onclick="openLightbox(${indexPhoto})">`);

            marker.on('dblclick', () => {
                if (indexPhoto !== -1) {
                    openLightbox(indexPhoto);
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

function genererPhotoOverlay(photo, itemClassName, overlayMaxHeight, classNamePhotoTitle) {

    const item = document.createElement('div');
    item.className = itemClassName;

    // Image
    const img = document.createElement('img');
    img.src = 'resized/large/' + photo.chemin;
    img.alt = photo.numero;

    ajouterZoomEtDeplacementPhoto(img, item);

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'photo-overlay';
    overlay.style.maxHeight = overlayMaxHeight; // hauteur repliée par défaut

    // Overlay header
    const overlayHeader = document.createElement('div');
    overlayHeader.className = 'overlay-header';

    // Titre
    const photoTitle = document.createElement('div');
    photoTitle.className = classNamePhotoTitle;
    photoTitle.textContent = photo.numero;

    overlayHeader.appendChild(photoTitle);

    // Overlay infos
    const overlayInfos = document.createElement('div');
    overlayInfos.className = 'overlay-infos';

    // Détails
    const photoDetails = document.createElement('div');
    photoDetails.className = 'photo-details';

    // Date
    const dateDiv = document.createElement('div');
    dateDiv.textContent = `Date : ${photo.date || 'Inconnue'}`;
    photoDetails.appendChild(dateDiv);

    // Thèmes
    const themesDiv = document.createElement('div');
    themesDiv.textContent = `Thèmes : ${(photo.themes || []).join(', ') || 'Aucun'}`;
    photoDetails.appendChild(themesDiv);

    // Lieux
    const lieuxDiv = document.createElement('div');
    lieuxDiv.textContent = `Lieux : ${(photo.lieu || []).join(', ') || 'Inconnu'}`;
    photoDetails.appendChild(lieuxDiv);

    // Assemblage overlay infos
    overlayInfos.appendChild(photoDetails);

    // Assemblage overlay
    overlay.appendChild(overlayHeader);
    overlay.appendChild(overlayInfos);

    const openOverlay = () => {
        overlay.style.maxHeight = '100%';
        overlay.classList.add('open');
    };
    const closeOverlay = () => {
        overlay.style.maxHeight = overlayMaxHeight;
        overlay.classList.remove('open');
    };

    overlayHeader.addEventListener('mouseenter', openOverlay);
    overlayInfos.addEventListener('mouseenter', openOverlay);
    overlay.addEventListener('mouseleave', closeOverlay);

    // Assemblage final
    item.appendChild(img);
    item.appendChild(overlay);

    return item;
}

function ajouterZoomEtDeplacementPhoto(img, container) {
    let scale = 1;
    let translateX = 0;
    let translateY = 0;

    let isDragging = false;
    let startX, startY;

// Gestion du zoom avec la molette
    container.addEventListener("wheel", (e) => {
        e.preventDefault();

        const zoomIntensity = 0.1;
        if (e.deltaY < 0) {
            scale += zoomIntensity;
        } else {
            scale = Math.max(0.5, scale - zoomIntensity); // limite zoom out
        }
        updateTransform(img, translateX, translateY, scale);
    }, { passive: false });

// Déplacement avec clic gauche
    container.addEventListener("mousedown", (e) => {
        e.preventDefault();
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        container.style.cursor = "grabbing";
    });

    window.addEventListener("mouseup", () => {
        isDragging = false;
        container.style.cursor = "grab";
    });

    window.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        translateX = e.clientX - startX;
        translateY = e.clientY - startY;
        updateTransform(img, translateX, translateY, scale);
    });
}

// Applique la transformation
function updateTransform(img, translateX, translateY, scale) {
    img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}


function displayLightbox() {
    const container = document.getElementById('lightbox-body');
    container.innerHTML = '';

    const photo = listeFiltreeCourante[currentLightboxIndex];

    container.appendChild(genererPhotoOverlay(photo, 'lightbox-image-container', '40px', 'photo-title-large'));
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

const menuBtn = document.getElementById('lightbox-menu');
const menuPopup = document.getElementById('lightbox-menu-popup');

// Toggle affichage du menu
menuBtn.addEventListener('click', () => {
    menuPopup.classList.toggle('hidden');
});

// Fermer le menu si on clique ailleurs
document.addEventListener('click', (e) => {
    if (!menuBtn.contains(e.target) && !menuPopup.contains(e.target)) {
        menuPopup.classList.add('hidden');
    }
});

// Action "Signaler"
document.getElementById('menu-report').addEventListener('click', () => {
    menuPopup.classList.add('hidden');
    const photo = listeFiltreeCourante[currentLightboxIndex];
    openReportForm(photo.numero);
});


async function openReportForm(photoNum) {
    const overlay = document.getElementById('report-container');
    const content = overlay.querySelector('.report-content');

    // Charger le formulaire depuis le composant
    const res = await fetch('components/contact-form.html');
    const html = await res.text();
    content.innerHTML = `
    <button class="report-close" title="Fermer">&times;</button>
    ${html}
  `;

    // Préremplir les champs cachés
    initContactForm({
        mode: 'signalement',
        photo: photoNum
    });

    // Afficher l'overlay
    overlay.classList.remove('hidden');

    // Fermer en cliquant sur le bouton de fermeture
    content.querySelector('.report-close').onclick = () => {
        overlay.classList.add('hidden');
    };

    // Fermer si on clique en dehors du formulaire
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.classList.add('hidden');
        }
    };
}

function afficherOnglet(id) {
    document.querySelectorAll('.contenu-onglet').forEach(t => t.classList.remove('active'));
    document.getElementById(`onglet-${id}`).classList.add('active');

    // Activer/désactiver les boutons
    document.getElementById('btn-liste').disabled = (id === 'liste');
    document.getElementById('btn-carte').disabled = (id === 'carte');

    if (id === 'carte') {
        setTimeout(() => {
            carte.invalidateSize();
        }, 300);
    }
}


afficherOnglet('liste');

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

        // Activer le bon mode dès le clic
        if (el === explore) {
            setExploreMode(true);
        } else if (el === left || el === right) {
            setExploreMode(false);
        }
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
        if (dragging && el === explore) {
            updateDatesExplore();
        }
        if (dragging && (el === left || el === right)) {
            updateDatesRange();
        }
        dragging = false;
        document.body.style.userSelect = 'auto';
    });
};

function setExploreMode(active) {
    if (active) {
        left.classList.add('disabled');
        right.classList.add('disabled');
        highlight.classList.add('disabled');
        explore.classList.remove('disabled');
    } else {
        left.classList.remove('disabled');
        right.classList.remove('disabled');
        highlight.classList.remove('disabled');
        explore.classList.add('disabled');
    }
}

document.getElementById('reset-filtres').addEventListener('click', () => {
    reinitialiserFiltres();
});

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
setExploreMode(false);
