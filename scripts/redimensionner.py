import os
import shutil
import subprocess
from PIL import Image

# Répertoire de base à traiter
SOURCE_DIR = "./"
TARGET_DIR = os.path.join(SOURCE_DIR, "resize")
MAX_WIDTH = 1920

# Extensions à traiter
VALID_EXTENSIONS = [".tif", ".tiff", ".jpg", ".jpeg"]

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def resize_image(input_path, output_path, max_size):
    with Image.open(input_path) as img:
        width, height = img.size
        scale = min(max_size / width, max_size / height, 1.0)
        new_size = (int(width * scale), int(height * scale))
        resized = img.resize(new_size, Image.LANCZOS)
        resized.save(output_path, format="JPEG", quality=90)

def copy_metadata(source_path, target_path):
    subprocess.run([
        "exiftool",
        "-overwrite_original",
        f"-TagsFromFile={source_path}",
        "-All:All",
        target_path
    ], check=True)

def process_images():
    for root, _, files in os.walk(SOURCE_DIR):
        if TARGET_DIR in root:
            continue  # Ignore le dossier "resize"
        if "./env" in root:
            continue  # Ignore le dossier "resize"

        for filename in files:
            ext = os.path.splitext(filename)[1].lower()
            if ext not in VALID_EXTENSIONS:
                continue

            input_path = os.path.join(root, filename)
            rel_path = os.path.relpath(input_path, SOURCE_DIR)
            rel_output = os.path.splitext(rel_path)[0] + ".jpg"
            output_path = os.path.join(TARGET_DIR, rel_output)

            ensure_dir(os.path.dirname(output_path))

            print(f"🔄 Conversion : {rel_path} → resize/{rel_output}")
            try:
                resize_image(input_path, output_path, MAX_WIDTH)
                copy_metadata(input_path, output_path)
                print(f"✅ OK : {rel_output}")
            except Exception as e:
                print(f"❌ Erreur avec {input_path} : {e}")

if __name__ == "__main__":
    process_images()

