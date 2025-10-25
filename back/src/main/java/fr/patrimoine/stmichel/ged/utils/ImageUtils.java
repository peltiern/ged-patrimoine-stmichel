package fr.patrimoine.stmichel.ged.utils;

import net.coobird.thumbnailator.Thumbnails;

import java.awt.image.BufferedImage;
import java.io.IOException;

public class ImageUtils {

    public static BufferedImage redimensionnerImage(BufferedImage image, int maxWidth, int maxHeight) {
        try {
            return Thumbnails.of(image)
                    .size(maxWidth, maxHeight)
                    .keepAspectRatio(true)
                    .asBufferedImage();
        } catch (IOException e) {
            return null;
        }
    }

    public static BufferedImage convertirEnRgb(BufferedImage imageSource) {
        if (imageSource != null) {

            // Conversion en RGB si l’image contient un canal alpha
            BufferedImage rgbImage;
            if (imageSource.getType() == BufferedImage.TYPE_INT_ARGB || imageSource.getColorModel().hasAlpha()) {

                rgbImage = new BufferedImage(imageSource.getWidth(), imageSource.getHeight(), BufferedImage.TYPE_INT_RGB);
                rgbImage.getGraphics().drawImage(imageSource, 0, 0, null);
            } else {
                rgbImage = imageSource;
            }
            return rgbImage;
        } else {
            return null;
        }
    }
}
