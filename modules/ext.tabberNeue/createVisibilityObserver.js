/**
 * Per-tabber visibility observer.
 *
 * @typedef {Object} VisibilityObserverOpts
 * @property {HTMLElement} element
 * @property {Function} [IntersectionObserver]
 * @property {Function} onShow
 * @property {Function} onHide
 *
 * @typedef {Object} VisibilityObserver
 * @property {Function} destroy
 */

/**
 * Create an IntersectionObserver that fires onShow/onHide for viewport entry/exit.
 *
 * @param {VisibilityObserverOpts} opts
 * @return {VisibilityObserver}
 */
function createVisibilityObserver( opts ) {
	const element = opts.element;
	// eslint-disable-next-line compat/compat
	const IO = opts.IntersectionObserver || window.IntersectionObserver;
	const onShow = opts.onShow;
	const onHide = opts.onHide;

	const observer = new IO( ( entries ) => {
		for ( const entry of entries ) {
			if ( entry.isIntersecting ) {
				onShow();
			} else {
				onHide();
			}
		}
	} );
	observer.observe( element );

	return {
		destroy() {
			observer.disconnect();
		}
	};
}

module.exports = createVisibilityObserver;
