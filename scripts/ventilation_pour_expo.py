import os
import shutil
import pandas as pd
import re

def nettoyer_nom_dossier(nom):
    """Nettoie un nom de dossier : supprime guillemets, remplace caractères interdits."""
    nom = str(nom).strip()
    nom = nom.replace('"', '').replace("'", '')  # enlever les guillemets
    nom = re.sub(r'[\\/*?:"<>|,]', '_', nom)     # remplacer les caractères illégaux/dangereux
    nom = re.sub(r'\s+', ' ', nom)               # réduire les espaces multiples
    return nom or "Inconnu"

# Charger le fichier CSV
csv_path = "Classement Photos Saint-Michel - Classement.csv"
df = pd.read_csv(csv_path, sep=",", encoding="utf-8")
df.columns = [col.strip() for col in df.columns]

# Filtrer les photos à exposer
df_expo = df[df["Pour expo ?"].str.strip().str.lower() == "oui"]

# Copier les fichiers
for _, row in df_expo.iterrows():
    src_path = row["chemin"]
    theme = nettoyer_nom_dossier(row["Thème pour expo"])
    dest_dir = os.path.join("Expo", theme)
    os.makedirs(dest_dir, exist_ok=True)
    
    if os.path.isfile(src_path):
        shutil.copy2(src_path, dest_dir)
        print(f"✔ Copié : {src_path} -> {dest_dir}")
    else:
        print(f"⚠ Fichier introuvable : {src_path}")

