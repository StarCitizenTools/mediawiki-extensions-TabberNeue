const createTabber = require( './createTabber.js' );
const createHashRouter = require( './createHashRouter.js' );

/**
 * Page-level coordinator.
 *
 * Owns the shared ResizeObserver, the createHashRouter instance, the global
 * animation toggle, and the per-element instance map. scan() is idempotent.
 *
 * @typedef {Object} RegistryDeps
 * @property {Document} [document]
 * @property {Window} [window]
 * @property {Function} [ResizeObserver]
 * @property {Function} [IntersectionObserver]
 * @property {Function} [setTimeout]
 * @property {Object} config
 * @property {Object} mw
 *
 * @param {RegistryDeps} deps
 * @return {Object}
 */
function createRegistry( deps ) {
	const doc = deps.document || document;
	const win = deps.window || window;
	const RO = deps.ResizeObserver || win.ResizeObserver;
	const IO = deps.IntersectionObserver || win.IntersectionObserver;
	const setTimeoutFn = deps.setTimeout || win.setTimeout.bind( win );
	const config = deps.config;
	const mwApi = deps.mw;

	/** @type {Map<HTMLElement, Object>} */
	const instances = new Map();
	let resizeObserver = null;
	let hashRouter = null;

	// Forward reference: createHashRouter and createTabber receive this object
	// and call into it during scan(). Methods are populated below via
	// Object.assign to break the circular dependency. Do not call api.*
	// methods inside the factory body before this Object.assign — they don't
	// exist yet.
	const api = {};

	/**
	 * Returns true if animation should be enabled (not blocked by prefers-reduced-motion).
	 *
	 * @return {boolean}
	 */
	function shouldShowAnimation() {
		return !win.matchMedia( '(prefers-reduced-motion: reduce)' ).matches &&
			config.enableAnimation;
	}

	/**
	 * Adds or removes the animation-ready class on documentElement.
	 * No-op when prefers-reduced-motion: reduce matches.
	 *
	 * @param {boolean} enable
	 */
	function toggleAnimation( enable ) {
		if ( !shouldShowAnimation() ) {
			return;
		}
		doc.documentElement.classList.toggle( 'tabber-animations-ready', enable );
	}

	/**
	 * Lazily constructs the shared ResizeObserver the first time it is needed.
	 * Resize entries are routed to the owning tabber instance.
	 */
	function ensureResizeObserver() {
		if ( resizeObserver ) {
			return;
		}
		resizeObserver = new RO( ( entries ) => {
			for ( const { target } of entries ) {
				const tabberEl = target.closest( '.tabber' );
				if ( !tabberEl || !instances.has( tabberEl ) ) {
					continue;
				}
				instances.get( tabberEl ).handleResize( target );
			}
		} );
	}

	/**
	 * Lazily constructs the hash router the first time it is needed.
	 */
	function ensureHashRouter() {
		if ( hashRouter ) {
			return;
		}
		hashRouter = createHashRouter( {
			window: win,
			history: win.history,
			document: doc,
			registry: api,
			config
		} );
	}

	/**
	 * Observe a target element for resize events via the shared ResizeObserver.
	 *
	 * @param {Element} target
	 */
	function observeResize( target ) {
		ensureResizeObserver();
		resizeObserver.observe( target );
	}

	/**
	 * Stop observing a target element for resize events.
	 *
	 * @param {Element} target
	 */
	function unobserveResize( target ) {
		if ( !resizeObserver ) {
			return;
		}
		resizeObserver.unobserve( target );
	}

	/**
	 * Register a tabber instance for a given element.
	 *
	 * @param {HTMLElement} element
	 * @param {Object} tabber
	 */
	function register( element, tabber ) {
		instances.set( element, tabber );
	}

	/**
	 * Unregister a tabber instance.
	 *
	 * @param {HTMLElement} element
	 */
	function unregister( element ) {
		instances.delete( element );
	}

	/**
	 * Get the tabber instance for an element, or undefined if not registered.
	 *
	 * @param {HTMLElement} element
	 * @return {Object|undefined}
	 */
	function get( element ) {
		return instances.get( element );
	}

	/**
	 * Find all .tabber--init elements and initialise them. Idempotent —
	 * already-initialised elements (already in the instances map) are skipped.
	 * Lazily constructs the ResizeObserver and hash router.
	 * Calls mw.loader.load('ext.tabberNeue.icons') when there is at least one tabber.
	 * Schedules toggleAnimation(true) after 250 ms to prevent flash on page load.
	 */
	function scan() {
		const tabberEls = doc.querySelectorAll( '.tabber--init' );
		if ( tabberEls.length === 0 ) {
			return;
		}
		ensureResizeObserver();
		ensureHashRouter();
		mwApi.loader.load( 'ext.tabberNeue.icons' );

		for ( const el of tabberEls ) {
			if ( instances.has( el ) ) {
				continue;
			}
			const tabber = createTabber( {
				element: el,
				registry: api,
				deps: {
					config,
					mw: mwApi,
					window: win,
					document: doc,
					IntersectionObserver: IO,
					setTimeout: setTimeoutFn
				}
			} );
			register( el, tabber );
			const initialTab = hashRouter.initialTabFor( tabber );
			tabber.init( initialTab );
		}

		setTimeoutFn( () => toggleAnimation( true ), 250 );
	}

	/**
	 * Tear down all tabbers, the ResizeObserver, and the hash router.
	 */
	function destroy() {
		for ( const tabber of instances.values() ) {
			tabber.destroy();
		}
		instances.clear();
		if ( resizeObserver ) {
			resizeObserver.disconnect();
			resizeObserver = null;
		}
		if ( hashRouter ) {
			hashRouter.destroy();
			hashRouter = null;
		}
	}

	Object.assign( api, {
		register,
		unregister,
		get,
		scan,
		observeResize,
		unobserveResize,
		toggleAnimation,
		destroy
	} );
	return api;
}

module.exports = createRegistry;
