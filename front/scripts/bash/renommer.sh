#!/bin/bash

# Dossier de travail
cd "$(dirname "$0")"

# Point de départ
count=1933

# Trouver tous les fichiers .jpg et .JPG, triés naturellement, gestion des noms complexes
find . -maxdepth 1 -type f \( -iname "*.jpg" \) -print0 | sort -zV | while IFS= read -r -d '' file; do
    # Supprime le './' éventuel
    cleanfile="${file#./}"

    newname=$(printf "%05d.jpg" "$count")

    if [ ! -e "$newname" ]; then
        mv -n -- "$cleanfile" "$newname"
        ((count++))
    else
        echo "⚠️ Le fichier '$newname' existe déjà, '$cleanfile' ignoré."
    fi
done

