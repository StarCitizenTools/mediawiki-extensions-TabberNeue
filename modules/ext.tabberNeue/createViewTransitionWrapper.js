const { isBurstSource } = require( './domHelpers.js' );

/**
 * Element-scoped view transition for tab activation.
 *
 * The document-scoped API is deliberately not used as a fallback: it paints
 * its snapshots in the top layer, above fixed skin chrome. Browsers without
 * the element-scoped API fall through to createPanelTransition instead.
 *
 * @typedef {Object} ViewTransitionWrapperOpts
 * @property {HTMLElement} section
 * @property {Document} [document]
 *
 * @typedef {Object} ViewTransitionWrapper
 * @property {Function} canUse
 * @property {Function} wrap
 */

/**
 * @param {ViewTransitionWrapperOpts} opts
 * @return {ViewTransitionWrapper}
 */
function createViewTransitionWrapper( opts ) {
	const section = opts.section;
	const doc = opts.document || document;

	let generation = 0;

	/**
	 * @param {string} [source]
	 * @param {boolean} hasPreviousPanel
	 * @return {boolean}
	 */
	function canUse( source, hasPreviousPanel ) {
		if ( typeof section.startViewTransition !== 'function' ) {
			return false;
		}
		if ( isBurstSource( source ) ) {
			return false;
		}
		if ( !hasPreviousPanel ) {
			return false;
		}
		if ( !doc.documentElement.classList.contains( 'tabber-animations-ready' ) ) {
			return false;
		}
		return true;
	}

	/**
	 * @param {Function} callback synchronous; a promise resolved via rAF
	 *   deadlocks, because rendering is paused until it settles.
	 * @param {string} direction 'forward' or 'backward'
	 */
	function wrap( callback, direction ) {
		// The scope root self-participates; this overrides its implicit `root`.
		section.style.viewTransitionName = 'tabber-section-' + direction;
		const myGeneration = ++generation;

		const vt = section.startViewTransition( callback );
		// Superseding a transition rejects its `ready`, unobserved otherwise.
		vt.ready.catch( () => {} );
		// A superseded transition still settles, and must not strip the name
		// its successor needs for the NEW-state snapshot.
		const clearName = () => {
			if ( myGeneration === generation ) {
				section.style.viewTransitionName = '';
			}
		};
		vt.finished.then( clearName, clearName );
	}

	return { canUse, wrap };
}

module.exports = createViewTransitionWrapper;
