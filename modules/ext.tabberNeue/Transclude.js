/**
 * Represents a class that handles transcluding content for a tab within a tabber component.
 *
 * @class Transclude
 */
class Transclude {
	constructor( activeTabpanel, cacheExpiration = 3600 ) {
		this.activeTabpanel = activeTabpanel;
		this.transclusionElement = this.activeTabpanel.querySelector( '.tabber__transclusion' );
		this.url = this.transclusionElement.dataset.mwTabberLoadUrl;
		this.cacheExpiration = cacheExpiration;
		this.cacheKey = `tabber-transclude-${ encodeURIComponent( this.activeTabpanel.id ) }_v3`;
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
		// eslint-disable-next-line compat/compat
		const controller = new AbortController();
		const timeoutId = setTimeout( () => controller.abort(), 5000 );
		try {
			// eslint-disable-next-line n/no-unsupported-features/node-builtins
			const response = await fetch( this.url, {
				method: 'GET',
				credentials: 'same-origin',
				signal: controller.signal
			} );
			if ( !response.ok ) {
				throw new Error( `[TabberNeue] Network response was not ok: ${ response.status } - ${ response.statusText }` );
			}
			return response.text();
		} catch ( error ) {
			if ( error.name === 'AbortError' ) {
				throw new Error( '[TabberNeue] Request timed out after 5000ms' );
			} else {
				throw new Error( `[TabberNeue] Error fetching data from URL: ${ this.url } - ${ error }` );
			}
		} finally {
			clearTimeout( timeoutId );
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
			throw new Error( `Error parsing JSON data: ${ error }` );
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
			throw new Error( `[TabberNeue] Error fetching data: ${ error }` );
		}
	}

	/**
	 * Loads the page content by fetching data, updating the active tab panel's content,
	 * and handling errors if data fetching fails.
	 *
	 * @return {void}
	 */
	async loadPage() {
		if ( !this.url ) {
			mw.log.error(
				`[TabberNeue] Attempted to load page for ${ this.activeTabpanel.id || 'unknown tab' } without a valid URL.`
			);
			return;
		}

		try {
			this.activeTabpanel.classList.add( 'tabber__panel--loading' );
			const data = await this.fetchData();

			this.activeTabpanel.classList.remove( 'tabber__panel--loading' );

			if ( data ) {
				this.activeTabpanel.innerHTML = data;
			} else {
				mw.log.error( `[TabberNeue] No valid content data returned for ${ this.activeTabpanel.id } from: ${ this.url }` );
				this.transclusionElement.appendChild( mw.util.messageBox( 'Error: No content received from server.' ) );
			}
		} catch ( error ) {
			this.activeTabpanel.classList.remove( 'tabber__panel--loading' );
			mw.log.error( `[TabberNeue] Failed to load data for ${ this.activeTabpanel.id }: ${ error }` );
			const errorMessage = typeof error === 'string' ? error : ( error.message || 'Unknown error' );
			this.transclusionElement.appendChild( mw.util.messageBox( `Error loading content: ${ mw.html.escape( errorMessage ) }` ) );
		}
	}
}

module.exports = Transclude;
