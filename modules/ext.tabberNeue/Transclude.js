/**
 * Represents a class that handles transcluding content for a tab within a tabber component.
 *
 * @class Transclude
 */
class Transclude {
	constructor( activeTabpanel, cacheExpiration = 3600 ) {
		this.activeTabpanel = activeTabpanel;
		this.pageTitle = this.activeTabpanel.dataset.mwTabberPageTitle;
		this.url = this.activeTabpanel.dataset.mwTabberLoadUrl;
		this.cacheKey = `tabber-transclude-${ encodeURIComponent( this.pageTitle ) }_v1`;
		this.cacheExpiration = cacheExpiration;
	}

	/**
	 * Validates the URL format.
	 *
	 * @return {Promise} A Promise that resolves if the URL is valid, and rejects with an Error if the URL is empty, null, or in an invalid format.
	 */
	validateUrl() {
		const urlPattern = /^(https?):\/\/[^\s/$.?#][^\s]*$/;
		if ( !this.url || this.url.trim() === '' ) {
			return Promise.reject( new Error( '[TabberNeue] URL is empty or null' ) );
		}
		if ( !urlPattern.test( this.url ) ) {
			return Promise.reject( new Error( `[TabberNeue] Invalid URL format : ${ this.url }` ) );
		}
		return Promise.resolve();
	}

	/**
	 * Checks the session storage for cached data using the cache key.
	 *
	 * @return {Object|null} The cached data if found, or null if no cached data is found.
	 */
	checkCache() {
		const cachedData = mw.storage.session.getObject( this.cacheKey );
		if ( cachedData ) {
			return cachedData;
		}
		return null;
	}

	/**
	 * Fetches data from the specified URL using a GET request.
	 *
	 * @return {Promise} A Promise that resolves with the response text if the network request is successful,
	 *                    and rejects with an Error if there is an issue with the network request.
	 */
	async fetchDataFromUrl() {
		try {
			const response = await fetch( this.url, { method: 'GET', timeout: 5000, credentials: 'same-origin' } );
			if ( !response.ok ) {
				throw new Error( `Network response was not ok: ${ response.status } - ${ response.statusText }` );
			}
			return Promise.resolve( response.text() );
		} catch ( error ) {
			return Promise.reject( `[TabberNeue] Error fetching data from URL: ${ this.url }`, error );
		}
	}

	/**
	 * Parses the JSON data and extracts the 'parse.text' property.
	 *
	 * @param {string} data - The JSON data to be parsed.
	 * @return {string} The parsed 'parse.text' property from the JSON data.
	 * @throws {Error} If an error occurs while parsing the JSON data.
	 */
	parseData( data ) {
		let parsedData;
		try {
			parsedData = JSON.parse( data );
			parsedData = parsedData.parse.text;
		} catch ( error ) {
			mw.log.error( `[TabberNeue] Error occurred while parsing JSON data: ${ error }` );
			return Promise.reject( new Error( `Error parsing JSON data: ${ error }` ) );
		}
		return parsedData;
	}

	/**
	 * Caches the parsed data in the session storage using the cache key.
	 *
	 * @param {string} parsedData - The parsed data to be cached.
	 * @return {string} The cached parsed data.
	 */
	cacheData( parsedData ) {
		mw.storage.session.setObject( this.cacheKey, parsedData, this.cacheExpiration );
		return parsedData;
	}

	/**
	 * Fetches data by validating the URL, checking the cache, fetching data from the URL,
	 * parsing the data, and caching the parsed data if not found in the cache.
	 *
	 * @return {Promise} A Promise that resolves with the fetched and cached data,
	 *                    or rejects with an error message if any step fails.
	 */
	async fetchData() {
		try {
			await this.validateUrl();
			const cachedData = this.checkCache();
			if ( cachedData ) {
				return cachedData;
			}

			const data = await this.fetchDataFromUrl();
			const parsedData = this.parseData( data );
			return this.cacheData( parsedData );
		} catch ( error ) {
			return Promise.reject( `[TabberNeue] Error fetching data: ${ error }` );
		}
	}

	/**
	 * Loads the page content by fetching data, updating the active tab panel's content,
	 * and handling errors if data fetching fails.
	 *
	 * @return {void}
	 */
	async loadPage() {
		try {
			this.activeTabpanel.classList.add( 'tabber__panel--loading' );
			const data = await this.fetchData();
			if ( data ) {
				delete this.activeTabpanel.dataset.mwTabberLoadUrl;
				this.activeTabpanel.classList.remove( 'tabber__panel--loading' );
				this.activeTabpanel.innerHTML = data;
			} else {
				mw.log.error( `[TabberNeue] No valid API response or missing 'parse' field for ${ this.pageTitle } from: ${ this.url }` );
			}
		} catch ( error ) {
			mw.log.error( `[TabberNeue] Failed to load data for ${ this.pageTitle }: ${ error }` );
		}
	}
}

module.exports = Transclude;
