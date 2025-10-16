package fr.patrimoine.stmichel.ged.modeles.tesseract;

import com.fasterxml.jackson.annotation.JsonProperty;

public class TesseractOptions {

	private String[] languages;

	private TesseractConfigParams configParams;

	public TesseractOptions(final String[] languages, final TesseractConfigParams configParams) {
		this.languages = languages;
		this.configParams = configParams;
	}

	/**
	 * Getter de la propriété languages.
	 *
	 * @return languages
	 */
	public String[] getLanguages() {
		return languages;
	}

	/**
	 * Setter de la propriété languages.
	 *
	 * @param newLanguages the languages to set
	 */
	public void setLanguages(final String[] newLanguages) {
		languages = newLanguages;
	}

	/**
	 * Getter de la propriété configParams.
	 *
	 * @return configParams
	 */
	public TesseractConfigParams getConfigParams() {
		return configParams;
	}

	/**
	 * Setter de la propriété configParams.
	 *
	 * @param newConfigParams the configParams to set
	 */
	public void setConfigParams(final TesseractConfigParams newConfigParams) {
		configParams = newConfigParams;
	}
}
