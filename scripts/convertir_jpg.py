import os
import subprocess
from PIL import Image
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

MAX_WORKERS = os.cpu_count() or 4  # Nombre de threads parallèles

def process_image(input_path, source_dir, output_dir):
    try:
        with Image.open(input_path) as img:
            if img.mode != 'RGB':
                img = img.convert('RGB')
            img.thumbnail((1920, 1920), Image.LANCZOS)

            relative_path = input_path.relative_to(source_dir)
            output_path = output_dir / relative_path.with_suffix(".jpg")
            output_path.parent.mkdir(parents=True, exist_ok=True)

            img.save(output_path, format="JPEG", quality=85, optimize=True)
            print(f"🖼️ Image redimensionnée : {output_path}")

            subprocess.run([
                "exiftool",
                "-overwrite_original",
                "-TagsFromFile", str(input_path),
                "-all:all", str(output_path)
            ], check=True)
            print(f"✅ Métadonnées copiées depuis {input_path}")

            # Supprimer les éventuels fichiers "_original"
            original_backup = output_path.with_name(output_path.name + "_original")
            if original_backup.exists():
                original_backup.unlink()
                print(f"🗑️ Supprimé : {original_backup}")

    except Exception as e:
        print(f"⚠️ Erreur avec {input_path} : {e}")

def convert_images(nomDossier):
    source_dir = Path(nomDossier)
    output_dir = Path("resized/large") / source_dir.name
    output_dir.mkdir(parents=True, exist_ok=True)

    images_to_process = []
    for root, _, files in os.walk(source_dir):
        for file in files:
            ext = file.lower().split('.')[-1]
            if ext in ['jpg', 'jpeg', 'tif', 'tiff']:
                images_to_process.append(Path(root) / file)

    print(f"📦 {len(images_to_process)} images à traiter...")

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [
            executor.submit(process_image, path, source_dir, output_dir)
            for path in images_to_process
        ]
        for future in as_completed(futures):
            future.result()  # Pour déclencher l’exception si besoin

if __name__ == "__main__":
    import sys
    if len(sys.argv) != 2:
        print("Usage : python convertisseur.py <nomDossier>")
    else:
        convert_images(sys.argv[1])

