package fr.patrimoine.stmichel.ged.modeles.tesseract;

public class TesseractConfigParams {

	private String createHocr;

	public TesseractConfigParams(final String createHocr) {
		this.createHocr = createHocr;
	}

	/**
	 * Getter de la propriété createHocr.
	 *
	 * @return createHocr
	 */
	public String getCreateHocr() {
		return createHocr;
	}

	/**
	 * Setter de la propriété createHocr.
	 *
	 * @param newCreateHocr the createHocr to set
	 */
	public void setCreateHocr(final String newCreateHocr) {
		createHocr = newCreateHocr;
	}
}
