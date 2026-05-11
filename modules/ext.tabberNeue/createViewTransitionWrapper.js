/**
 * Wraps the activation DOM mutations in `document.startViewTransition` so the
 * source panel slides+fades out while the destination slides+fades in. CSS for
 * the `::view-transition-{group,image-pair,old,new}(tabber-section-{forward,
 * backward})` pseudo-element pairs runs the directional keyframes.
 *
 * The callback passed to `wrap` must be synchronous: the browser pauses
 * rendering while awaiting the update callback's promise, so any rAF-based
 * promise resolution would deadlock.
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
		if ( typeof doc.startViewTransition !== 'function' ) {
			return false;
		}
		if ( source === 'panel-scroll' ) {
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
	 * @param {Function} callback synchronous; returning a promise that resolves
	 *   via rAF will deadlock because the browser pauses rendering while
	 *   awaiting the update callback's promise.
	 * @param {string} direction 'forward' or 'backward'
	 */
	function wrap( callback, direction ) {
		section.style.viewTransitionName = 'tabber-section-' + direction;
		const myGeneration = ++generation;

		const vt = doc.startViewTransition( callback );
		// Only the latest generation may clear — a rapid second activation
		// cancels the prior transition and would otherwise strip the name
		// the new transition needs for its NEW-state snapshot.
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
