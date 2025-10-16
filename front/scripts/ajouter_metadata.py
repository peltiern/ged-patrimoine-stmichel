import csv
import os
import subprocess
import imghdr

CSV_FILE = "Classement Photos Saint-Michel - Classement.csv"
BASE_DIR = "."

def format_gps_dms(value):
    deg = int(abs(value))
    min_ = int((abs(value) - deg) * 60)
    sec = round((abs(value) - deg - min_ / 60) * 3600, 2)
    return f"{deg} deg {min_}' {sec}\""

def inject_metadata(file_path, theme, lieu, geo, source):
    cmd = [
        "exiftool",
        "-overwrite_original",
        f"-XMP-dc:Subject={theme}",
        f"-IPTC:Keywords={theme}",
        f"-XMP-photoshop:City={lieu}",
        f"-IPTC:Sub-location={lieu}",
        f"-XMP-photoshop:Credit={source}",
        f"-IPTC:Source={source}"
    ]

    if geo and "," in geo:
        try:
            lat_str, lon_str = geo.split(",", 1)
            lat = float(lat_str.strip())
            lon = float(lon_str.strip())

            cmd += [
                f"-GPSLatitude={format_gps_dms(lat)}",
                f"-GPSLatitudeRef={'N' if lat >= 0 else 'S'}",
                f"-GPSLongitude={format_gps_dms(lon)}",
                f"-GPSLongitudeRef={'E' if lon >= 0 else 'W'}",
                "-GPSVersionID=2 3 0 0"
            ]
        except Exception as e:
            print(f"⚠️ Erreur GPS pour {file_path}: {e}")

    cmd.append(file_path)
    result = subprocess.run(cmd, capture_output=True, text=True)
    stderr = result.stderr.strip()
    if result.returncode == 0:
        print(f"✅ Métadonnées ajoutées à : {file_path}")
    elif ("Warning: [minor] Fixed incorrect URI for xmlns:MicrosoftPhoto" in stderr
          and not "Error" in stderr):
        print(f"⚠️ Avertissement mineur (corrigé) pour {file_path}, métadonnées ajoutées quand même.")
    else:
        print(f"❌ Erreur pour {file_path} : {stderr}")


def main():
    with open(CSV_FILE, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            album = row["Numéro Carton / Album"].strip()
            filename = row["Nom Photo"].strip()
            theme = row["Thème"].strip()
            lieu = row["Lieu"].strip()
            geo = row["Géolocalisation"].strip()
            source = row["Sources"].strip()

            full_path = os.path.join(BASE_DIR, album, filename)
            print("🔍 Fichier :", repr(full_path))

            if not os.path.isfile(full_path):
                print(f"❌ Fichier introuvable : {full_path}")
                continue

            if not os.access(full_path, os.W_OK):
                print(f"🔒 Pas les droits d’écriture sur : {full_path}")
                continue

            imgtype = imghdr.what(full_path)
            if imgtype not in ["jpeg", "tiff"]:
                print(f"⚠️ Type non supporté : {full_path} ({imgtype})")
                continue

            inject_metadata(full_path, theme, lieu, geo, source)

if __name__ == "__main__":
    main()

