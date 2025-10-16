#!/bin/bash

set -euo pipefail

usage() {
    echo "Usage: $0 <dossier_local> <bucket_s3>"
    echo "Exemple : $0 ./mon-site s3://mon-bucket"
    exit 1
}

if [ "$#" -ne 2 ]; then
    usage
fi

LOCAL_DIR="$1"
BUCKET="$2"

if [[ "$BUCKET" != s3://* ]]; then
    echo "Erreur : le bucket doit commencer par s3://"
    exit 1
fi

BUCKET="${BUCKET%/}"

if [ ! -d "$LOCAL_DIR" ]; then
    echo "Erreur : le dossier local '$LOCAL_DIR' n'existe pas."
    exit 1
fi

LOCAL_DIR="$(cd "$LOCAL_DIR"; pwd)/"

echo "Début de la synchronisation"
echo "Local: $LOCAL_DIR"
echo "Bucket: $BUCKET"

s3cmd sync --guess-mime-type "$LOCAL_DIR" "$BUCKET"

echo "Synchronisation terminée."
