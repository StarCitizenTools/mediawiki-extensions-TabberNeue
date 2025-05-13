/**
 * Represents a class that handles transcluding content for a tab within a tabber component.
 *
 * @class Transclude
 */
class Transclude {
	constructor( activeTabpanel, cacheExpiration ) {
		this.activeTabpanel = activeTabpanel;
		this.transclusionElement = this.activeTabpanel.querySelector( '.tabber__transclusion' );
		this.pageName = this.transclusionElement.dataset.mwTabberPage; // This is mainly used for error logging
		this.revision = this.transclusionElement.dataset.mwTabberRevision;
		this.apiParameters = {
			action: 'parse',
			format: 'json',
			formatversion: 2,
			oldid: this.revision,
			redirects: true,
			prop: 'text',
			disablelimitreport: true,
			disabletoc: true,
			disableeditsection: true,
			wrapoutputclass: '',
			maxage: cacheExpiration,
			smaxage: cacheExpiration
		};
	}

	/**
	 * Fetches data from the specified URL using a GET request.
	 *
	 * @return {Promise} A Promise that resolves with the response text if the network request is successful,
	 *                    and rejects with an Error if there is an issue with the network request.
	 */
	async fetchDataFromApi() {
		const api = new mw.Api();
		try {
			const data = await api.get( this.apiParameters, { timeout: 5000 } );
			return data;
		} catch ( error ) {
			mw.log.error( `[TabberNeue] Error fetching data for page ${ this.pageName }: ${ error }` );
			throw error;
		}
	}

	/**
	 * Fetches data by validating the page name, checking the cache, fetching data from the API,
	 * and caching the parsed data if not found in the cache.
	 *
	 * @return {Promise} A Promise that resolves with the fetched and cached data,
	 *                    or rejects with an error message if any step fails.
	 */
	async fetchData() {
		const data = await this.fetchDataFromApi();

		if ( !( data && data.parse && data.parse.text !== undefined ) ) {
			mw.log.error( '[TabberNeue] Error occurred while processing API data: Unexpected structure' );
			throw new Error( 'Invalid data structure received from server.' );
		}

		return data.parse.text;
	}

	/**
	 * Loads the page content by fetching data, updating the active tab panel's content,
	 * and handling errors if data fetching fails.
	 *
	 * @return {void}
	 */
	async loadPage() {
		if ( !this.pageName ) {
			mw.log.error(
				`[TabberNeue] Attempted to load page for ${ this.activeTabpanel.id || 'unknown tab' } without a valid page name.`
			);
			return;
		}

		let loadingTimerId = null;
		try {
			// Only show the loader immediately if the fetch takes longer than 250ms
			loadingTimerId = setTimeout( () => {
				this.activeTabpanel.classList.add( 'tabber__panel--loading' );
			}, 250 );

			const data = await this.fetchData();
			this.activeTabpanel.classList.remove( 'tabber__panel--loading' );
			clearTimeout( loadingTimerId );

			this.activeTabpanel.innerHTML = data;

			// Fire the wikipage.content hook for potential consumers of the hook
			// eslint-disable-next-line no-jquery/no-jquery-constructor, no-undef
			mw.hook( 'wikipage.content' ).fire( $( this.activeTabpanel ) );
		} catch ( error ) {
			this.activeTabpanel.classList.remove( 'tabber__panel--loading' );
			clearTimeout( loadingTimerId );
			mw.log.error( `[TabberNeue] Failed to load content for ${ this.activeTabpanel.id } (page: ${ this.pageName }, revision: ${ this.revision }):`, error );

			this.transclusionElement.innerHTML = '';
			this.transclusionElement.appendChild(
				mw.util.messageBox(
					mw.html.escape( ( error instanceof Error && error.message ) ?
						error.message : 'An unexpected error occurred while loading content.'
					),
					'error'
				)
			);
		}
	}
}

module.exports = Transclude;
