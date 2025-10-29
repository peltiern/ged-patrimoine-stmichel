const endpointArticles = window.ENV.GED_HOST + '/v1/documents';
let data = [];
let pageCourante = 1;
const nbArticlesParPage = 12;
let vuesNonVuesSelectionnes = [];
let themesSelectionnes = [];
let termeRecherche = '';
let anneeDebut = 1851;
let anneeFin = 2025;
let currentLightboxIndex = 0;

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

initialiserFiltres();
rechercherArticles();

const normalize = (s) => String(s ?? '').toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

function buildQueryParams() {
    const params = new URLSearchParams();
    if (termeRecherche.length !== 0) {
        params.append('query', normalize(termeRecherche));
    }
    params.append('page', pageCourante.toString());
    params.append('taillePage', nbArticlesParPage.toString());
    params.append('ordreTri', 'ASC');
    params.append('colonneTri', 'date')
    return params.toString();
}

async function callRechercherArticles() {
    const queryParams = buildQueryParams();
    const url = `${endpointArticles}?${queryParams}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
    return response.json();
}

function rechercherArticles() {
    callRechercherArticles()
        .then(result => {
            if (result && result.contenu) {
                document.getElementById('compteur-articles').textContent = `${result.nbTotalElements} article(s)`;
                genererListe(result, "resultats-liste");
            }
        })
        .catch(error => console.error(error));
}


function initialiserFiltres() {
    const inputTerme = document.getElementById('filtre-terme-article-input');
    inputTerme.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // empêche le rechargement de page
            termeRecherche = inputTerme.value;
            pageCourante = 1;
            rechercherArticles();
        }
    });
}

function reinitialiserFiltres() {
    termeRecherche = '';
    anneeDebut = anneeMinInitiale;
    anneeFin = anneeMaxInitiale;

    document.getElementById('filtre-terme-article-input').value = '';

    initPosition(left, 0);
    initPosition(right, 100);
    initPosition(explore, yearToPercent(anneeExploreInitiale));
    updateLabels();
    updateHighlight();
    updateDatesRange();
    setExploreMode(false);

    pageCourante = 1;
    rechercherArticles();
}

function genererListe(reponseRecherche, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    const articles = reponseRecherche.contenu;
    if (articles && articles.length > 0) {

        articles.forEach((article, index) => {

            const item = genererArticle(article, 'article-item', '28px', 'photo-title-small');

            // Click pour ouvrir lightbox
            item.addEventListener('click', () => {
               openLightbox(article);
            });

            container.appendChild(item);
        });
    }

    if (containerId === "resultats-liste") {
        genererPagination(reponseRecherche.nbTotalElements);
    }
}


function genererPagination(totalItems) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    const nbTotalPages = Math.ceil(totalItems / nbArticlesParPage);

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
        rechercherArticles();
    };
    pagination.appendChild(boutonPremierePage);

    // Bouton "Précédent"
    const boutonPrecedent = document.createElement('button');
    boutonPrecedent.textContent = '<';
    boutonPrecedent.disabled = pageCourante === 1;
    boutonPrecedent.onclick = () => {
        if (pageCourante > 1) {
            pageCourante--;
            rechercherArticles();
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
                    rechercherArticles();
                }
            };
            pagination.appendChild(pageInput);
        } else {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.onclick = () => {
                pageCourante = i;
                rechercherArticles();
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
            rechercherArticles();
        }
    };
    pagination.appendChild(boutonSuivant);

    // Bouton "Dernière page"
    const boutonDernierePage = document.createElement('button');
    boutonDernierePage.textContent = '»';
    boutonDernierePage.disabled = pageCourante === nbTotalPages;
    boutonDernierePage.onclick = () => {
        pageCourante = nbTotalPages;
        rechercherArticles();
    };
    pagination.appendChild(boutonDernierePage);

    // Affichage "X sur Y"
    const pageInfo = document.createElement('span');
    pageInfo.style.marginLeft = '10px';
    pageInfo.textContent = `${pageCourante} / ${nbTotalPages}`;
    pagination.appendChild(pageInfo);
}

function openLightbox(article) {
    afficherArticle(article);

    document.getElementById('lightbox').classList.remove('hidden');
}

function genererArticle(article, itemClassName, overlayMaxHeight, classNamePhotoTitle) {

    const item = document.createElement('div');
    item.className = itemClassName;
    item.dataset.numero = article.metadata.eid;

    // Image
    const img = document.createElement('img');
    img.src = 'https://saint-michel-archives-publiques.s3.fr-par.scw.cloud/tests/Documents/' + article.metadata.eid + '.jpg';
    img.alt = article.metadata.eid;

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'photo-overlay';

    // Overlay header
    const overlayHeader = document.createElement('div');
    overlayHeader.className = 'overlay-header';

    // Titre
    const photoTitle = document.createElement('div');
    photoTitle.className = classNamePhotoTitle;
    photoTitle.textContent = article.metadata.eid;

    overlayHeader.appendChild(photoTitle);
    overlay.appendChild(overlayHeader);

    item.appendChild(img);
    item.appendChild(overlay);

    // Badge "Non vue"
    //indiquerSiPhotoNonVues(item, article.numero);

    return item;
}

async function afficherArticle(article, termeRecherche) {
    const metadata = article.metadata;
    const img = document.getElementById('lightbox-img');
    const highlight = document.getElementById('highlight-layer');

    img.src = `https://saint-michel-archives-publiques.s3.fr-par.scw.cloud/tests/Documents/${metadata.eid}.jpg`;
    img.alt = metadata.eid;


    //
    // // Filtrer selon le terme recherché
    // const motsFiltres = filtrerMots(mots, termeRecherche);

    img.onload = async () => {

        // Charger le JSON des mots
        const jsonUrl = `https://saint-michel-archives-publiques.s3.fr-par.scw.cloud/tests/Documents/${metadata.eid}.json`;
        let mots = [];
        try {
            const response = await fetch(jsonUrl);
            if (response.ok) mots = await response.json();
        } catch (e) {
            console.warn('Impossible de charger les coordonnées des mots :', e);
        }

        // Supprimer ancien calque
        highlight.querySelector('svg')?.remove();

        // Créer le SVG overlay
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.position = 'absolute';
        svg.style.pointerEvents = 'none';
        highlight.appendChild(svg);

        // Exemple : rectangle de test
        const mot = { left: 22.02, top: 36.24, width: 15.37, height: 0.91 };
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', mot.left + '%');
        rect.setAttribute('y', mot.top + '%');
        rect.setAttribute('width', mot.width + '%');
        rect.setAttribute('height', mot.height + '%');
        rect.setAttribute('fill', 'rgba(255,255,0,0.4)');
        rect.setAttribute('stroke-width', '0.3%');
        svg.appendChild(rect);

        // Fonction pour adapter le calque à la taille réelle de l'image
        function ajusterHighlightLayer() {
            const imgRect = img.getBoundingClientRect();
            const parentRect = highlight.parentElement.getBoundingClientRect();

            const offsetX = imgRect.left - parentRect.left;
            const offsetY = imgRect.top - parentRect.top;

            svg.style.left = `${offsetX}px`;
            svg.style.top = `${offsetY}px`;
            svg.style.width = `${imgRect.width}px`;
            svg.style.height = `${imgRect.height}px`;
        }

        // Appel initial
        ajusterHighlightLayer();

        // Observer les changements de taille / zoom
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(ajusterHighlightLayer);
            ro.observe(img);
            ro.observe(highlight.parentElement);
        } else {
            window.addEventListener('resize', ajusterHighlightLayer);
        }

        // Synchroniser lors des événements Zoomist
        const zoomistContainer = document.querySelector('.zoomist-container');
        zoomistContainer?.addEventListener('zoomist:zoom', ajusterHighlightLayer);
        zoomistContainer?.addEventListener('zoomist:move', ajusterHighlightLayer);

        // Initialiser Zoomist
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


// Fonction utilitaire pour filtrer les mots recherchés
function filtrerMots(mots, recherche) {
    if (!recherche) return [];
    const terme = recherche.trim().toLowerCase();

    return mots.filter(m =>
        m.text &&
        m.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire les accents
            .includes(terme.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
    );
}

function formaterDate(dateIso8601) {
    const date = new Date(dateIso8601);
    return date.toLocaleDateString('fr-FR');
}

document.getElementById('lightbox-close').addEventListener('click', () => {
    document.getElementById('lightbox').classList.add('hidden');
});

document.getElementById('lightbox-prev').addEventListener('click', () => {
    if (currentLightboxIndex > 0) {
        currentLightboxIndex--;
        afficherArticle();
    }
});

document.getElementById('lightbox-next').addEventListener('click', () => {
    if (currentLightboxIndex < listeFiltreeCourante.length - 1) {
        currentLightboxIndex++;
        afficherArticle();
    }
});

document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (lightbox.classList.contains('hidden')) return; // si la lightbox n'est pas ouverte, on ignore

    if (e.key === 'ArrowLeft') {
        if (currentLightboxIndex > 0) {
            currentLightboxIndex--;
            afficherArticle();
        }
    } else if (e.key === 'ArrowRight') {
        if (currentLightboxIndex < listeFiltreeCourante.length - 1) {
            currentLightboxIndex++;
            afficherArticle();
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
};

const updateDatesExplore = () => {
    anneeDebut = percentToYear(parseFloat(explore.dataset.percent));
    anneeFin = percentToYear(parseFloat(explore.dataset.percent));
    pageCourante = 1;
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
            rechercherArticles();
        } else if (el === left || el === right) {
            updateDatesRange();
            rechercherArticles();
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
//
// document.addEventListener('DOMContentLoaded', () => {
//     // 🔗 Gestion des éléments externes (ton code existant)
//     if (window.ENV?.INTERNET === true) {
//         document.body.querySelectorAll('.external-only').forEach(el => {
//             el.classList.remove('external-only');
//         });
//     }
// });
//
