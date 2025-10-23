let data = [];
let pageCourante = 1;
const nbPhotosParPage = 12;
let carte;
let vuesNonVuesSelectionnes = [];
let themesSelectionnes = [];
let lieuxSelectionnes = [];
let termeRecherche = '';
let anneeDebut = 1851;
let anneeFin = 2025;
let inclurePhotosSansDate = true;
let markerMap = new Map();
let markerClusters;
let currentLightboxIndex = 0;
let listeFiltreeCourante = [];

/** Slider - Timeline */
const anneeMinInitiale = 1851;
const anneeMaxInitiale = 2025;
const anneeExploreInitiale = 1985;

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
    const listeVues = ['Toutes', 'Vues', 'Non vues'];
    const themes = new Set();
    const lieux = new Set();

    data.forEach(photo => {
        photo.themes?.forEach(t => themes.add(t));
        photo.lieu?.forEach(l => lieux.add(l));
    });

    // Création des menus déroulants
    creerListeSelectionnable('filtre-vues', listeVues, vuesNonVuesSelectionnes, filtrerPhotos, true);
    creerListeSelectionnable('filtre-themes', Array.from(themes).sort(), themesSelectionnes, filtrerPhotos, false);
    creerListeSelectionnable('filtre-lieux', Array.from(lieux).sort(), lieuxSelectionnes, filtrerPhotos, false);

    const inputTerme = document.getElementById('filtre-terme-photo-input');
    inputTerme.oninput = () => {
        termeRecherche = inputTerme.value;
        pageCourante = 1;
        filtrerPhotos();
    };

    const cbSansDate = document.getElementById('filtre-sans-date-cb');
    cbSansDate.onchange = () => {
        inclurePhotosSansDate = cbSansDate.checked;
        pageCourante = 1;
        filtrerPhotos();
    };
}

