/**
 * Find-in-page reveal support.
 *
 * Inactive panels carry `hidden="until-found"`: the browser skips rendering them
 * but still searches their text, and when a find-in-page match or fragment
 * navigation lands inside one it fires `beforematch` on that panel and un-hides
 * it. Handling that event is the whole mechanism, and it works in both engines.
 *
 * The attribute is applied from JS behind a feature probe, not in the
 * server-rendered markup: a browser that does not understand `until-found`
 * treats the value as a plain boolean `hidden` and would hide the panel with no
 * way back, and there is no reliable CSS probe to guard against that. Without
 * support nothing is written and every panel stays rendered.
 *
 * Panels keep their grid geometry while hidden — `grid-auto-columns: 100%` sizes
 * columns independently of content, so `offsetLeft` and scroll-snap are
 * unaffected and only the height collapses.
 *
 * @typedef {Object} FindRevealOpts
 * @property {HTMLElement} section
 * @property {Iterable<HTMLElement>} panels
 * @property {Function} onReveal called with the panel the browser is revealing
 * @property {Document} [document]
 * @property {boolean} [supported] override the feature probe, for tests
 *
 * @typedef {Object} FindReveal
 * @property {boolean} supported
 * @property {Function} sync
 * @property {Function} destroy
 */

/**
 * @param {FindRevealOpts} opts
 * @return {FindReveal}
 */
function createFindReveal( opts ) {
	const section = opts.section;
	const panels = Array.from( opts.panels );
	const onReveal = opts.onReveal;
	const doc = opts.document || document;

	// `hidden` reflects back as the string 'until-found' only where the value is
	// understood; elsewhere it is a boolean and coerces to true.
	const supported = opts.supported !== undefined ? opts.supported : ( () => {
		const probe = doc.createElement( 'div' );
		probe.hidden = 'until-found';
		return probe.hidden === 'until-found';
	} )();

	/**
	 * Which of *our* panels contains the event target. A nested tabber's panel
	 * bubbles its beforematch through this section too, and the browser fires one
	 * on every hidden ancestor, so each level has to resolve the target to the
	 * panel it actually owns.
	 *
	 * @param {Node} node
	 * @return {HTMLElement|null}
	 */
	function ownPanelFor( node ) {
		for ( const panel of panels ) {
			if ( panel === node || panel.contains( node ) ) {
				return panel;
			}
		}
		return null;
	}

	function onBeforeMatch( e ) {
		const panel = ownPanelFor( e.target );
		if ( panel ) {
			onReveal( panel );
		}
	}

	/**
	 * Reveal the active panel and hide the rest. Must run before the active
	 * panel is measured — a hidden panel measures zero height.
	 *
	 * @param {HTMLElement|null} activePanel
	 */
	function sync( activePanel ) {
		if ( !supported ) {
			return;
		}
		for ( const panel of panels ) {
			if ( panel === activePanel ) {
				// The browser also removes this itself after beforematch; doing it
				// again is harmless and covers ordinary activations.
				panel.removeAttribute( 'hidden' );
			} else if ( panel.getAttribute( 'hidden' ) !== 'until-found' ) {
				panel.setAttribute( 'hidden', 'until-found' );
			}
		}
	}

	if ( supported ) {
		// beforematch bubbles, so one delegated listener covers every panel.
		section.addEventListener( 'beforematch', onBeforeMatch );
	}

	return {
		supported,
		sync,
		destroy() {
			section.removeEventListener( 'beforematch', onBeforeMatch );
		}
	};
}

module.exports = createFindReveal;
