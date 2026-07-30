/**
 * Pure scroll math for the tabber overflow controller.
 * No DOM access, no globals, no mw — fully testable in isolation.
 *
 * Offsets are distances from the start edge growing toward the end edge, not
 * physical scrollLeft values, so the same arithmetic holds in both directions.
 * createOverflowController normalises them.
 *
 * @typedef {Object} OverflowMetrics
 * @property {number} scrollDistance
 * @property {number} scrollWidth
 * @property {number} clientWidth
 *
 * @typedef {Object} TabMetrics
 * @property {number} scrollDistance
 * @property {number} scrollWidth
 * @property {number} clientWidth
 * @property {number} tabStart
 * @property {number} tabWidth
 */

/**
 * @param {OverflowMetrics} metrics
 * @return {boolean}
 */
function isOverflowing( metrics ) {
	return metrics.scrollWidth > metrics.clientWidth;
}

/**
 * @param {OverflowMetrics} metrics
 * @return {boolean}
 */
function isAtStart( metrics ) {
	return metrics.scrollDistance <= 0;
}

/**
 * @param {OverflowMetrics} metrics
 * @return {boolean}
 */
function isAtEnd( metrics ) {
	return metrics.scrollDistance + metrics.clientWidth >= metrics.scrollWidth;
}

/**
 * @param {TabMetrics} metrics — includes tab position (required).
 * @param {number} buttonWidth — width in px of each prev/next overflow button.
 * @return {number|null} new scroll distance, or null if no scroll needed.
 */
function calculateNewScrollDistance( metrics, buttonWidth ) {
	const hasPrevButton = metrics.scrollDistance > 0;
	const hasNextButton =
		metrics.scrollDistance + metrics.clientWidth < metrics.scrollWidth;

	const visibleStart = metrics.scrollDistance + ( hasPrevButton ? buttonWidth : 0 );
	const visibleEnd =
		metrics.scrollDistance + metrics.clientWidth - ( hasNextButton ? buttonWidth : 0 );

	const tabStart = metrics.tabStart;
	const tabEnd = tabStart + metrics.tabWidth;

	if ( tabStart < visibleStart ) {
		return tabStart - buttonWidth;
	}
	if ( tabEnd > visibleEnd ) {
		return tabEnd - metrics.clientWidth + buttonWidth;
	}
	return null;
}

module.exports = { isOverflowing, isAtStart, isAtEnd, calculateNewScrollDistance };
