import pandas as pd
import json
import math

# Charger le fichier CSV
csv_path = "Classement Photos Saint-Michel - Classement.csv"
df = pd.read_csv(csv_path, dtype=str)

# Supprimer les colonnes non désirées
colonnes_a_supprimer = ["Pour expo ?", "Lieu expo", "Doublons"]
df = df.drop(columns=[col for col in colonnes_a_supprimer if col in df.columns])

# Fonction pour transformer la géolocalisation en latitude/longitude
def parse_geoloc(geoloc_str):
    if pd.isna(geoloc_str):
        return None, None
    try:
        lat, lon = geoloc_str.split(",")
        return float(lat.strip()), float(lon.strip())
    except ValueError:
        return None, None

# Fonction pour transformer une chaîne séparée par des virgules en liste
def parse_list_field(value):
    if pd.isna(value):
        return []
    return [item.strip() for item in str(value).split(",") if item.strip()]
    
# Fonction pour nettoyer les NaN ou listes vides
def clean_value(val):
    if isinstance(val, float) and math.isnan(val):
        return ""
    if isinstance(val, list):
        return [v for v in val if v]
    return val
    
# Supprimer les champs vides ou listes vides
def remove_empty_fields(record):
    return {k: v for k, v in record.items() if v != "" and v != []}

# Appliquer les transformations
df["latitude"], df["longitude"] = zip(*df["geolocalisation"].map(parse_geoloc))
df = df.drop(columns=["geolocalisation"])

for col in ["themes", "lieu"]:
    if col in df.columns:
        df[col] = df[col].map(parse_list_field)

# Conversion en JSON
json_output = df.fillna("").to_dict(orient="records")
json_output = [remove_empty_fields(rec) for rec in json_output]
json_path = "photos_saint_michel.json"
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(json_output, f, ensure_ascii=False, indent=2)

print(f"Fichier JSON généré : {json_path}")

