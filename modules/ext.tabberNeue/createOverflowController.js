const overflowMath = require( './overflowMath.js' );
const { roundScrollLeft } = require( './domHelpers.js' );

const OVERFLOW_BUTTON_WIDTH_RATIO = 0.2;

/**
 * @typedef {Object} OverflowControllerOpts
 * @property {HTMLElement} tablist
 * @property {HTMLElement} header
 * @property {boolean} [animationsEnabled=true]
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
	const raf = opts.raf || window.requestAnimationFrame.bind( window );
	let overflowing = false;

	function getMetrics( tab ) {
		const metrics = {
			scrollLeft: roundScrollLeft( tablist.scrollLeft ),
			scrollWidth: tablist.scrollWidth,
			offsetWidth: tablist.offsetWidth,
			clientWidth: tablist.clientWidth,
			headerWidth: header.offsetWidth
		};
		if ( tab ) {
			metrics.tabLeft = tab.offsetLeft;
			metrics.tabWidth = tab.offsetWidth;
		}
		return metrics;
	}

	function update( metrics ) {
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
		const newScrollLeft = overflowMath.calculateNewScrollLeft(
			metrics, OVERFLOW_BUTTON_WIDTH_RATIO
		);
		if ( newScrollLeft === null || newScrollLeft === metrics.scrollLeft ) {
			return;
		}
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

	function scrollBy( offset ) {
		const currentScroll = roundScrollLeft( tablist.scrollLeft );
		const maxScroll = tablist.scrollWidth - tablist.offsetWidth;
		const targetScroll = Math.min( Math.max( currentScroll + offset, 0 ), maxScroll );
		raf( () => {
			tablist.scrollLeft = targetScroll;
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
