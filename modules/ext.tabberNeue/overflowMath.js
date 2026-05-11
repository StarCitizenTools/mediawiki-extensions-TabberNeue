/**
 * Pure scroll math for the tabber overflow controller.
 * No DOM access, no globals, no mw — fully testable in isolation.
 *
 * @typedef {Object} OverflowMetrics
 * @property {number} scrollLeft
 * @property {number} scrollWidth
 * @property {number} offsetWidth
 * @property {number} clientWidth
 * @property {number} headerWidth
 *
 * @typedef {Object} TabMetrics
 * @property {number} scrollLeft
 * @property {number} scrollWidth
 * @property {number} offsetWidth
 * @property {number} clientWidth
 * @property {number} headerWidth
 * @property {number} tabLeft
 * @property {number} tabWidth
 */

/**
 * @param {OverflowMetrics} metrics
 * @return {boolean}
 */
function isOverflowing( metrics ) {
	return metrics.scrollWidth > metrics.offsetWidth;
}

/**
 * @param {OverflowMetrics} metrics
 * @return {boolean}
 */
function isAtStart( metrics ) {
	return metrics.scrollLeft <= 0;
}

/**
 * @param {OverflowMetrics} metrics
 * @return {boolean}
 */
function isAtEnd( metrics ) {
	return metrics.scrollLeft + metrics.offsetWidth >= metrics.scrollWidth;
}

/**
 * @param {TabMetrics} metrics — includes tab position (required).
 * @param {number} buttonWidthRatio — fraction of headerWidth occupied by each
 *   prev/next overflow button (0..1).
 * @return {number|null} new scrollLeft, or null if no scroll needed.
 */
function calculateNewScrollLeft( metrics, buttonWidthRatio ) {
	const buttonWidth = metrics.headerWidth * buttonWidthRatio;

	const hasPrevButton = metrics.scrollLeft > 0;
	const hasNextButton =
		metrics.scrollLeft + metrics.clientWidth < metrics.scrollWidth;

	const visibleLeft = metrics.scrollLeft + ( hasPrevButton ? buttonWidth : 0 );
	const visibleRight =
		metrics.scrollLeft + metrics.clientWidth - ( hasNextButton ? buttonWidth : 0 );

	const tabLeft = metrics.tabLeft;
	const tabRight = tabLeft + metrics.tabWidth;

	if ( tabLeft < visibleLeft ) {
		return tabLeft - buttonWidth;
	}
	if ( tabRight > visibleRight ) {
		return tabRight - metrics.clientWidth + buttonWidth;
	}
	return null;
}

module.exports = { isOverflowing, isAtStart, isAtEnd, calculateNewScrollLeft };
