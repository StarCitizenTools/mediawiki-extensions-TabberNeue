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

module.exports = { getElementSize, getHiddenElementSize, roundScrollLeft, setAttributes };
