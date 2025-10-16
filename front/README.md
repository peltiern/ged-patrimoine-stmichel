## Galerie Photos HTML/JS/CSS

Application de galerie photo légère fonctionnant entièrement côté front. Il suffit juste de servir les fichiers statiques (HTML, JS, CSS) ainsi que les photos.

### Fonctionnalités

- recherche par thème
- recherche par lieu
- recherche par période
- recherche par année
- recherche par numéro ou terme
- affichage des résultats sous forme de liste paginée
- affichage des résultats sous forme de carte (OSM)
- affichage de la photo dans une lightbox
- zoom
- navigation entre les photos (interface ou clavier)
- responsive

La "base de données" est contenue dans un fichier JSON qui est complètement traité côté front comme la recherche. En contrepartie, cette application ne peut traiter qu'un nombre limité de photos (application en ligne avec 2000 photos).

Cette application peut également être utilisée en mode "kiosque" sans accès Internet. Dans ce cas, les librairies JS, les fichiers CSS sont embarqués (application ayant servi pour une exposition en fonctionnant sur un Raspberry Pi 5).

Exemple : [Patrimoine photographique de Saint-Michel](https://patrimoine.stmichel-charente.fr/)