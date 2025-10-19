package fr.patrimoine.stmichel.ged.modeles.tesseract;

public class TesseractResponse {

    private Data data;

    public Data getData() {
        return data;
    }

    public void setData(Data data) {
        this.data = data;
    }

    public static class Data {
        private Exit exit;
        private String stderr;
        private String stdout;

        // --- Getters & Setters ---
        public Exit getExit() {
            return exit;
        }

        public void setExit(Exit exit) {
            this.exit = exit;
        }

        public String getStderr() {
            return stderr;
        }

        public void setStderr(String stderr) {
            this.stderr = stderr;
        }

        public String getStdout() {
            return stdout;
        }

        public void setStdout(String stdout) {
            this.stdout = stdout;
        }
    }

    public static class Exit {
        private int code;
        private String signal; // null possible

        // --- Getters & Setters ---
        public int getCode() {
            return code;
        }

        public void setCode(int code) {
            this.code = code;
        }

        public String getSignal() {
            return signal;
        }

        public void setSignal(String signal) {
            this.signal = signal;
        }
    }
}
