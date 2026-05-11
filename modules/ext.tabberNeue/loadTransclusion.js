/**
 * Lazy-load the transcluded content for a tabber panel.
 *
 * @typedef {Object} LoadTransclusionOpts
 * @property {HTMLElement} panel
 * @property {Object} api — typically `new mw.Api()`; needs .get(params, options)
 * @property {{error: Function}} log — typically mw.log
 * @property {number} cdnMaxAge — cache headers for the API request
 * @property {Function} [onContentReplaced]
 * @property {Function} messageBox
 * @property {Function} escape
 * @property {number} [loadingDelayMs=250]
 * @property {Function} [setTimeout]
 * @property {Function} [clearTimeout]
 *
 * @param {LoadTransclusionOpts} opts
 * @return {Promise<void>}
 */
async function loadTransclusion( opts ) {
	const panel = opts.panel;
	const api = opts.api;
	const log = opts.log;
	const cdnMaxAge = opts.cdnMaxAge;
	const onContentReplaced = opts.onContentReplaced;
	const messageBox = opts.messageBox;
	const escape = opts.escape;
	const loadingDelayMs = opts.loadingDelayMs !== undefined ? opts.loadingDelayMs : 250;
	const setTimeoutFn = opts.setTimeout || window.setTimeout.bind( window );
	const clearTimeoutFn = opts.clearTimeout || window.clearTimeout.bind( window );

	const transclusionElement = panel.querySelector( '.tabber__transclusion' );
	if ( !transclusionElement ) {
		return;
	}
	const pageName = transclusionElement.dataset.mwTabberPage;
	const revision = transclusionElement.dataset.mwTabberRevision;

	if ( !pageName ) {
		log.error(
			`[TabberNeue] Attempted to load page for ${ panel.id || 'unknown tab' } without a valid page name.`
		);
		return;
	}

	let loadingTimerId = null;
	try {
		loadingTimerId = setTimeoutFn( () => {
			panel.classList.add( 'tabber__panel--loading' );
		}, loadingDelayMs );

		const data = await api.get( {
			action: 'parse',
			format: 'json',
			formatversion: 2,
			oldid: revision,
			redirects: true,
			prop: 'text',
			disablelimitreport: true,
			disabletoc: true,
			disableeditsection: true,
			wrapoutputclass: '',
			maxage: cdnMaxAge,
			smaxage: cdnMaxAge
		}, { timeout: 5000 } );

		if ( !( data && data.parse && data.parse.text !== undefined ) ) {
			throw new Error( 'Invalid data structure received from server.' );
		}

		panel.innerHTML = data.parse.text;
		if ( onContentReplaced ) {
			onContentReplaced( panel );
		}
	} catch ( error ) {
		log.error(
			`[TabberNeue] Failed to load content for ${ panel.id } (page: ${ pageName }, revision: ${ revision }):`,
			error
		);
		const message = ( error instanceof Error && error.message ) ?
			error.message : 'An unexpected error occurred while loading content.';
		transclusionElement.innerHTML = '';
		transclusionElement.appendChild( messageBox( escape( message ), 'error' ) );
	} finally {
		clearTimeoutFn( loadingTimerId );
		panel.classList.remove( 'tabber__panel--loading' );
	}
}

module.exports = loadTransclusion;
