import pandas as pd
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
import os
import io

# === CONFIGURATION ===
csv_path = "Classement Photos Saint-Michel - Classement.csv"
image_base_path = "resized/large"
output_pdf = "catalogue_expo.pdf"

# === CHARGEMENT CSV ===
df = pd.read_csv(csv_path, dtype={"numero": str})
df = df[df["Pour expo ?"] == "Oui"]

# === PDF SETUP ===
PAGE_W, PAGE_H = landscape(A4)
cols, rows = 3, 2  # 3 colonnes, 2 lignes
margin_x = 1 * cm
margin_y = 1 * cm
cell_w = (PAGE_W - 2 * margin_x) / cols
cell_h = (PAGE_H - 2 * margin_y) / rows

image_margin = 0.3 * cm
text_height = 0.7 * cm
image_max_w = cell_w - 2 * image_margin
image_max_h = cell_h - text_height - 2 * image_margin

c = canvas.Canvas(output_pdf, pagesize=(PAGE_W, PAGE_H))

idx_img = 0

for index, row in df.iterrows():
    pos_in_page = idx_img % (cols * rows)

    if pos_in_page == 0 and idx_img > 0:
        # Numérotation avant de tourner la page
        page_number = c.getPageNumber()
        c.setFont("Helvetica", 9)
        c.drawRightString(PAGE_W - margin_x, margin_y / 2, f"{page_number}")
        c.showPage()

    row_idx = pos_in_page // cols
    col_idx = pos_in_page % cols

    x = margin_x + col_idx * cell_w
    y = PAGE_H - margin_y - (row_idx + 1) * cell_h

    image_path = os.path.join(image_base_path, str(row["chemin"]))
    if not os.path.isfile(image_path):
        print(f"[!] Fichier manquant : {image_path}")
        continue

    try:
        img = Image.open(image_path).convert("RGB")
        img_ratio = img.width / img.height
        box_ratio = image_max_w / image_max_h

        if img_ratio > box_ratio:
            new_w = image_max_w
            new_h = new_w / img_ratio
        else:
            new_h = image_max_h
            new_w = new_h * img_ratio

        # Redimensionner l’image sans la rogner
        img_resized = img.resize((int(new_w), int(new_h)), Image.LANCZOS)
        buffer = io.BytesIO()
        img_resized.save(buffer, format="JPEG", quality=85, optimize=True)
        buffer.seek(0)
        image_reader = ImageReader(buffer)

        # Centrage de l’image dans la cellule
        img_x = x + (cell_w - new_w) / 2
        img_y = y + image_margin + text_height

        c.drawImage(image_reader, img_x, img_y, width=new_w, height=new_h)

        label = f"{row['album']} - {row['numero']}"
        c.setFont("Helvetica", 9)
        c.drawCentredString(x + cell_w / 2, y + image_margin, label)

        idx_img += 1

    except Exception as e:
        print(f"[!] Erreur image {image_path}: {e}")
        continue

# Numérotation de la dernière page
page_number = c.getPageNumber()
c.setFont("Helvetica", 9)
c.drawRightString(PAGE_W - margin_x, margin_y / 2, f"{page_number}")
c.save()
print(f"\n✅ PDF généré avec succès : {output_pdf}")

