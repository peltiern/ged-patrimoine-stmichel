package fr.patrimoine.stmichel.ged.utils;

import java.math.BigDecimal;
import java.math.RoundingMode;

public class MathUtils {

    public static double percentOf(double part, double total) {
        if (total == 0) return 0;
        return (part / total) * 100.0;
    }

    public static double roundPercentOf(double part, double total) {
        return round(percentOf(part, total), 2);
    }

    public static double round(double valeur, int precision) {
        return new BigDecimal(valeur)
                .setScale(precision, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
