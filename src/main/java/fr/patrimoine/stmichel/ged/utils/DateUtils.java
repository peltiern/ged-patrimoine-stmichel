package fr.patrimoine.stmichel.ged.utils;

import java.text.SimpleDateFormat;
import java.util.Date;

public final class DateUtils {

    public static String parseDate(Date date) {
        if (date == null) {
            return "";
        }
        SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
        return formatter.format(date);
    }
}
