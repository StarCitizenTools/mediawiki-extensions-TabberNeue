/**
 * Destination-panel entry animation. On a deliberate tab activation, applies a
 * direction-aware `tabber__panel--entering-from-{left,right}` class to the new
 * panel and removes it on animationend. The CSS transition is gated by the
 * `tabber-animations-ready` class, which is added by tabberRegistry only when
 * `prefers-reduced-motion: reduce` is unset and `enableAnimation` is true.
 *
 * @typedef {Object} PanelTransitionOpts
 * @property {Document} [document]
 *
 * @typedef {Object} PanelTransition
 * @property {Function} trigger
 */

/**
 * @param {PanelTransitionOpts} [opts]
 * @return {PanelTransition}
 */
function createPanelTransition( opts ) {
	const doc = ( opts && opts.document ) || document;

	/**
	 * @param {HTMLElement} newPanel
	 * @param {HTMLElement|null} previousPanel
	 * @param {string} [source]
	 */
	function trigger( newPanel, previousPanel, source ) {
		if ( source === 'panel-scroll' ) {
			return;
		}
		if ( !previousPanel ) {
			return;
		}
		if ( !doc.documentElement.classList.contains( 'tabber-animations-ready' ) ) {
			return;
		}

		const direction = newPanel.offsetLeft > previousPanel.offsetLeft ?
			'from-right' :
			'from-left';
		const cls = 'tabber__panel--entering-' + direction;

		newPanel.classList.remove(
			'tabber__panel--entering-from-left',
			'tabber__panel--entering-from-right'
		);
		// Force reflow so the keyframe restarts on rapid same-direction re-activation.
		// eslint-disable-next-line no-void
		void newPanel.offsetWidth;
		newPanel.classList.add( cls );

		newPanel.addEventListener( 'animationend', () => {
			newPanel.classList.remove( cls );
		}, { once: true } );
	}

	return { trigger };
}

module.exports = createPanelTransition;