function creerListeSelectionnable(containerId, valeurs, tableauSelection, onChange, choixUnique) {
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
        input.type = choixUnique ? 'radio' : 'checkbox';
        input.name = choixUnique ? containerId + "_radio" : undefined;
        input.value = val;
        input.checked = tableauSelection.includes(val);

        input.onchange = () => {
            if (choixUnique) {
                // Si choix unique → remplacer entièrement le tableau
                tableauSelection.splice(0, tableauSelection.length, val);
                // fermer le menu après sélection
                wrapper.classList.remove("open");
            } else {
                // Sinon → comportement multiselect classique
                if (input.checked) {
                    tableauSelection.push(val);
                } else {
                    const idx = tableauSelection.indexOf(val);
                    if (idx !== -1) tableauSelection.splice(idx, 1);
                }
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

function reinitialiserFiltres() {
    vuesNonVuesSelectionnes.length = 0;
    themesSelectionnes.length = 0;
    lieuxSelectionnes.length = 0;
    termeRecherche = '';
    inclurePhotosSansDate = true;
    anneeDebut = anneeMinInitiale;
    anneeFin = anneeMaxInitiale;

    document.getElementById('filtre-terme-photo-input').value = '';
    document.getElementById('filtre-sans-date-cb').checked = true;
    document.querySelectorAll('.custom-multiselect input[type=radio]').forEach(cb => cb.checked = false);
    document.querySelectorAll('.custom-multiselect input[type=checkbox]').forEach(cb => cb.checked = false);
    document.querySelectorAll('.custom-multiselect-button').forEach(button => button.textContent = 'Sélectionner...');

    initPosition(left, 0);
    initPosition(right, 100);
    initPosition(explore, yearToPercent(anneeExploreInitiale));
    updateLabels();
    updateHighlight();
    updateDatesRange();
    setExploreMode(false);

    pageCourante = 1;
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

const normalize = (s) => String(s ?? '').toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

function filtrerPhotos() {
    const intensite = {}; // pour la heatmap
    const filtered = [];

    data.forEach(photo => {
        // Appliquer uniquement les filtres thèmes, lieux, inclure/exclure sans-date pour la heatmap
        if (!inclurePhotosSansDate && (!photo.date || typeof photo.date !== 'string')) return;

        const termeNorm = normalize(termeRecherche);
        const commentairesNorm = normalize(photo.commentaires);

        const termeMatch = termeRecherche.length === 0 || photo.numero?.includes(termeNorm) || commentairesNorm.includes(termeNorm);
        if (!termeMatch) return;

        const photosVues = getPhotosVues();
        const vuesNonVuesMatch = vuesNonVuesSelectionnes.length === 0
            || vuesNonVuesSelectionnes[0] === 'Toutes'
            || (vuesNonVuesSelectionnes[0] === 'Vues' && photosVues.includes(photo.numero))
            || (vuesNonVuesSelectionnes[0] === 'Non vues' && !photosVues.includes(photo.numero));
        if (!vuesNonVuesMatch) return;

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

    for (let an = anneeMinInitiale; an <= anneeMaxInitiale; an++) {
        const val = intensite[an] || 0;
        let ratio = val / max;
        if (val > 0) {
            const min = 0.15; // opacité mini (15%)
            ratio = min + (1 - min) * ratio;
        }
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

    const isLocal = window.ENV?.INTERNET !== true;

    L.tileLayer(isLocal ? 'img/tuiles/osm/{z}/{x}/{y}.png' : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
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
            const path = 'resized/small/' + photo.numero + '.jpg';

            const marker = L.marker([photo.latitude, photo.longitude]);

            // Ouvrir la popup au survol
            marker.on('mouseover', () => {
                const photoVue = getPhotosVues().includes(photo.numero);
                let badge = '';
                if (!photoVue) {
                    badge = '<div class="badge-new bottom"><span>N</span></div>'
                }
                marker.bindPopup(`${badge}<strong>${photo.numero}</strong><br><img src="${path}" width="200"">`);
                marker.openPopup();
            });

            // Fermer la popup quand la souris quitte le marker
            marker.on('mouseout', () => {
                marker.closePopup();
            });

            marker.on('click', () => {
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
    item.dataset.numero = photo.numero;

    // Image
    const img = document.createElement('img');
    img.src = 'resized/small/' + photo.numero + '.jpg';
    img.alt = photo.numero;

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'photo-overlay';

    // Overlay header
    const overlayHeader = document.createElement('div');
    overlayHeader.className = 'overlay-header';

    // Titre
    const photoTitle = document.createElement('div');
    photoTitle.className = classNamePhotoTitle;
    photoTitle.textContent = photo.numero;

    overlayHeader.appendChild(photoTitle);
    overlay.appendChild(overlayHeader);

    item.appendChild(img);
    item.appendChild(overlay);

    // Badge "Non vue"
    indiquerSiPhotoNonVues(item, photo.numero);

    return item;
}

function displayLightbox() {
    const photo = listeFiltreeCourante[currentLightboxIndex];

    // Image
    const img = document.getElementById('lightbox-img');
    img.src = 'resized/large/' + photo.numero + '.jpg';
    img.alt = photo.numero;

    // Date
    const date = document.getElementById('photo-date');
    date.innerText = `${photo.date || ''}`;

    // Lieu
    const lieu = document.getElementById('photo-lieu');
    if (photo.lieu && photo.lieu !== "") {
        if (date.innerText !== "") {
            lieu.innerText = ` -  ${photo.lieu}`;
        } else {
            lieu.innerText = `${photo.lieu}`;
        }
    } else {
        lieu.innerText = "";
    }

    // Description
    const description = document.getElementById('photo-description');
    if (photo.commentaires && photo.commentaires !== "") {
        if (date.innerText !== "" || lieu.innerText !== "") {
            description.innerText = ` -  ${photo.commentaires}`;
        } else {
            description.innerText = `${photo.commentaires}`;
        }
    } else {
        description.innerText = "";
    }

    // Source
    const source = document.getElementById('photo-source');
    source.innerText = `${photo.sources || ''}`;

    // Numéro
    const numero = document.getElementById('photo-numero');
    numero.innerText = `${photo.album || ''}/${photo.numero || ''}`;

    // Attendre que l'image soit bien chargée
    img.onload = () => {

        // Considérer la photo "vue"
        ajouterPhotoVue(photo.numero);

        // Ajouter l'outil de zoom sur la photo
        if (!window.lightboxZoomist) {
            window.lightboxZoomist = new Zoomist('.lightbox-body', {
                wheelable: true,
                draggable: true,
                smooth: true,
                initScale: 1,
            });
        } else {
            window.lightboxZoomist.update();
            window.lightboxZoomist.reset();
        }
    };
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

document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox.classList.contains('hidden')) return; // si la lightbox n'est pas ouverte, on ignore

    if (e.key === 'ArrowLeft') {
        if (currentLightboxIndex > 0) {
            currentLightboxIndex--;
            displayLightbox();
        }
    } else if (e.key === 'ArrowRight') {
        if (currentLightboxIndex < listeFiltreeCourante.length - 1) {
            currentLightboxIndex++;
            displayLightbox();
        }
    } else if (e.key === 'Escape') {
        // bonus: fermer avec Echap
        lightbox.classList.add('hidden');
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

/* Gestion des photos vues / non vues */
function getPhotosVues() {
    return JSON.parse(localStorage.getItem("photosVues")) || [];
}

function indiquerSiPhotoNonVues(photoElement, numeroPhoto) {
    const photosVues = getPhotosVues();
    if (!photosVues.includes(numeroPhoto)) {
        const badge = document.createElement("div");
        badge.classList.add("badge-new");
        badge.classList.add("top");
        const texte = document.createElement("span");
        texte.textContent = "N";
        badge.appendChild(texte);
        photoElement.appendChild(badge);
    }
}

function ajouterPhotoVue(numeroPhoto) {
    let photosVues = getPhotosVues();
    if (!photosVues.includes(numeroPhoto)) {
        photosVues.push(numeroPhoto);
        localStorage.setItem("photosVues", JSON.stringify(photosVues));
    }
    // Suppression du badge de la photo sur la liste
    const badge = document.querySelector(`.photo-item[data-numero="${numeroPhoto}"] .badge-new`);
    if (photosVues.includes(numeroPhoto)) {
        if (badge) badge.remove();
    }
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
    return Math.round(anneeMinInitiale + (anneeMaxInitiale - anneeMinInitiale) * (percent / 100));
};

const yearToPercent = (year) => ((year - anneeMinInitiale) / (anneeMaxInitiale - anneeMinInitiale)) * 100;


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
    pageCourante = 1;
    filtrerPhotos();
};

const updateDatesExplore = () => {
    anneeDebut = percentToYear(parseFloat(explore.dataset.percent));
    anneeFin = percentToYear(parseFloat(explore.dataset.percent));
    pageCourante = 1;
    filtrerPhotos();
};

const initPosition = (el, percent) => {
    el.dataset.percent = percent;
    setPosition(el, percent);
};

const makeDraggable = (el, updateCallback, constraints = null) => {
    let dragging = false;

    const moveDrag = (clientX) => {
        if (!dragging) return;
        const rect = timeline.getBoundingClientRect();
        let percent = ((clientX - rect.left) / rect.width) * 100;
        percent = Math.max(0, Math.min(100, percent));

        if (constraints) {
            if (typeof constraints.min === 'function') percent = Math.max(percent, constraints.min());
            if (typeof constraints.max === 'function') percent = Math.min(percent, constraints.max());
        }

        el.dataset.percent = percent;
        setPosition(el, percent);
        updateLabels();
        updateHighlight();
    };

    const endDrag = () => {
        if (!dragging) return;

        if (el === explore) {
            updateDatesExplore();
        } else if (el === left || el === right) {
            updateDatesRange();
        }

        dragging = false;
        document.body.style.userSelect = 'auto';

        // 🔑 Nettoyage des events globaux
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
    };

    const onMove = (e) => moveDrag(e.clientX);
    const onUp = (e) => endDrag();

    el.addEventListener('pointerdown', (e) => {
        e.preventDefault(); // évite le scroll
        dragging = true;
        document.body.style.userSelect = 'none';

        // Active le bon mode
        if (el === explore) {
            setExploreMode(true);
        } else {
            setExploreMode(false);
        }

        // 🔑 On écoute globalement pendant le drag
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);

        moveDrag(e.clientX);
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
initPosition(left, yearToPercent(anneeMinInitiale));
initPosition(right, yearToPercent(anneeMaxInitiale));
initPosition(explore, yearToPercent(anneeExploreInitiale));

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

document.addEventListener('DOMContentLoaded', () => {
    // 🔗 Gestion des éléments externes (ton code existant)
    if (window.ENV?.INTERNET === true) {
        document.body.querySelectorAll('.external-only').forEach(el => {
            el.classList.remove('external-only');
        });
    }
});

