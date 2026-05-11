const QUIET_PERIOD_MS = 150;

/**
 * IntersectionObserver wrapper for the panel-scroll → active-tab sync.
 *
 * @typedef {Object} PanelSyncObserverOpts
 * @property {HTMLElement} section
 * @property {WeakMap<HTMLElement, HTMLElement>} panelToTabMap
 * @property {Function} [IntersectionObserver]
 * @property {Function} onTabActivate
 * @property {Function} [setTimeout]
 * @property {Function} [clearTimeout]
 *
 * @typedef {Object} PanelSyncObserver
 * @property {Function} attach
 * @property {Function} detach
 * @property {Function} pauseDuring
 * @property {Function} destroy
 */

/**
 * @param {PanelSyncObserverOpts} opts
 * @return {PanelSyncObserver}
 */
function createPanelSyncObserver( opts ) {
	const section = opts.section;
	const panelToTabMap = opts.panelToTabMap;
	// eslint-disable-next-line compat/compat
	const IO = opts.IntersectionObserver || window.IntersectionObserver;
	const onTabActivate = opts.onTabActivate;
	const setTimeoutFn = opts.setTimeout || window.setTimeout.bind( window );
	const clearTimeoutFn = opts.clearTimeout || window.clearTimeout.bind( window );

	let isIgnoring = false;
	let resumeTimeoutId = null;

	const observer = new IO( ( entries ) => {
		if ( isIgnoring ) {
			return;
		}
		for ( const entry of entries ) {
			if ( entry.isIntersecting ) {
				const tab = panelToTabMap.get( entry.target );
				if ( tab ) {
					onTabActivate( tab );
				}
			}
		}
	}, { root: section, threshold: 0.5 } );

	function attach( panels ) {
		for ( const panel of panels ) {
			observer.observe( panel );
		}
	}

	function detach() {
		observer.disconnect();
	}

	function pauseDuring( fn ) {
		isIgnoring = true;
		if ( resumeTimeoutId !== null ) {
			clearTimeoutFn( resumeTimeoutId );
		}
		try {
			fn();
		} finally {
			resumeTimeoutId = setTimeoutFn( () => {
				isIgnoring = false;
				resumeTimeoutId = null;
			}, QUIET_PERIOD_MS );
		}
	}

	return {
		attach,
		detach,
		pauseDuring,
		destroy() {
			detach();
			if ( resumeTimeoutId !== null ) {
				clearTimeoutFn( resumeTimeoutId );
				resumeTimeoutId = null;
			}
		}
	};
}

module.exports = createPanelSyncObserver;
