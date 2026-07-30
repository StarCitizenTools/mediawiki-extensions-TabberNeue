const overflowMath = require( './overflowMath.js' );
const { roundScrollLeft } = require( './domHelpers.js' );

/**
 * @typedef {Object} OverflowControllerOpts
 * @property {HTMLElement} tablist
 * @property {HTMLElement} header
 * @property {boolean} [animationsEnabled=true]
 * @property {boolean} [enabled=true] When false, the controller never reports
 *   overflow and never shows the prev/next arrows or edge masks. Used in wrap
 *   mode, where a single tab wider than the container still produces horizontal
 *   overflow (tabs are `white-space: nowrap`) but the arrows are meaningless
 *   because the tablist is not scrollable (`overflow: visible`).
 * @property {boolean} [rtl=false] Direction of the tablist's own layout, which
 *   is what decides the sign of scrollLeft. Injected rather than read from
 *   getComputedStyle so the unit is testable against a plain-object tablist.
 * @property {number} [arrowWidth=0] Width in px of each prev/next button, used
 *   to keep a scrolled-to tab clear of the overlay. 0 reserves nothing, which
 *   is correct wherever the arrows are absent.
 * @property {Function} [raf]
 *
 * @typedef {Object} OverflowController
 * @property {Function} update
 * @property {Function} scrollTabIntoView
 * @property {Function} scrollBy
 * @property {Function} getMetrics
 * @property {Function} isOverflowing
 * @property {Function} destroy
 */

/**
 * @param {OverflowControllerOpts} opts
 * @return {OverflowController}
 */
function createOverflowController( opts ) {
	const tablist = opts.tablist;
	const header = opts.header;
	const animationsEnabled = opts.animationsEnabled !== false;
	const enabled = opts.enabled !== false;
	const rtl = opts.rtl === true;
	const arrowWidth = opts.arrowWidth || 0;
	const raf = opts.raf || window.requestAnimationFrame.bind( window );
	let overflowing = false;

	/**
	 * @param {number} scrollLeft
	 * @return {number} distance from the start edge, always >= 0 at rest.
	 */
	function toScrollDistance( scrollLeft ) {
		return roundScrollLeft( rtl ? -scrollLeft : scrollLeft );
	}

	/**
	 * @param {number} distance
	 * @return {number} scrollLeft value to write.
	 */
	function toScrollLeft( distance ) {
		return rtl ? 0 - distance : distance;
	}

	function getMetrics( tab ) {
		const metrics = {
			scrollDistance: toScrollDistance( tablist.scrollLeft ),
			scrollWidth: tablist.scrollWidth,
			clientWidth: tablist.clientWidth
		};
		if ( tab ) {
			metrics.tabStart = rtl ?
				tablist.clientWidth - tab.offsetLeft - tab.offsetWidth :
				tab.offsetLeft;
			metrics.tabWidth = tab.offsetWidth;
		}
		return metrics;
	}

	function update( metrics ) {
		if ( !enabled ) {
			// Wrap mode: never show arrows/masks even when an over-wide tab
			// causes horizontal overflow, since the tablist is not scrollable.
			overflowing = false;
			header.classList.remove(
				'tabber__header--prev-visible',
				'tabber__header--next-visible'
			);
			return;
		}
		const m = metrics || getMetrics();
		overflowing = overflowMath.isOverflowing( m );
		if ( !overflowing ) {
			header.classList.remove(
				'tabber__header--prev-visible',
				'tabber__header--next-visible'
			);
			return;
		}
		header.classList.toggle( 'tabber__header--prev-visible', !overflowMath.isAtStart( m ) );
		header.classList.toggle( 'tabber__header--next-visible', !overflowMath.isAtEnd( m ) );
	}

	function scrollTabIntoView( tab ) {
		if ( !overflowing ) {
			return;
		}
		const metrics = getMetrics( tab );
		const newDistance = overflowMath.calculateNewScrollDistance( metrics, arrowWidth );
		if ( newDistance === null || newDistance === metrics.scrollDistance ) {
			return;
		}
		const newScrollLeft = toScrollLeft( newDistance );
		if ( animationsEnabled ) {
			// Smooth scroll fires `scroll` events as it progresses; the caller's
			// onTablistScroll handler will trigger update() during the animation.
			tablist.scrollTo( { left: newScrollLeft, behavior: 'smooth' } );
		} else {
			// Instant scroll fires no progressive events, so update once now.
			tablist.scrollLeft = newScrollLeft;
			update();
		}
	}

	/**
	 * @param {number} offset Signed distance to travel, positive toward the end
	 *   edge. Callers stay direction-agnostic; the sign is applied here.
	 */
	function scrollBy( offset ) {
		const currentDistance = toScrollDistance( tablist.scrollLeft );
		const maxDistance = tablist.scrollWidth - tablist.clientWidth;
		const targetDistance = Math.min( Math.max( currentDistance + offset, 0 ), maxDistance );
		raf( () => {
			tablist.scrollLeft = toScrollLeft( targetDistance );
		} );
	}

	return {
		update,
		scrollTabIntoView,
		scrollBy,
		getMetrics,
		isOverflowing: () => overflowing,
		destroy() { /* no listeners attached at construction */ }
	};
}

module.exports = createOverflowController;
