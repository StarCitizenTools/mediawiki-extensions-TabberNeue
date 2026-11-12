/**
 * Keeps the section scrolled to the active panel.
 *
 * Moving a tabber resets the section's scrollLeft without a scroll or resize
 * event, e.g. when VisualEditor exits (#389). Checks the ratio rather than
 * `isIntersecting`, because an edge-adjacent panel counts as intersecting.
 *
 * @typedef {Object} PanelAlignerOpts
 * @property {HTMLElement} section
 * @property {Function} [IntersectionObserver]
 *
 * @typedef {Object} PanelAligner
 * @property {Function} track
 * @property {Function} destroy
 */

/**
 * @param {PanelAlignerOpts} opts
 * @return {PanelAligner}
 */
function createPanelAligner( opts ) {
	const section = opts.section;
	const IO = opts.IntersectionObserver || window.IntersectionObserver;

	const THRESHOLD = 0.5;

	/** @type {HTMLElement|null} */
	let tracked = null;

	const observer = new IO( ( entries ) => {
		for ( const entry of entries ) {
			if ( entry.target === tracked && entry.intersectionRatio < THRESHOLD ) {
				section.scrollLeft = tracked.offsetLeft;
			}
		}
	}, { root: section, threshold: THRESHOLD } );

	/**
	 * @param {HTMLElement|null} panel
	 */
	function track( panel ) {
		if ( tracked === panel ) {
			return;
		}
		if ( tracked ) {
			observer.unobserve( tracked );
		}
		tracked = panel;
		if ( tracked ) {
			observer.observe( tracked );
		}
	}

	return {
		track,
		destroy() {
			observer.disconnect();
			tracked = null;
		}
	};
}

module.exports = createPanelAligner;
