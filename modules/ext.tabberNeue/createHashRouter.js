/**
 * @typedef {Object} HashRouterOpts
 * @property {Window} [window]
 * @property {History} [history]
 * @property {Document} [document]
 * @property {Object} registry must expose get(element)
 * @property {Object} config must expose updateLocationOnTabChange
 *
 * @typedef {Object} HashRouter
 * @property {Function} initialTabFor
 * @property {Function} destroy
 */

/**
 * Looks up the `.tabber__panel` element corresponding to the given URL hash
 * fragment, or returns null if not found.
 *
 * @param {Object} doc — document (or mock with getElementById)
 * @param {string} hash — raw hash string (without leading #)
 * @return {HTMLElement|null}
 */
function getPanelFromHash( doc, hash ) {
	if ( !hash ) {
		return null;
	}
	const targetElement = doc.getElementById( mw.util.percentDecodeFragment( hash ) );
	if ( targetElement === null ) {
		return null;
	}
	return targetElement.closest( '.tabber__panel' );
}

/**
 * Creates a hash router that centralises all URL-hash ↔ tab interactions:
 * - resolving the initial active tab from the URL hash
 * - reacting to `hashchange` events to activate the matching tab
 * - writing the hash to the URL on user-click tab activations
 *
 * @param {HashRouterOpts} opts
 * @return {HashRouter}
 */
function createHashRouter( opts ) {
	const win = opts.window || window;
	const hist = opts.history || win.history;
	const doc = opts.document || win.document;
	const registry = opts.registry;
	const config = opts.config;

	/**
	 * Returns the tab element that should be active on initial load for the
	 * given tabber. An explicit panel hash wins; failing that, any panel the
	 * browser has already revealed on its own; failing that, the default tab.
	 *
	 * @param {Object} tabber
	 * @return {HTMLElement}
	 */
	function initialTabFor( tabber ) {
		const hash = win.location.hash.slice( 1 );
		const panel = getPanelFromHash( doc, hash );
		if ( panel && tabber.hasPanel( panel ) ) {
			return tabber.getTabForPanel( panel );
		}
		// Failing an explicit hash, adopt a panel the browser revealed on its own
		// before load (a find-in-page match or `#:~:text=` directive), so init()
		// does not scroll away from it. Fragment directives are stripped from
		// location.hash, so the two never contend.
		const revealedTab = tabber.getRevealedTab();
		if ( revealedTab ) {
			return revealedTab;
		}
		return tabber.getDefaultTab();
	}

	function onHashChange() {
		const hash = win.location.hash.slice( 1 );
		const panel = getPanelFromHash( doc, hash );
		if ( panel === null ) {
			return;
		}
		const tabberEl = panel.closest( '.tabber--live' );
		if ( !tabberEl ) {
			return;
		}
		const tabberInstance = registry.get( tabberEl );
		if ( !tabberInstance ) {
			return;
		}
		const tab = tabberInstance.getTabForPanel( panel );
		if ( tab ) {
			tabberInstance.activate( tab, { source: 'hash' } );
		}
	}

	function onTabChange( e ) {
		if ( !config.updateLocationOnTabChange ) {
			return;
		}
		if ( e.detail.source !== 'user-click' ) {
			return;
		}
		const newHash = '#' + e.detail.panelId;
		if ( win.location.hash !== newHash ) {
			hist.replaceState(
				null, '',
				win.location.pathname + win.location.search + newHash
			);
		}
	}

	win.addEventListener( 'hashchange', onHashChange );
	doc.documentElement.addEventListener( 'tabber:tabchange', onTabChange );

	return {
		initialTabFor,
		destroy() {
			win.removeEventListener( 'hashchange', onHashChange );
			doc.documentElement.removeEventListener( 'tabber:tabchange', onTabChange );
		}
	};
}

module.exports = createHashRouter;
