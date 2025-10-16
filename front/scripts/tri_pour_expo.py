import os
import pandas as pd
import shutil

# === CONFIGURATION ===
csv_path = "Classement Photos Saint-Michel - Classement.csv"
source_base = "resized/large"         # dossier racine contenant les sous-dossiers (A/, B/, etc.)
destination = "Pour expo"      # dossier de sortie

# === CRÉATION DU DOSSIER DE SORTIE ===
os.makedirs(destination, exist_ok=True)

# === CHARGEMENT CSV ET FILTRAGE ===
df = pd.read_csv(csv_path)
df_expo = df[df["Pour expo ?"] == "Oui"]

# === COPIE DES FICHIERS ===
for _, row in df_expo.iterrows():
    src = os.path.join(source_base, str(row["chemin"]))
    dst = os.path.join(destination, f"{row['album']}_{row['nom']}")
    if os.path.isfile(src):
        shutil.copy2(src, dst)
    else:
        print(f"[!] Fichier introuvable : {src}")

print(f"\n✅ {len(df_expo)} photos copiées dans : {destination}")

