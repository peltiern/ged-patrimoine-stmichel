import os
import json
import subprocess
from PIL import Image
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

MAX_WORKERS = os.cpu_count() or 4
JSON_FILE = "photos_saint_michel.json"  # Fichier JSON avec toutes les photos à garder
BASE_DIR = Path(".").resolve()  # dossier courant

# Extensions à tester (ordre de priorité)
POSSIBLE_EXTS = [".tif", ".tiff", ".jpg", ".jpeg"]

def get_image_paths_for_album(album_name):
    """
    Retourne la liste des chemins complets vers les images (TIF ou JPG)
    correspondant à l'album donné.
    """
    with open(JSON_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    result_paths = []
    for photo in data:
        if photo.get("album") == album_name:
            numero = str(photo.get("numero")).strip()
            base_path = BASE_DIR / album_name / numero
            for ext in POSSIBLE_EXTS:
                candidate = base_path.with_suffix(ext)
                if candidate.exists():
                    result_paths.append(candidate)
                    break  # on prend la première extension trouvée
    return result_paths

def process_image(input_path, album_name, output_dir_large, output_dir_small):
    try:
        with Image.open(input_path) as img:
            if img.mode != 'RGB':
                img = img.convert('RGB')

            # --- Grande image ---
            large_img = img.copy()
            large_img.thumbnail((1920, 1920), Image.LANCZOS)
            relative_path = input_path.relative_to(BASE_DIR / album_name)
            output_path_large = output_dir_large / relative_path.with_suffix(".jpg")
            output_path_large.parent.mkdir(parents=True, exist_ok=True)
            large_img.save(output_path_large, format="JPEG", quality=85, optimize=True)
            print(f"🖼️ Image redimensionnée (large) : {output_path_large}")

            # --- Petite vignette ---
            small_img = img.copy()
            small_img.thumbnail((500, 500), Image.LANCZOS)
            output_path_small = output_dir_small / relative_path.with_suffix(".jpg")
            output_path_small.parent.mkdir(parents=True, exist_ok=True)
            small_img.save(output_path_small, format="JPEG", quality=80, optimize=True)
            print(f"🖼️ Vignette générée (small) : {output_path_small}")

            # Copier les métadonnées EXIF vers la grande image uniquement
            subprocess.run([
                "exiftool",
                "-overwrite_original",
                "-TagsFromFile", str(input_path),
                "-all:all", str(output_path_large)
            ], check=True)

            # Supprimer le backup créé par exiftool
            original_backup = output_path_large.with_name(output_path_large.name + "_original")
            if original_backup.exists():
                original_backup.unlink()

    except Exception as e:
        print(f"⚠️ Erreur avec {input_path} : {e}")


def convert_album(album_name):
    output_dir_large = Path("resized/large")
    output_dir_small = Path("resized/small")
    output_dir_large.mkdir(parents=True, exist_ok=True)
    output_dir_small.mkdir(parents=True, exist_ok=True)

    images_to_process = get_image_paths_for_album(album_name)

    print(f"📦 {len(images_to_process)} images à traiter pour l'album {album_name}...")

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [
            executor.submit(process_image, path, album_name, output_dir_large, output_dir_small)
            for path in images_to_process
        ]
        for future in as_completed(futures):
            future.result()



if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage : python convertir_jpg.py <album>")
    else:
        convert_album(sys.argv[1])

