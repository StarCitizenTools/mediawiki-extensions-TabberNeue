/**
 * DOM utility helpers for the tabber runtime.
 * Replaces the static-method Util class with named exports.
 */

/**
 * Returns the size of an element. For hidden elements (width/height === 0)
 * clones into a shadow DOM to compute the natural size.
 *
 * @param {HTMLElement} element
 * @param {'width'|'height'} type
 * @return {number}
 */
function getElementSize( element, type ) {
	if ( !element || !( element instanceof Element ) ||
		( type !== 'width' && type !== 'height' ) ) {
		mw.log.error( '[TabberNeue] Invalid element or type provided for getElementSize' );
		return 0;
	}
	let value = element.getBoundingClientRect()[ type ];
	if ( value === 0 ) {
		value = getHiddenElementSize( element, type );
	}
	return value;
}

/**
 * Retrieves the size of a hidden element by cloning it into a shadow DOM
 * and calculating the size.
 *
 * @param {HTMLElement} element
 * @param {'width'|'height'} type
 * @return {number}
 */
function getHiddenElementSize( element, type ) {
	const shadowRoot = document.createElement( 'div' )
		.attachShadow( { mode: 'open' } );
	const clone = element.cloneNode( true );
	clone.style.position = 'absolute';
	clone.style.visibility = 'hidden';
	shadowRoot.appendChild( clone );
	try {
		return clone.getBoundingClientRect()[ type ];
	} finally {
		clone.parentNode.removeChild( clone );
	}
}

/**
 * Whether an activation source arrives as a burst rather than as one deliberate
 * act. Find-as-you-type re-reveals across panels on successive keystrokes, so
 * entry animations are skipped for it: otherwise each activation cancels the
 * previous animation mid-flight and strands its `animationend` listener.
 *
 * Central so every consumer agrees on the set.
 *
 * @param {string} [source] one of the `tabber:tabchange` detail.source values
 * @return {boolean}
 */
function isBurstSource( source ) {
	return source === 'find';
}

/**
 * Browsers report fractional scrollLeft values inconsistently. Math.ceil
 * matches the rounding used by the active-tab-into-view logic.
 *
 * @param {number} val
 * @return {number}
 */
function roundScrollLeft( val ) {
	return Math.ceil( val );
}

/**
 * The panel whose column the section is currently resting on.
 *
 * Panels are full-width grid columns, and setActivePanel() shows one by writing
 * `section.scrollLeft = panel.offsetLeft`. This is the inverse of that write: it
 * maps a scroll offset back to the panel it belongs to, including an offset the
 * browser produced on its own while revealing a find-in-page match.
 *
 * @param {HTMLElement} section
 * @param {Iterable<HTMLElement>} panels
 * @return {HTMLElement|null} null when the section has no layout to measure
 */
function panelAtScrollOffset( section, panels ) {
	// Inside a display:none ancestor every offset reads 0, which would otherwise
	// resolve to the first panel and silently reset the active tab.
	if ( section.clientWidth === 0 ) {
		return null;
	}
	let match = null;
	let smallestDelta = Infinity;
	for ( const panel of panels ) {
		const delta = Math.abs( panel.offsetLeft - section.scrollLeft );
		if ( delta < smallestDelta ) {
			smallestDelta = delta;
			match = panel;
		}
	}
	return match;
}

/**
 * Sets the attributes of the given element based on the provided attributes object.
 *
 * @param {HTMLElement} element
 * @param {Object} attributes - Key-value pairs of attributes to set.
 */
function setAttributes( element, attributes ) {
	for ( const key in attributes ) {
		element.setAttribute( key, attributes[ key ] );
	}
}

module.exports = {
	getElementSize,
	getHiddenElementSize,
	isBurstSource,
	panelAtScrollOffset,
	roundScrollLeft,
	setAttributes
};
